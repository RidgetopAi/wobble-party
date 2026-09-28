//! Now playing: which MPRIS player (cliamp, Spotify, a browser tab...) is
//! playing what. Read with `busctl` (systemd, always present on Omarchy), so
//! no D-Bus library is needed. The stage shows the title on the LED wall and
//! the cover art in calm passages.
//!
//! Players are other programs, so everything they report is bounded: busctl
//! output, string lengths, player count. Cover art is fetched only if it is a
//! real image of sane size: `file://` art must be a regular file we own, and
//! `http(s)://` art is fetched once, without redirects, only from a public
//! address (never loopback, LAN or tailnet), pinned to the address we checked.

use crate::limits::{self, MIB};
use serde_json::{Value, json};
use std::net::IpAddr;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::process::Command;
use tokio::sync::watch;

const BUSCTL: &str = "/usr/bin/busctl";
const CURL: &str = "/usr/bin/curl";
const ART_CAP: u64 = 8 * MIB;
const MAX_PLAYERS: usize = 16;
const MAX_FIELD: usize = 300;
const MAX_URL: usize = 2048;

#[derive(Default)]
pub struct ArtCache {
    /// Current art URL and its bytes (fetched lazily on first request).
    pub url: Option<String>,
    pub bytes: Option<(Vec<u8>, &'static str)>,
}

pub type SharedArt = Arc<Mutex<ArtCache>>;

async fn busctl(args: &[&str]) -> Option<Value> {
    let mut cmd = Command::new(BUSCTL);
    cmd.arg("--user").arg("--json=short").args(args);
    let out = limits::run_capped(cmd, 2 * MIB, Duration::from_secs(3)).await?;
    serde_json::from_slice(&out).ok()
}

async fn prop(name: &str, p: &str) -> Option<Value> {
    busctl(&["get-property", name, "/org/mpris/MediaPlayer2", "org.mpris.MediaPlayer2.Player", p])
        .await
        .map(|v| v["data"].clone())
}

fn meta_str(m: &Value, key: &str, max: usize) -> String {
    let v = &m[key]["data"];
    let s = match v {
        Value::String(s) => limits::clip(s, max),
        Value::Array(a) => a.iter().filter_map(|x| x.as_str()).take(8).map(|x| limits::clip(x, max)).collect::<Vec<_>>().join(", "),
        _ => String::new(),
    };
    limits::clip(&s, max)
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
        .filter(|n| n.starts_with("org.mpris.MediaPlayer2.") && n.len() <= 255)
        .take(MAX_PLAYERS)
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
    let player = limits::clip(name.trim_start_matches("org.mpris.MediaPlayer2.").split('.').next().unwrap_or(""), 64);
    // An over-long URL is dropped rather than clipped into a different one.
    let art = meta_str(&m, "mpris:artUrl", MAX_URL + 1);
    let art = if art.is_empty() || art.chars().count() > MAX_URL { Value::Null } else { json!(art) };
    json!({
        "type": "track",
        "playing": playing,
        "player": player,
        "title": meta_str(&m, "xesam:title", MAX_FIELD),
        "artist": meta_str(&m, "xesam:artist", MAX_FIELD),
        "album": meta_str(&m, "xesam:album", MAX_FIELD),
        "genre": meta_str(&m, "xesam:genre", MAX_FIELD),
        "artUrl": art,
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
        let path = percent_decode(path);
        if !path.starts_with('/') {
            return None;
        }
        tokio::task::spawn_blocking(move || limits::read_file(Path::new(&path), ART_CAP, true, true)).await.ok()??
    } else if url.starts_with("https://") || url.starts_with("http://") {
        fetch_public(&url).await?
    } else {
        return None;
    };
    let mime = limits::image_mime(&bytes)?;
    let mut a = art.lock().unwrap();
    if a.url.as_deref() == Some(url.as_str()) {
        a.bytes = Some((bytes.clone(), mime));
    }
    Some((bytes, mime))
}

/// Fetch an http(s) URL from a public address only. The host is resolved
/// here, checked, and curl is pinned to that address (`--resolve`) so a
/// second lookup cannot point it somewhere else. No redirects, no curlrc.
async fn fetch_public(url: &str) -> Option<Vec<u8>> {
    let (https, rest) = match url.split_once("://")? {
        ("https", r) => (true, r),
        ("http", r) => (false, r),
        _ => return None,
    };
    let authority = rest.split(['/', '?', '#']).next()?;
    // No userinfo, no IPv6 literals, no control characters.
    if authority.is_empty() || authority.contains(['@', '[', ']']) || url.chars().any(|c| c.is_control() || c == ' ') {
        return None;
    }
    let (host, port) = match authority.rsplit_once(':') {
        Some((h, p)) => (h, p.parse::<u16>().ok()?),
        None => (authority, if https { 443 } else { 80 }),
    };
    if host.is_empty() {
        return None;
    }
    let addrs = tokio::time::timeout(Duration::from_secs(3), tokio::net::lookup_host((host, port))).await.ok()?.ok()?;
    let addrs: Vec<_> = addrs.take(8).collect();
    // Every address the name resolves to must be public, not just the first.
    if addrs.is_empty() || !addrs.iter().all(|a| is_public(a.ip())) {
        return None;
    }
    let ip = match addrs[0].ip() {
        IpAddr::V4(v) => v.to_string(),
        IpAddr::V6(v) => format!("[{v}]"),
    };
    let mut cmd = Command::new(CURL);
    cmd.args(["-q", "-sf", "--proto", "=http,https", "--max-redirs", "0", "-m", "6"])
        .args(["--max-filesize", &ART_CAP.to_string()])
        .args(["--resolve", &format!("{host}:{port}:{ip}")])
        .arg("--")
        .arg(url);
    limits::run_capped(cmd, ART_CAP, Duration::from_secs(8)).await
}

fn is_public(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v) => {
            let [a, b, ..] = v.octets();
            !(v.is_loopback()
                || v.is_private()
                || v.is_link_local()
                || v.is_unspecified()
                || v.is_broadcast()
                || v.is_multicast()
                || v.is_documentation()
                || a == 0
                || (a == 100 && (64..128).contains(&b)) // CGNAT / tailnets
                || (a == 198 && (b == 18 || b == 19)) // benchmarking
                || a >= 240)
        }
        IpAddr::V6(v) => {
            if let Some(v4) = v.to_ipv4_mapped() {
                return is_public(IpAddr::V4(v4));
            }
            let s = v.segments();
            !(v.is_loopback()
                || v.is_unspecified()
                || v.is_multicast()
                || (s[0] & 0xfe00) == 0xfc00 // unique local
                || (s[0] & 0xffc0) == 0xfe80 // link local
                || (s[0] == 0x2001 && s[1] == 0x0db8) // documentation
                || (s[0] == 0x64 && s[1] == 0xff9b)) // NAT64 can reach IPv4 private space
        }
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn public_addresses() {
        for ip in ["151.101.1.1", "2606:4700::1"] {
            assert!(is_public(ip.parse().unwrap()), "{ip}");
        }
        for ip in ["127.0.0.1", "10.1.2.3", "192.168.1.1", "172.16.0.1", "169.254.1.1", "100.122.107.49", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "64:ff9b::a00:1"] {
            assert!(!is_public(ip.parse().unwrap()), "{ip}");
        }
    }

    #[tokio::test]
    async fn refuses_local_and_odd_urls() {
        for url in ["http://127.0.0.1:7477/health", "http://localhost/x", "http://user@example.com/", "http://[::1]/", "ftp://example.com/", "http://10.0.0.1/a.png", "http://exa mple.com/"] {
            assert!(fetch_public(url).await.is_none(), "{url}");
        }
    }
}
