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
| `brain/` | Rust `wobble-brain`: pw-record capture, analysis (beat, sections, vocal GRU), MPRIS now-playing, WebSocket + embedded stage |
| `brain/model/vocal.bin` | trained singing-voice GRU (see `docs/TRAINING_DATA.md`) |
| `stage/` | Vite + TS + Three.js party. `stage/dist` is committed and embedded into the brain |
| `bin/wobble-party` | launcher: open / toggle / stop / status (Chromium app window on wobble.localhost) |
| `BarWidget.qml`, `manifest.json` | Omarchy bar widget (the wobbling wobbler) |
| `packaging/` | install.sh (builds outside the plugin dir), desktop entry, icon, Hyprland rules |
| `tools/` | feedback loops (see below) |
| `music/` | local test audio, git-ignored. `music/cc/tracks.tsv` = CC songs + BPM truth; `music/stems/` = training stems |

## Signal path (trace it, don't guess)

```
default sink monitor (pw-record, AU header skipped) -> brain: bands/flux/kicks -> beat clock
  -> sections (build/drop/calm) -> vocal GRU (presence, level, syllables) + pitch
  -> WebSocket frames + theme + track -> stage: Music (predictive beat clock)
  -> show/camera directors -> dancers -> rigs -> render
```

## Verify (feedback loops)

Run the stage dev server first (`cd stage && npx vite`, port 5188) and a brain for theme/art
endpoints (`brain/target/release/wobble-brain serve --static stage/dist`).

```bash
cd stage && npx tsc --noEmit && npm run build     # then cargo build --release in brain/
uv run tools/report.py out/*.jsonl                # tempo/vocal/drop stats (after wobble-brain analyze)
node tools/timing.mjs <track> --start 40 --dur 40 # landing-vs-beat error (target: median ~0 ms)
node tools/render.mjs <track> --start 130 --dur 16 --sheet 16   # video + contact sheet
node tools/strip.mjs <track> --start 64 --shot heroClose        # consecutive frames
node tools/themes.mjs                             # all installed themes in one sheet
node tools/probe.mjs 10                           # live brain: frames, theme, now playing
uv run tools/vocal_train.py --reuse               # retrain the vocal net on cached data
```

Gotchas: `pkill -f <pattern>` kills your own shell (use `pgrep -x wobble-brain` or `[b]racket`
patterns). Hyprland 0.56 `hyprctl dispatch` takes Lua (`hl.dsp...`). Never build inside the
plugin dir (inotify reloads). The legacy React dashboard is on the `legacy` branch.
