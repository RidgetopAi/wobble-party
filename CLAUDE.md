# Wobble Party — agent guide

Music-reactive 3D party for Omarchy. Desktop audio (cliamp, Spotify in Chromium, anything on the
default sink) is analysed live; a DJ wobbler and a crowd of wobblers dance, sing and react, with a
directed camera. Ships as an Omarchy plugin (`omarchy plugin add <git-url>`).

## Memory: backstory, not Mandrel

This project does **not** use Mandrel (ignore the Mandrel sections of `~/projects/CLAUDE.md`).
Continuity lives in **backstory** (`~/.claude/skills/backstory/SKILL.md`):

- session start: `recall` for this project (skip if a SessionStart block already delivered it)
- choosing between alternatives → `note decision`, one line
- claiming done → `note outcome` citing a `timeline` event id
- stopping → `note handoff`: what is true, what is next, what not to do

## Layout

| Path | What |
| --- | --- |
| `brain/` | Rust crate `wobble-brain`: PipeWire capture, analysis, WebSocket + static server, `analyze` CLI |
| `stage/` | Vite + TypeScript + Three.js renderer (the party) |
| `tools/` | Feedback loops: offline render, contact sheets, eval scripts |
| `bin/wobble-party` | Launcher: starts brain, opens Chromium `--app` window |
| `manifest.json`, `*.qml` | Omarchy plugin surface |
| `music/` | Local test audio (git-ignored). `music/cc/tracks.tsv` lists CC tracks + BPM ground truth |

## Signal path (trace it, don't guess)

```
default sink monitor (pw-record) → brain: frames → bands/flux/onsets → beat clock
  → sections (build/drop/breakdown) → vocal (presence, syllables, pitch, phrases)
  → WebSocket JSON frames → stage: MusicState → director (camera/show) → wobbler brains → rigs
```

If a reaction looks wrong, find the first layer where the signal is wrong.

## Verify

```bash
cargo test --manifest-path brain/Cargo.toml       # analysis unit + ground-truth tests
cd stage && npm run build && npm run check        # type-check + build
node tools/render.mjs <track> ...                 # offline frames / contact sheet / video
```

The legacy React dashboard lives on the `legacy` branch (reference only).
