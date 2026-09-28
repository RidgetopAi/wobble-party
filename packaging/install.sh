#!/usr/bin/env bash
# Install Wobble Party for the current user. No root, no system directories.
#
#   ./packaging/install.sh              build and install
#   ./packaging/install.sh --uninstall  remove what this installed
#
# Idempotent: re-running upgrades in place. Needs cargo (Rust); the stage is
# prebuilt and embedded into the binary, so node is not needed.
#
# Ownership: every file written is recorded with its SHA-256 in
# $STATE/installed. A path is only replaced or removed if it is absent or
# still has the bytes we wrote, never through a symlink, so a file of the
# same name that belongs to something else is left alone.

set -euo pipefail
umask 022

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BINDIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
APPDIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONDIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/wobble-party"
LEDGER="$STATE/installed"
PLUGIN_ID="ridgetopai.wobble-party"
PLUGIN_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/omarchy/plugins/$PLUGIN_ID"

die() { echo "install.sh: $*" >&2; exit 1; }
say() { printf '  %s\n' "$*"; }
hash_of() { sha256sum -- "$1" | cut -d' ' -f1; }

# The hash we recorded for a path, if any.
recorded() {
  [[ -f $LEDGER && ! -L $LEDGER ]] || return 1
  awk -v p="$1" 'substr($0, 67) == p { h = substr($0, 1, 64) } END { if (h == "") exit 1; print h }' "$LEDGER"
}

# Installs from before the ledger existed: accept a file only if its bytes
# are exactly a version this repository published (SHA-256), never by a
# marker in its content. The brain binary has no fixed bytes, so an old one
# without a ledger entry is never touched; the user is asked to move it.
LEGACY_LAUNCHER=(
  8f233d629019e4dfa06615677b6838969c3e0b8518a4555f4601a189a75cd75c
  c34e0ae5ca72a8c754ca798ed3d202e0b09c636e373fb27c36208b804cb6324d
  d9155def12479f7755bf4ba5dcb948b14b17afb26ba0b3d9721ce1da92c4ce0f
)
LEGACY_ICON=(e9097d7a880850ea68a6d0cf16bafe3bfbfd962182e8a225b9434da951d122ab)
# The desktop entry is the template with @BINDIR@ filled in; undo that first.
LEGACY_DESKTOP=(d1fe3bf0c7e13aa9f676b7741e8a8dc3a89a695740bfed282fa05781d39583c8)
legacy_ours() {
  local h
  case "$1" in
    "$BINDIR/wobble-party") h="$(hash_of "$1")"; [[ " ${LEGACY_LAUNCHER[*]} " == *" $h "* ]] ;;
    "$ICONDIR/wobble-party.svg") h="$(hash_of "$1")"; [[ " ${LEGACY_ICON[*]} " == *" $h "* ]] ;;
    "$APPDIR/wobble-party.desktop")
      h="$(sed "s|$BINDIR|@BINDIR@|g" -- "$1" | sha256sum | cut -d' ' -f1)"
      [[ " ${LEGACY_DESKTOP[*]} " == *" $h "* ]] ;;
    *) return 1 ;;
  esac
}

# May we replace or remove this path?
ours_or_absent() {
  local p=$1 want
  [[ -L $p ]] && return 1
  [[ -e $p ]] || return 0
  [[ -f $p ]] || return 1
  if want="$(recorded "$p")"; then
    [[ $(hash_of "$p") == "$want" ]]
  else
    legacy_ours "$p"
  fi
}

ledger_set() {
  local p=$1 h=$2 tmp
  tmp="$(mktemp "$STATE/.installed.XXXXXX")"
  { [[ -f $LEDGER && ! -L $LEDGER ]] && awk -v p="$p" 'substr($0, 67) != p' "$LEDGER"; [[ -n $h ]] && printf '%s  %s\n' "$h" "$p"; } >"$tmp" || true
  mv -fT -- "$tmp" "$LEDGER"
}

