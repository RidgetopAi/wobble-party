#!/usr/bin/env bash
# Install Wobble Party for the current user. No root, no system directories.
#
#   ./packaging/install.sh              build and install
#   ./packaging/install.sh --uninstall  remove everything this installed
#
# Idempotent: re-running upgrades in place. Needs cargo (Rust); the stage is
# prebuilt and embedded into the binary, so node is not needed.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BINDIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
APPDIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONDIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/wobble-party"
PLUGIN_ID="ridgetopai.wobble-party"
PLUGIN_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/omarchy/plugins/$PLUGIN_ID"

die() { echo "install.sh: $*" >&2; exit 1; }
say() { printf '  %s\n' "$*"; }
# Remove a file and report it only if it was there (uninstall must not lie).
drop() {
  [[ -e $1 || -L $1 ]] || return 0
  rm -f "$1" && say "removed $1"
}

if [[ ${1:-} == --uninstall ]]; then
  echo "Removing Wobble Party..."
  "$BINDIR/wobble-party" stop 2>/dev/null || true
  drop "$BINDIR/wobble-party"
  drop "$BINDIR/wobble-brain"
  drop "$APPDIR/wobble-party.desktop"
  drop "$ICONDIR/wobble-party.svg"
  # The bar plugin: namespaced to our id, so removing it is safe. The parent
  # plugins/ directory is Omarchy's and is only removed if empty.
  if [[ -d $PLUGIN_DIR ]]; then
    rm -rf "$PLUGIN_DIR"
    say "removed $PLUGIN_DIR"
    rmdir "$(dirname "$PLUGIN_DIR")" 2>/dev/null || true
  fi
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q "$APPDIR" || true
  echo
  echo "Done. Left alone on purpose:"
  echo "  - $STATE (logs and the party's browser profile)"
  echo "  - Hyprland rules, if you copied packaging/hyprland/wobble-party.lua"
  exit 0
fi

command -v cargo >/dev/null 2>&1 || die "cargo not found. Install Rust (omarchy: Install > Development > Rust, or https://rustup.rs)"
command -v pw-record >/dev/null 2>&1 || die "pw-record not found (PipeWire tools). Wobble Party listens through PipeWire."
[[ -f $REPO_ROOT/stage/dist/index.html ]] || die "stage/dist is missing — run 'npm ci && npm run build' in stage/ first"

# Never build inside the plugin directory: Omarchy's shell watches it with a
# recursive inotifywait and reloads the plugin on every file cargo writes,
# killing the build (learned the hard way in Omarcade).
if [[ $REPO_ROOT -ef $PLUGIN_DIR ]]; then
  export CARGO_TARGET_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/wobble-party/target"
  say "building in $CARGO_TARGET_DIR (outside the watched plugin directory)"
fi
TARGET="${CARGO_TARGET_DIR:-$REPO_ROOT/brain/target}"

echo "Building the wobble brain (release)..."
cargo build --release --manifest-path "$REPO_ROOT/brain/Cargo.toml"
[[ -x $TARGET/release/wobble-brain ]] || die "build finished but $TARGET/release/wobble-brain is missing"

echo "Installing..."
mkdir -p "$BINDIR" "$APPDIR" "$ICONDIR" "$STATE"
install -m 755 "$TARGET/release/wobble-brain" "$BINDIR/wobble-brain"
say "installed $BINDIR/wobble-brain"
install -m 755 "$REPO_ROOT/bin/wobble-party" "$BINDIR/wobble-party"
say "installed $BINDIR/wobble-party"
install -m 644 "$REPO_ROOT/packaging/wobble-party.svg" "$ICONDIR/wobble-party.svg"
sed "s|@BINDIR@|$BINDIR|g" "$REPO_ROOT/packaging/wobble-party.desktop" >"$APPDIR/wobble-party.desktop"
say "installed $APPDIR/wobble-party.desktop"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q "$APPDIR" || true

echo
echo "Wobble Party is installed. Start it with:  wobble-party"
echo "Optional keybinding (add to ~/.config/hypr/bindings.lua):"
echo "  o.bind(\"SUPER + ALT + W\", \"Wobble Party\", \"wobble-party toggle\")"
echo "Optional window rules: packaging/hyprland/wobble-party.lua"
if [[ ! $REPO_ROOT -ef $PLUGIN_DIR ]]; then
  echo "Bar widget: omarchy plugin add https://github.com/RidgetopAi/wobble-party --enable"
fi
