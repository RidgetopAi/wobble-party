# Wobble Party Handoff

Last updated: 2026-05-04

## Startup Read

Read these first:

1. `PROJECT_BRIEF.md`
2. `WOBBLE_BRAIN_PLAN.md`
3. `CALIBRATION.md`
4. `CUE_LAB_PLAN.md`
5. `WOBBLE_BRAIN_TASKS.md`

Also read cross-project lessons:

- `/home/ridgetop/projects/LESSONS.md`

## Current State

The app is a Vite/React/TypeScript Wobble Brain dashboard.

It supports:

- microphone input
- browser tab/system audio capture via `Capture Audio`
- local audio files through the built-in player
- synthetic fixtures and calibration fixtures
- full-song waveform overview with playhead and selected region overlay
- live waveform and frequency spectrum
- raw band calibration
- gated control buses
- event tracer
- perceptual Cue Lab descriptors
- Cue Region Loop for selecting and looping a file region
- Cue Fingerprints saved to localStorage
- Rough Cue Clips saved as mono WAV blobs in IndexedDB
- output-family meters for lighting, wobblers, and camera
- detachable floating Control Bus Proof panel
- keyboard playback controls:
  - Space: play/pause
  - Left/Right arrows: seek 5s
  - Shift+Left/Right: seek 1s
  - comma/period: seek 0.1s

Run:

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5174 --strictPort
```

Dev URL:

```text
http://localhost:5174/
```

Validate:

```bash
npm run build
npm run lint
```

## Important Learnings

- Mic input and desktop/headphone output are separate. Use `Capture Audio` for browser-supported tab/system audio.
- Raw bands are measurement/debug data. Control buses are gated/smoothed visual-safe data.
- `Gate` tells whether current signal is above noise floor enough to drive buses.
- Calibration fixtures prove known tones land in expected bands.
- Do not tune by eye only. Trace input -> raw measurement -> gate/conditioning -> bus -> visual output.
- Vite HMR hit React hook-order/runtime errors during the 2026-05-04 session. Restarting Vite cleanly is safer than trusting hot reload after structural hook changes.

## Current Direction

Cue Lab is the active direction:

```text
Audio
-> measurements
-> perceptual descriptors
-> rough clips
-> labeled fingerprints
-> cue detectors
-> lighting / wobblers / camera controls
```

Target user flow:

1. Load or capture music.
2. Quickly mark interesting sections as rough clips.
3. Move on without over-refining.
4. Return to the rough clip bin later.
5. Load each rough clip, refine region/label/notes, and promote it to a final cue fingerprint.

## Unresolved Issue

The user reports that **Cue Region Loop controls are still not reachable and appear greyed out**.

Screenshot details:

- `Current`, `End`, and `Length` show valid values, for example `0:44.07`.
- `Play Region` appears enabled.
- `Set Start`, `Set End`, `Loop Off`, `Stop Loop`, and `Seek Start` appear greyed.
- User tried clicking them anyway and reported nothing happened.

This means the visible runtime behavior is not matching the local Playwright checks.

## What Was Tried

1. Checked the original enable gate:

   ```ts
   const isSeekableFile = sourceKind === 'file' && mediaDuration > 0;
   ```

2. Added `effectiveMediaDuration` fallback:

   ```ts
   const effectiveMediaDuration = mediaDuration || songWaveform?.duration || 0;
   const isSeekableFile = sourceKind === 'file' && effectiveMediaDuration > 0;
   ```

   This was meant to protect against audio metadata timing where decoded waveform duration exists but `mediaDuration` is still `0`.

3. Added active styling for enabled secondary Cue Region buttons:

   - `.region-secondary`
   - teal border/text/background for enabled secondary actions
   - `Stop Loop` intentionally disabled until `region.isLooping` is true

4. Restarted Vite cleanly on fixed port `5174` after seeing HMR hook-order errors in the old server console.

5. Verified with Playwright against `http://localhost:5174/`:

   - `Set Start`: enabled, opacity `1`, teal styling
   - `Set End`: enabled, opacity `1`, teal styling
   - `Play Region`: enabled
   - `Loop Off`: enabled, opacity `1`, teal styling
   - `Seek Start`: enabled, opacity `1`, teal styling
   - `Stop Loop`: disabled at opacity `.45` only when no loop is running

6. Verified server state:

   - `5173` was not running.
   - `5174` was serving `/src/App.css` with the new `.region-secondary` CSS.

## Suggested Next Step

Follow L001: trace the signal in the real browser session instead of guessing at styling.

Recommended debugging path tomorrow:

1. Add a temporary visible debug row inside `CueRegionPanel` showing:

   - `sourceKind`
   - `mediaDuration`
   - `songWaveform?.duration`
   - `effectiveMediaDuration`
   - `isSeekableFile`
   - `region.startTime`
   - `region.endTime`
   - `currentTime`

2. Add `data-testid` attributes to the region buttons and query them from the user-visible browser session.

3. Inspect the real DOM in browser DevTools:

   - confirm whether the buttons actually have the `disabled` attribute
   - inspect computed opacity/color
   - check whether an overlay or invisible element is intercepting pointer events

4. If buttons are truly enabled but clicks do nothing, instrument handlers:

   - `captureStart`
   - `captureEnd`
   - `toggleLoop`
   - `seekTo`

5. If only the user browser is stale, clear Vite/browser state:

   - hard refresh
   - close/reopen tab
   - verify exact URL `http://localhost:5174/`
   - check console for old HMR hook-order/runtime errors

## Git Notes

- Local downloaded songs are ignored via `music/`.
- Generated `dist/` and `node_modules/` are ignored.
- Public synthetic/calibration WAV fixtures are intended to be committed.
