//! Stage server: serves the built stage, streams analysis frames and theme
//! updates over a WebSocket at `/ws`.

use crate::analysis::Analyzer;
use crate::source::Source;
use crate::theme;
use axum::Router;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, State};
use axum::http::{StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use serde_json::Value;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use include_dir::{Dir, include_dir};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;
use tokio::sync::{broadcast, watch};
use tower_http::services::ServeDir;

/// The built stage, compiled into the binary (run `npm run build` in stage/
/// before `cargo build`). `--static DIR` serves from disk instead.
static STAGE: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/../stage/dist");

#[derive(Clone)]
struct AppState {
    frames: broadcast::Sender<Arc<str>>,
    theme: watch::Receiver<Arc<str>>,
    clients: Arc<AtomicUsize>,
}

pub struct Options {
    pub port: u16,
    pub source: Source,
    /// Serve the stage from disk (development) instead of the embedded copy.
    pub static_dir: Option<PathBuf>,
    pub loop_file: bool,
    /// Exit once no stage has been connected for this long (after the first).
    pub exit_when_idle: Option<Duration>,
}

pub async fn run(opts: Options) -> anyhow::Result<()> {
    let (frames, _) = broadcast::channel::<Arc<str>>(256);
    let (theme_tx, theme_rx) = watch::channel::<Arc<str>>(theme::current().to_string().into());

    spawn_analysis(opts.source.clone(), opts.loop_file, frames.clone());
    tokio::spawn(watch_theme(theme_tx));

    let clients = Arc::new(AtomicUsize::new(0));
    let state = AppState { frames, theme: theme_rx, clients: clients.clone() };
    let mut app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/theme/background", get(background))
        .route("/themes", get(|| async { axum::Json(theme::list()) }))
        .route("/themes/{name}", get(named_theme))
        .route("/health", get(|| async { "ok" }));
    app = match &opts.static_dir {
        Some(dir) => app.fallback_service(ServeDir::new(dir)),
        None => app.fallback(embedded),
    };
    let app = app.with_state(state);

    let listener = tokio::net::TcpListener::bind(("127.0.0.1", opts.port)).await?;
    eprintln!("wobble-brain: listening on http://127.0.0.1:{}", opts.port);
    let idle = opts.exit_when_idle;
    axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            tokio::select! {
                _ = tokio::signal::ctrl_c() => {}
                _ = idle_exit(clients, idle) => eprintln!("wobble-brain: no stage connected, exiting"),
            }
        })
        .await?;
    Ok(())
}

/// Resolves once the stage has gone away for `after` (never, if None).
async fn idle_exit(clients: Arc<AtomicUsize>, after: Option<Duration>) {
    let Some(after) = after else { return std::future::pending().await };
    let mut seen = false;
    let mut empty_since = Instant::now();
    loop {
        tokio::time::sleep(Duration::from_millis(500)).await;
        if clients.load(Ordering::Relaxed) > 0 {
            seen = true;
            empty_since = Instant::now();
        } else if seen && empty_since.elapsed() >= after {
            return;
        } else if !seen && empty_since.elapsed() >= after.max(Duration::from_secs(60)) {
            // The window never connected (closed early, crashed): don't linger.
            return;
        }
    }
}

async fn embedded(uri: axum::http::Uri) -> Response {
    let path = uri.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };
    match STAGE.get_file(path) {
        Some(f) => {
            let mime = match path.rsplit('.').next() {
                Some("html") => "text/html; charset=utf-8",
                Some("js") => "text/javascript",
                Some("css") => "text/css",
                Some("json") => "application/json",
                Some("svg") => "image/svg+xml",
                Some("png") => "image/png",
                Some("ttf") => "font/ttf",
                _ => "application/octet-stream",
            };
            ([(header::CONTENT_TYPE, mime)], f.contents()).into_response()
        }
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

fn spawn_analysis(source: Source, loop_file: bool, frames: broadcast::Sender<Arc<str>>) {
    std::thread::spawn(move || {
        let mut analyzer = Analyzer::new();
        let mut chunk = Vec::with_capacity(2048);
        loop {
            match source.open() {
                Ok(mut reader) => {
                    while let Ok(true) = reader.next_chunk(&mut chunk) {
                        analyzer.push(&chunk, |frame| {
                            if let Ok(json) = serde_json::to_string(&frame) {
                                let _ = frames.send(json.into());
                            }
                        });
                    }
                }
                Err(e) => eprintln!("wobble-brain: {e:#}"),
            }
            if matches!(source, Source::File { .. }) && !loop_file {
                eprintln!("wobble-brain: source finished");
                // Keep the clock alive with silence so the stage idles gracefully.
                let silence = vec![0.0f32; 1024];
                loop {
                    analyzer.push(&silence, |frame| {
                        if let Ok(json) = serde_json::to_string(&frame) {
                            let _ = frames.send(json.into());
                        }
                    });
                    std::thread::sleep(Duration::from_micros(10_667));
                }
            }
            // Capture ended (device change, pipewire restart): retry shortly.
            std::thread::sleep(Duration::from_millis(500));
        }
    });
}

async fn watch_theme(tx: watch::Sender<Arc<str>>) {
    let mut last = theme::stamp();
    loop {
        tokio::time::sleep(Duration::from_millis(700)).await;
        let now = theme::stamp();
        if now != last {
            last = now;
            // Give `omarchy theme set` a moment to finish writing every file.
            tokio::time::sleep(Duration::from_millis(250)).await;
            let _ = tx.send(theme::current().to_string().into());
        }
    }
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(move |socket| client(socket, state))
}

async fn client(socket: WebSocket, state: AppState) {
    state.clients.fetch_add(1, Ordering::Relaxed);
    serve_client(socket, &state).await;
    state.clients.fetch_sub(1, Ordering::Relaxed);
}

async fn serve_client(mut socket: WebSocket, state: &AppState) {
    let mut frames = state.frames.subscribe();
    let mut theme = state.theme.clone();
    let initial = theme.borrow_and_update().clone();
    if socket.send(Message::Text(initial.as_ref().into())).await.is_err() {
        return;
    }
    loop {
        tokio::select! {
            f = frames.recv() => match f {
                Ok(json) => {
                    if socket.send(Message::Text(json.as_ref().into())).await.is_err() {
                        return;
                    }
                }
                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                Err(_) => return,
            },
            changed = theme.changed() => {
                if changed.is_err() { return; }
                let msg = theme.borrow_and_update().clone();
                if socket.send(Message::Text(msg.as_ref().into())).await.is_err() {
                    return;
                }
            }
            incoming = socket.recv() => match incoming {
                Some(Ok(_)) => {}
                _ => return,
            },
        }
    }
}

async fn background() -> Response {
    let path = theme::background_path();
    match tokio::fs::read(&path).await {
        Ok(bytes) => {
            let mime = match path
                .canonicalize()
                .ok()
                .and_then(|p| p.extension().map(|e| e.to_string_lossy().to_lowercase()))
                .as_deref()
            {
                Some("png") => "image/png",
                Some("webp") => "image/webp",
                _ => "image/jpeg",
            };
            ([(header::CONTENT_TYPE, mime), (header::CACHE_CONTROL, "no-store")], bytes).into_response()
        }
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn named_theme(Path(name): Path<String>) -> Response {
    match theme::named(&name) {
        Some(v) => axum::Json::<Value>(v).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
