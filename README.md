# Wobble Party

![Wobble Party](preview.png)

A 3D party for [Omarchy](https://omarchy.org). Play music — in **cliamp**, Spotify in the browser,
anything that comes out of your speakers — and open Wobble Party: a DJ wobbler spins behind the
booth while a crowd of wobbling vinyl toys bounces, sways, sings along and loses it on the drop.
Lights, lasers, LED walls, camera and crowd colours all follow your Omarchy theme.

Wobblers are weeble-style toys: no legs. They bob, squash, stretch, shimmy, rock, spin and jump on
their weighted round bottoms, with little arms for fist pumps, claps, waves and raising the roof.

## Install

```bash
omarchy plugin add https://github.com/RidgetopAi/wobble-party --enable
```

Then click the little wobbler in your bar. The first click builds the brain (needs Rust:
*Omarchy menu → Install → Development → Rust*), later clicks start and stop the party.

Or from a clone:

```bash
./packaging/install.sh          # builds and installs wobble-party + wobble-brain to ~/.local/bin
wobble-party                    # open the party (also in the app launcher)
wobble-party toggle             # open/close — bind it to a key:
#   ~/.config/hypr/bindings.lua:  o.bind("SUPER + ALT + W", "Wobble Party", "wobble-party toggle")
./packaging/install.sh --uninstall
```

Optional Hyprland rules (float, size, opacity, no idle while fullscreen) are in
[`packaging/hyprland/wobble-party.lua`](packaging/hyprland/wobble-party.lua). They are not applied
for you; copy them in if you want them.

### Remove

Installed as a plugin: run the uninstaller from the plugin folder first (it lives there), then
remove the plugin.

```bash
~/.config/omarchy/plugins/ridgetopai.wobble-party/packaging/install.sh --uninstall
omarchy plugin remove ridgetopai.wobble-party
```

The uninstaller removes only files it installed and that are unchanged (it records a SHA-256 of
each). It leaves `~/.local/state/wobble-party` (logs and the party window's browser profile);
delete that folder to remove those too.

## What it does on your machine

- **Installs** (no root, nothing outside your home): `~/.local/bin/wobble-party` and
  `wobble-brain`, a desktop entry, an icon, and state in `~/.local/state/wobble-party/`. Installed as
  a plugin, the build output goes to `~/.cache/wobble-party/target`, never inside the plugin folder. Needs `cargo`;
  the installer never installs a toolchain or anything system-wide.
- **Listens to audio** only while the party is open, from your default output's monitor with
  `pw-record`, the same way a level meter does. Nothing is recorded to disk or sent anywhere;
  the brain turns it into beat and loudness numbers.
- **Serves the stage** on `127.0.0.1:7477` only. Requests must come from your own user (checked
  per connection), with our loopback host names, so other websites and other users on the
  machine cannot read what you are playing. It exits a few seconds after the window closes.
- **Reads** the current Omarchy theme and wallpaper, and what your media player reports over
  MPRIS (title, artist, cover art link) with `busctl`.
- **Network:** the only outbound request is downloading the **cover art** URL your player reports
  (e.g. Spotify's image CDN): public addresses only, no redirects, 8 MB cap, images only. Local
  `file://` cover art is read only if it is an image file you own.
- **Opens** a Chromium app window with its own profile (so the party stays out of your browser
  session), or your default browser via `omarchy-launch-webapp` if Chromium is missing.

### Keys

| key | |
|---|---|
| `space` | next camera shot |
| `1`–`9` | hold a shot (wide, DJ, over-the-DJ, crowd dolly, hero close-up, crane, overhead, orbit, stage side) · `0` back to auto |
| `t` / `T` | preview the next installed theme / back to the current one |
| `f` | fullscreen |
| `d` | signal debugger (what the party is hearing) |
| `h` | help · `q` quit |

## How it works

```
default sink monitor (pw-record)
  -> wobble-brain (Rust, ~2% of a core)
       bands, onsets, kicks · causal tempo + beat-phase tracker · song sections (build / drop / calm)
       singing voice: a small GRU trained on a cappella ground truth -> presence, loudness, syllables, pitch
  -> WebSocket frames (~94/s) + your Omarchy theme
  -> stage (Three.js in a Chromium app window)
       music state with a predictive beat clock -> show director (lights, lasers, LEDs, confetti)
       -> camera director (cuts on bars, blends in calm, hero close-ups on vocal phrases)
       -> one choreographer per wobbler (personality, physics rig, face)
```

Nothing is rerouted: the brain listens to your default output's monitor, so it hears whatever is
playing, with no added latency to what you hear. It exits a few seconds after the window closes.

**Rhythm.** Beats come from a local clock extrapolated and phase-locked to the brain, so hops are
launched *before* the beat and land on it (measured: median landing error ~0 ms, all within ±60 ms,
with deliberate per-dancer humanising).

**Singing.** Mouths open with the singer's loudness, syllables pop, phrases make the crowd lean in
and sway, high notes stretch them taller. The detector is a 2-layer GRU (~120k parameters) running
in plain Rust on mel features; trained on 77 a cappellas x 57 instrumentals with augmentation, it
reaches AUC 0.88 on singers and instrumentals it never saw (the DSP-only baseline reached 0.65).

**Themes.** Each Omarchy theme becomes a light rig, crowd palette and venue; monochrome themes
become a black-and-white club full of candy-coloured wobblers, and light themes a daylight party. Theme changes cross-fade live.

![All 22 Omarchy themes](docs/img/themes.jpg)

## Develop

```bash
cd stage && npm ci && npm run dev            # stage on :5188 (proxies the brain)
cargo run --release --manifest-path brain/Cargo.toml -- serve --dev-origin http://127.0.0.1:5188   # brain on :7477
# http://127.0.0.1:5188/?demo  (no brain needed)   ?lab  (character lineup)
```

Rebuild the embedded stage with `npm run build` in `stage/` before `cargo build`.

Feedback loops in `tools/`:

| tool | checks |
|---|---|
| `report.py` | tempo vs BPM ground truth, vocal/drop/section stats, signal plots per track |
| `vocal_fit.py`, `vocal_train.py` | vocal detector against a cappella ground truth; trains and exports the GRU |
| `timing.mjs` | where the crowd's landings fall relative to the beat |
| `render.mjs` | deterministic video of a song section (with audio) + contact sheets |
| `themes.mjs` | the same moment under every installed theme |
| `shot.mjs`, `probe.mjs` | single-frame captures; live brain check |

## License

Code: [MIT](LICENSE). The singing-voice model `brain/model/vocal.bin` is **CC BY-NC 4.0**, because
it was trained on mostly non-commercial Creative Commons stems ([details](brain/model/LICENSE.md)).
Third-party material is listed in [NOTICE.md](NOTICE.md).

## Credits

- Vocal model training data: Creative Commons stems from ccMixter — see
  [docs/TRAINING_DATA.md](docs/TRAINING_DATA.md).
- Sign lettering: [Titan One](https://fonts.google.com/specimen/Titan+One) (SIL Open Font License).
- The Omarchy wordmark on the LED wall is Omarchy's own [`logo.svg`](https://github.com/basecamp/omarchy/blob/e8d095c7874ec847f1317a70a74cd0c41a3df814/logo.svg)
  (MIT), shown to celebrate the platform; the name and mark belong to the Omarchy project.
- Built with [three.js](https://threejs.org), [axum](https://github.com/tokio-rs/axum),
  [rustfft](https://github.com/ejmahler/RustFFT).
