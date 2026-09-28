# vocal.bin — licence

`vocal.bin` (the singing-voice network) is **not** covered by the repository's MIT licence.

It was trained on Creative Commons stems from ccMixter, most of them licensed
**Attribution-NonCommercial** (CC BY-NC 3.0/4.0) and the rest Attribution (CC BY). None are
ShareAlike. The audio itself is not redistributed. Every stem, artist and licence is listed in
[`docs/TRAINING_DATA.md`](../../docs/TRAINING_DATA.md).

Because the model is derived from those works, it is distributed under
**[Creative Commons Attribution-NonCommercial 4.0](https://creativecommons.org/licenses/by-nc/4.0/)**:

- **Attribution:** the artists in `docs/TRAINING_DATA.md`; the model by RidgetopAi (Wobble Party).
- **NonCommercial:** you may not use `vocal.bin`, or anything derived from it, for commercial purposes.

Without the model, wobble-brain falls back to a DSP-only singing detector that is weaker but
works (see `brain/src/analysis`), and all of the brain's code remains MIT.
