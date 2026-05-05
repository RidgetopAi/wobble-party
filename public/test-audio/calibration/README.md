# Calibration Fixtures

These files are known inputs for checking whether Wobble Brain's measurement layer is sane before tuning musical reactions.

Expected dominant raw band:

- `sine-60hz.wav`: Bass
- `sine-250hz.wav`: Low Mid
- `sine-1000hz.wav`: Mid
- `sine-6000hz.wav`: High
- `white-noise.wav`: Broadband, inspect distribution instead of expecting one dominant band
- `band-step.wav`: 1 second each of 60 Hz, 250 Hz, 1 kHz, and 6 kHz

Use the dashboard's Band Calibration panel for raw band readings. The regular Control Buses are visual-safe outputs, so they are smoothed and conditioned.

