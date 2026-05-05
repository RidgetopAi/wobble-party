# Wobble Party

Music-reactive tiny concert visualizer, built wobble-brain first.

## Current App

The app is a browser diagnostic dashboard for the audio engine. It supports:

- Microphone input
- Browser system/tab audio capture when supported
- Explicit audio input device selection after mic permission
- Local audio file input
- Built-in synthetic test fixtures
- Built-in calibration fixtures for known-frequency validation
- Waveform and spectrum displays
- Raw-to-conditioned control buses
- Onset, kick, beat, tempo, and confidence diagnostics
- Live `VisualControlFrame` inspection
- A simple control-bus visual proof panel

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

Dev server:

```text
http://localhost:5173/
```

## Planning Docs

- `PROJECT_BRIEF.md`
- `WOBBLE_BRAIN_PLAN.md`
- `WOBBLE_BRAIN_TASKS.md`
- `CALIBRATION.md`
- `CUE_LAB_PLAN.md`
- `gpt-wobble-party-rough-plan.md`
