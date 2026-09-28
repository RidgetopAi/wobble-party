# Third-party material

Wobble Party's code is MIT (see [LICENSE](LICENSE)). These files are not ours, or not only ours,
and carry their own terms. The full upstream licence texts are in
[`stage/public/licenses/`](stage/public/licenses) and ship inside the built stage (`stage/dist/licenses/`),
next to the files they cover.

| File | What | Source | Licence |
|---|---|---|---|
| `brain/model/vocal.bin` | singing-voice network trained on ccMixter stems | this project; stems listed in [docs/TRAINING_DATA.md](docs/TRAINING_DATA.md) | CC BY-NC 4.0, see [brain/model/LICENSE.md](brain/model/LICENSE.md) |
| `stage/public/fonts/TitanOne-Regular.ttf` (and `stage/dist/fonts/`) | Titan One by Rodrigo Fuenzalida, unmodified | [Google Fonts](https://fonts.google.com/specimen/Titan+One) | SIL Open Font License 1.1, text in [OFL-TitanOne.txt](stage/public/fonts/OFL-TitanOne.txt) |
| `stage/public/fonts/wobble-sign.typeface.json` (and `stage/dist/fonts/`) | "Wobble Sign": a 3D-sign subset of Titan One converted for three.js by `tools/font2typeface.mjs`. A Modified Version, so renamed away from the Reserved Font Name "Titan" | derived from Titan One | SIL Open Font License 1.1 (same text) |
| `stage/public/logos/omarchy.png` (and `stage/dist/logos/`) | the Omarchy wordmark as a white mask, rasterised from Omarchy's `logo.svg` | [basecamp/omarchy@e8d095c `logo.svg`](https://github.com/basecamp/omarchy/blob/e8d095c7874ec847f1317a70a74cd0c41a3df814/logo.svg) | MIT, Copyright (c) David Heinemeier Hansson; text in [licenses/omarchy.txt](stage/public/licenses/omarchy.txt). Shown on the LED wall only to celebrate the platform it runs on; the name and mark belong to the Omarchy project |
| `stage/public/logos/ridgetopai.png` (and `stage/dist/logos/`) | the RidgetopAi logo, re-stacked for the LED wall | RidgetopAi (the author) | same as the project (MIT) |
| `stage/dist/assets/three*.js` | three.js, bundled (each chunk starts with its copyright notice) | [mrdoob/three.js](https://github.com/mrdoob/three.js) | MIT, Copyright 2010-2026 three.js authors; text in [licenses/three.js.txt](stage/public/licenses/three.js.txt) |
