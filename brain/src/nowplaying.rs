//! Now playing: which MPRIS player (cliamp, Spotify, a browser tab...) is
//! playing what. Read with `busctl` (systemd, always present on Omarchy), so
//! no D-Bus library is needed. The stage shows the title on the LED wall and
//! the cover art in calm passages.

use serde_json::{Value, json};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::process::Command;
use tokio::sync::watch;

#[derive(Default)]
pub struct ArtCache {
    /// Current art URL and its bytes (fetched lazily on first request).
    pub url: Option<String>,
    pub bytes: Option<(Vec<u8>, &'static str)>,
}

pub type SharedArt = Arc<Mutex<ArtCache>>;

async fn busctl(args: &[&str]) -> Option<Value> {
    let out = Command::new("busctl").arg("--user").arg("--json=short").args(args).output().await.ok()?;
    if !out.status.success() {
        return None;
    }
    serde_json::from_slice(&out.stdout).ok()
}

async fn prop(name: &str, p: &str) -> Option<Value> {
    busctl(&["get-property", name, "/org/mpris/MediaPlayer2", "org.mpris.MediaPlayer2.Player", p])
        .await
        .map(|v| v["data"].clone())
}

fn meta_str(m: &Value, key: &str) -> String {
    let v = &m[key]["data"];
    match v {
        Value::String(s) => s.clone(),
        Value::Array(a) => a.iter().filter_map(|x| x.as_str()).collect::<Vec<_>>().join(", "),
        _ => String::new(),
    }
}

/// Poll MPRIS and publish a `track` message whenever it changes.
pub async fn watch(tx: watch::Sender<Arc<str>>, art: SharedArt) {
    let mut last = String::new();
    loop {
        let msg = snapshot().await;
        let key = msg.to_string();
        if key != last {
            last = key;
            {
                let mut a = art.lock().unwrap();
                let url = msg["artUrl"].as_str().map(str::to_string);
                if url != a.url {
                    a.url = url;
                    a.bytes = None;
                }
            }
            let mut out = msg.clone();
            if let Some(obj) = out.as_object_mut() {
                let has_art = obj.get("artUrl").and_then(Value::as_str).is_some();
                obj.remove("artUrl");
                // Cache-busting path so the stage reloads the image per track.
                let tag = format!("{:x}", fxhash(&last));
                obj.insert("art".into(), if has_art { json!(format!("nowplaying/art?{tag}")) } else { Value::Null });
            }
            let _ = tx.send(out.to_string().into());
        }
        tokio::time::sleep(Duration::from_millis(1500)).await;
    }
}

async fn snapshot() -> Value {
    let names: Vec<String> = busctl(&["list"])
        .await
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default()
        .iter()
        .filter_map(|e| e["name"].as_str())
        .filter(|n| n.starts_with("org.mpris.MediaPlayer2."))
        .map(str::to_string)
        .collect();
    let mut paused: Option<String> = None;
    for n in &names {
        match prop(n, "PlaybackStatus").await.as_ref().and_then(Value::as_str) {
            Some("Playing") => return describe(n, true).await,
            Some("Paused") if paused.is_none() => paused = Some(n.clone()),
            _ => {}
        }
    }
    match paused {
        Some(n) => describe(&n, false).await,
        None => json!({ "type": "track", "playing": false, "player": null, "title": "", "artist": "" }),
    }
}

async fn describe(name: &str, playing: bool) -> Value {
    let m = prop(name, "Metadata").await.unwrap_or(Value::Null);
    let player = name.trim_start_matches("org.mpris.MediaPlayer2.").split('.').next().unwrap_or("").to_string();
    let art = meta_str(&m, "mpris:artUrl");
    json!({
        "type": "track",
        "playing": playing,
        "player": player,
        "title": meta_str(&m, "xesam:title"),
        "artist": meta_str(&m, "xesam:artist"),
        "album": meta_str(&m, "xesam:album"),
        "genre": meta_str(&m, "xesam:genre"),
        "artUrl": if art.is_empty() { Value::Null } else { json!(art) },
    })
}

/// Fetch (once) and return the current cover art.
pub async fn art_bytes(art: &SharedArt) -> Option<(Vec<u8>, &'static str)> {
    let url = {
        let a = art.lock().unwrap();
        if let Some(b) = &a.bytes {
            return Some(b.clone());
        }
        a.url.clone()?
    };
    let bytes = if let Some(path) = url.strip_prefix("file://") {
        tokio::fs::read(percent_decode(path)).await.ok()?
    } else if url.starts_with("https://") || url.starts_with("http://") {
        let out = Command::new("curl").args(["-sfL", "-m", "6", "--max-filesize", "8000000", &url]).output().await.ok()?;
        if !out.status.success() {
            return None;
        }
        out.stdout
    } else {
        return None;
    };
    let mime = if bytes.starts_with(b"\x89PNG") {
        "image/png"
    } else if bytes.starts_with(b"RIFF") {
        "image/webp"
    } else {
        "image/jpeg"
    };
    let mut a = art.lock().unwrap();
    if a.url.as_deref() == Some(url.as_str()) {
        a.bytes = Some((bytes.clone(), mime));
    }
    Some((bytes, mime))
}

fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let Ok(v) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn fxhash(s: &str) -> u64 {
    s.bytes().fold(0xcbf29ce484222325u64, |h, b| (h ^ b as u64).wrapping_mul(0x100000001b3))
}