# place SRC DEST MODE: write via a temp file in DEST's directory, then an
# atomic rename (which replaces a path, never writes through a link).
place() {
  local src=$1 dest=$2 mode=$3 tmp
  if ! ours_or_absent "$dest"; then
    say "skipped $dest (exists and is not ours; move it aside and re-run)"
    SKIPPED=1
    return 0
  fi
  mkdir -p -- "$(dirname -- "$dest")"
  tmp="$(mktemp "$(dirname -- "$dest")/.wobble-party.XXXXXX")"
  install -m "$mode" -- "$src" "$tmp"
  mv -fT -- "$tmp" "$dest"
  ledger_set "$dest" "$(hash_of "$dest")"
  say "installed $dest"
}

# unplace DEST: remove it only if it is still exactly what we installed.
unplace() {
  local p=$1
  if [[ ! -e $p && ! -L $p ]]; then
    ledger_set "$p" ""
    return 0
  fi
  if ours_or_absent "$p"; then
    rm -f -- "$p"
    say "removed $p"
    ledger_set "$p" ""
  else
    say "left $p alone (changed since install, or not ours)"
  fi
}

mkdir -p -m 700 -- "$STATE"
[[ -d $STATE && ! -L $STATE ]] || die "$STATE is not a directory"
SKIPPED=0
FILES=("$BINDIR/wobble-party" "$BINDIR/wobble-brain" "$APPDIR/wobble-party.desktop" "$ICONDIR/wobble-party.svg")

if [[ ${1:-} == --uninstall ]]; then
  echo "Removing Wobble Party..."
  [[ -x $BINDIR/wobble-party ]] && ours_or_absent "$BINDIR/wobble-party" && "$BINDIR/wobble-party" stop 2>/dev/null || true
  for f in "${FILES[@]}"; do unplace "$f"; done
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q "$APPDIR" || true
  echo
  echo "Done. Left alone on purpose:"
  echo "  - $STATE (logs and the party's browser profile; delete it to remove those too)"
  echo "  - Hyprland rules, if you copied packaging/hyprland/wobble-party.lua"
  if [[ -d $PLUGIN_DIR ]]; then
    echo "  - the bar plugin itself: remove it with  omarchy plugin remove $PLUGIN_ID"
  fi
  exit 0
fi

command -v cargo >/dev/null 2>&1 || die "cargo not found. Install Rust (omarchy: Install > Development > Rust, or https://rustup.rs)"
[[ -x /usr/bin/pw-record ]] || die "/usr/bin/pw-record not found (PipeWire tools). Wobble Party listens through PipeWire."
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
# --locked: build exactly the dependency versions in Cargo.lock.
cargo build --release --locked --manifest-path "$REPO_ROOT/brain/Cargo.toml"
[[ -x $TARGET/release/wobble-brain ]] || die "build finished but $TARGET/release/wobble-brain is missing"

echo "Installing..."
desktop="$(mktemp "$STATE/.desktop.XXXXXX")"
trap 'rm -f -- "$desktop"' EXIT
sed "s|@BINDIR@|$BINDIR|g" "$REPO_ROOT/packaging/wobble-party.desktop" >"$desktop"
place "$TARGET/release/wobble-brain" "$BINDIR/wobble-brain" 755
place "$REPO_ROOT/bin/wobble-party" "$BINDIR/wobble-party" 755
place "$REPO_ROOT/packaging/wobble-party.svg" "$ICONDIR/wobble-party.svg" 644
place "$desktop" "$APPDIR/wobble-party.desktop" 644
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q "$APPDIR" || true

echo
if [[ $SKIPPED == 1 ]]; then
  echo "Some files were skipped (see above); Wobble Party may not start until they are."
  exit 1
fi
echo "Wobble Party is installed. Start it with:  wobble-party"
echo "Optional keybinding (add to ~/.config/hypr/bindings.lua):"
echo "  o.bind(\"SUPER + ALT + W\", \"Wobble Party\", \"wobble-party toggle\")"
echo "Optional window rules: packaging/hyprland/wobble-party.lua"
if [[ ! $REPO_ROOT -ef $PLUGIN_DIR ]]; then
  echo "Bar widget: omarchy plugin add https://github.com/RidgetopAi/wobble-party --enable"
fi
