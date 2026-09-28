//! Omarchy theme bridge: reads `colors.toml` for the current theme (or any
//! installed theme by name) and reports changes so the stage can re-light.

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
    let Ok(text) = std::fs::read_to_string(path) else { return out };
    let Ok(table) = text.parse::<toml::Table>() else { return out };
    for (k, v) in table {
        if let Some(s) = v.as_str() {
            out.insert(k, Value::String(s.to_string()));
        }
    }
    out
}

/// Theme message for the current Omarchy theme.
pub fn current() -> Value {
    let dir = current_dir();
    let name = std::fs::read_to_string(dir.join("theme.name")).unwrap_or_default().trim().to_string();
    let colors = read_colors(&dir.join("theme/colors.toml"));
    json!({ "type": "theme", "name": name, "colors": colors, "background": "/theme/background" })
}

/// Theme message for an installed theme, by folder name (for previews/tests).
pub fn named(name: &str) -> Option<Value> {
    if name.contains('/') || name.contains("..") {
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
        .collect();
    names.sort();
    names.dedup();
    names
}

/// Fingerprint of the files that change on `omarchy theme set`.
pub fn stamp() -> Vec<Option<SystemTime>> {
    let dir = current_dir();
    [dir.join("theme.name"), dir.join("theme/colors.toml"), dir.join("background")]
        .iter()
        .map(|p| std::fs::metadata(p).and_then(|m| m.modified()).ok())
        .collect()
}
