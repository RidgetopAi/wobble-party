//! Omarchy theme bridge: reads `colors.toml` for the current theme (or any
//! installed theme by name) and reports changes so the stage can re-light.

use crate::limits::{self, KIB};
use serde_json::{Map, Value, json};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

fn home() -> PathBuf {
    std::env::var_os("HOME").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("/"))
}

pub fn current_dir() -> PathBuf {
    home().join(".local/state/omarchy/current")
}

pub fn background_path() -> PathBuf {
    current_dir().join("background")
}

/// Theme directories searched when a theme is requested by name.
fn theme_roots() -> Vec<PathBuf> {
    vec![home().join(".config/omarchy/themes"), PathBuf::from("/usr/share/omarchy/themes")]
}

pub fn read_colors(path: &Path) -> Map<String, Value> {
    let mut out = Map::new();
    let Some(text) = limits::read_text(path, 64 * KIB) else { return out };
    let Ok(table) = text.parse::<toml::Table>() else { return out };
    for (k, v) in table.into_iter().take(64) {
        if let Some(s) = v.as_str() {
            out.insert(limits::clip(&k, 64), Value::String(limits::clip(s, 64)));
        }
    }
    out
}

/// Theme message for the current Omarchy theme.
pub fn current() -> Value {
    let dir = current_dir();
    let name = limits::read_text(&dir.join("theme.name"), KIB).map(|s| limits::clip(s.trim(), 64)).unwrap_or_default();
    let colors = read_colors(&dir.join("theme/colors.toml"));
    json!({ "type": "theme", "name": name, "colors": colors, "background": "/theme/background" })
}

/// Theme message for an installed theme, by folder name (for previews/tests).
pub fn named(name: &str) -> Option<Value> {
    if !name_ok(name) {
        return None;
    }
    for root in theme_roots() {
        let path = root.join(name).join("colors.toml");
        if path.exists() {
            let colors = read_colors(&path);
            return Some(json!({ "type": "theme", "name": name, "colors": colors, "background": null }));
        }
    }
    None
}

pub fn list() -> Vec<String> {
    let mut names: Vec<String> = theme_roots()
        .iter()
        .filter_map(|r| std::fs::read_dir(r).ok())
        .flatten()
        .flatten()
        .filter(|e| e.path().join("colors.toml").exists())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| name_ok(n))
        .take(512)
        .collect();
    names.sort();
    names.dedup();
    names
}

/// Theme folder names as Omarchy makes them: short, no paths, no markup.
fn name_ok(name: &str) -> bool {
    !name.is_empty() && name.len() <= 64 && !name.starts_with('.') && name.bytes().all(|b| b.is_ascii_alphanumeric() || b"._- ".contains(&b))
}

/// Fingerprint of the files that change on `omarchy theme set`.
pub fn stamp() -> Vec<Option<SystemTime>> {
    let dir = current_dir();
    [dir.join("theme.name"), dir.join("theme/colors.toml"), dir.join("background")]
        .iter()
        .map(|p| std::fs::metadata(p).and_then(|m| m.modified()).ok())
        .collect()
}
