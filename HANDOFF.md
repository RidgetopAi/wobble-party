# Wobble Party Handoff

Last updated: 2026-05-07

## Startup Read

Read these first:

1. `PROJECT_BRIEF.md`
2. `WOBBLE_BRAIN_PLAN.md`
3. `CALIBRATION.md`
4. `CUE_LAB_PLAN.md`
5. `WOBBLE_BRAIN_TASKS.md`
6. `/home/ridgetop/projects/LESSONS.md`

Key working rule: trace the signal, do not guess at the symptom.

## Current Dev Server

Tonight the app ran on:

```text
http://localhost:5175/
```

Port `5174` was already occupied during the session.

Normal command:

```bash
npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

Validation:

```bash
npm run build
npm run lint
```

Both passed after the latest changes.

## Current Product Direction

The project is now past the basic audio dashboard proof. The current direction is:

```text
Audio brain
-> Cue Lab / rough clips / fingerprints
-> Wobble Workshop visual iteration
-> named cue detectors
-> intentional wobbler reactions
-> brand-ready character/show language
```

The user explicitly wants this treated as a serious music-reactive character product, not a throwaway toy. The working product thesis is:

```text
music understanding -> intentional show direction -> lovable characters -> repeatable visual language
```

## What Was Completed Tonight

### Wobble Workshop v1

Added a new `Wobble Workshop` section near the top of the dashboard.

It includes:

- a 2D northstar-inspired hero wobbler
- purple rounded body
- black cap with teal brim and W mark
- equalizer glasses
- bandana
- glowing belt
- mic arm
- raised hand
- live control sliders
- readouts

The workshop consumes `CueControlFrame.wobblers` plus `frame.lightIntensity`.

Current sliders:

- `Audio Influence`
- `Manual Test`
- `Bounce`
- `Heavy Bob`
- `Sway`
- `Lean`
- `Jump`
- `Detail`
- `Glow`

### Workshop Control Corrections

The first implementation had semantic mismatches. User reviewed the controls and gave visual feedback. Corrections made:

- `Manual Energy` became `Manual Test`, defaulting to `0`.
- `Bounce` now affects bounce amplitude instead of resting height.
- `Heavy Bob` now visibly squashes/body-bobs the character.
- `Sway` was separated from static lean behavior.
- `Lean` remains rotational attitude.
- `Detail` now affects visible equalizer glasses, arms, and mic.
- `Glow` now visibly affects belt/cheeks/body/stage light.

Important later learning: user clarified that final expressive sway should probably be driven by vocal cadence/phrase rhythm, not just a beat-step.

### Workshop Presets And Autosave

Added persistence for workshop settings.

Current behavior:

- current slider values autosave to localStorage
- settings survive reload/hard refresh
- presets can be saved with name and notes
- presets can be loaded or deleted

User saved a good baseline groove. Treat that baseline as the current starting movement language.

### Song Reload Bug Fix

Bug: after first song load/play, selecting the same song again did nothing unless the page was hard refreshed.

Root cause:

- hidden file input retained the selected file path
- browsers do not fire `change` when selecting the same file again
- hard refresh reset the file input but also wiped controls

Fix:

```ts
event.target.value = '';
```

after reading the selected file in `handleFileChange`.

Validated:

- load same file
- stop
- load same file again
- simulate `ended`
- load same file again
- workshop slider state remained intact

### Pop-Out Zoomable Song Waveform Inspector

Added a pop-out `Song Waveform Inspector`.

Controls:

- `Zoom In`
- `Zoom Out`
- `Pan Left`
- `Pan Right`
- `Playhead`
- `Full Song`
- `Use Visible As Region`
- `Dock`

Waveform behavior:

- pop-out uses a larger canvas
- zoom/pan operates on a visible time window
- click seeks within the zoomed window
- shift-drag selects a region
- `Use Visible As Region` writes the visible window into Cue Region Loop

This is important because the user can visually see likely cue events in the waveform and needs faster iteration.

### Cue Fingerprint Editing

Problem: user accidentally labeled a snare cue as `kick` and could not edit it.

Added editable Cue Fingerprint rows:

- label dropdown
- notes input
- time range readout
- average intensity readout
- delete button

Saved fingerprints are still stored in localStorage.

### Rough Clip Audio Linkage For Fingerprints

Important distinction:

- `Rough Cue Clips` store raw audio blobs in IndexedDB.
- `Cue Fingerprints` originally stored only descriptor summaries in localStorage.

Added optional linkage:

```ts
sourceClipId?: string;
```

to `CueFingerprint`.

Now, if a fingerprint is saved while a rough clip is active, it remembers that rough clip ID. Fingerprint rows show `Load Clip`; the button is enabled when `sourceClipId` exists.

Recommended workflow going forward:

1. Select a region.
2. Save Rough Clip first.
3. Load/refine rough clip if needed.
4. Save Fingerprint.
5. Later use `Load Clip` from the fingerprint row to hear it again and edit notes/label.

Older fingerprints remain descriptor-only unless we add a manual linker later.

## Important Conceptual Decisions

### Baseline Movement vs Named Cue Reaction

Current baseline goal:

```text
any song -> believable general wobbler movement
```

Next layer:

```text
specific musical moment -> specific wobbler reaction
```

Examples:

- heavy snare -> shoulder pop / face pop / small jump / light hit
- bass growl -> lean / heavy bob
- hat shimmer -> glasses/accessory sparkle
- drop impact -> jump / expression / flash

### Vocal Cadence Direction

User clarified the correct direction for phrase/sway movement:

```text
lyrics meaning = what words are being said
vocal cadence = when the mouth/voice is hitting rhythmic moments
```

The desired future chain:

```text
mixed song
-> detect vocal-focused moments
-> find syllable-like vocal attacks
-> group them into phrases
-> compare them against beat grid
-> map phrase rhythm to wobbler movement
```

Potential future type:

```ts
type VocalCadenceControls = {
  vocalPresence: number;
  vocalPulse: boolean;
  vocalDensity: number;
  phraseStart: boolean;
  phraseEnd: boolean;
  phraseIntensity: number;
  cadenceSync: number;
};
```

Potential mapping:

```text
vocalPulse      -> head nod / mouth bounce / shoulder pop
vocalDensity    -> faster small movements
phraseStart     -> lean in / attention shift
phraseEnd       -> release / settle back
phraseIntensity -> bigger gesture
cadenceSync     -> beat-snapped vs free-flow movement
```

Do not confuse this with lyric transcription. The first useful version can be audio-only.

## What To Do Next

Recommended next session sequence:

1. Use the saved baseline groove as the current movement baseline.
2. Use the waveform inspector to find snare/heavy-snare events.
3. Save rough clips for those events.
4. Load/refine those clips.
5. Save fingerprints from active rough clips so audio linkage is preserved.
6. Collect 3-5 examples across one or more songs.
7. Inspect descriptor summaries.
8. Prototype the first named detector, probably `heavySnare`.
9. Route `heavySnare` confidence into a visible wobbler reaction.

The next product step is not more generic slider polish. It is the first named cue detector pipeline.

## Mandrel Checkpoints From Tonight

Relevant stored contexts/tasks include:

- Wobble Workshop implementation
- Wobble Workshop control semantic corrections
- post-v0.1 roadmap
- Vocal Cadence Controls direction
- repeated song loading bug fix
- waveform inspector implementation
- Cue Fingerprint editing
- rough-clip audio linkage for fingerprints

Mandrel should be used tomorrow to pull recent contexts before continuing.

## How We Worked Together

This was a strong iteration pattern:

1. Build a visible control surface.
2. User gives visual/feel feedback in plain language.
3. Treat feedback as signal, not as nitpick.
4. Classify issue:
   - signal problem
   - mapping problem
   - animation problem
   - product/workflow problem
5. Make surgical changes.
6. Validate with build/lint/browser checks.
7. Save the learning in Mandrel.

Important examples:

- Sway initially looked like a technical control issue, but the deeper learning was that final expressive sway should probably be tied to vocal cadence.
- The song reload bug looked like audio pipeline state, but tracing showed a file input value issue.
- Cue work requires audio review, so fingerprints need linkage back to rough clip audio.

Keep explaining as we go. The user is learning music/animation/product structure while building. Short progress updates and quick explanations are useful, especially before live work on X/YouTube/Twitch.

## Current Git Notes

Latest changed files from tonight:

- `src/App.tsx`
- `src/App.css`
- `src/audio/types.ts`
- `HANDOFF.md`

Validation passed before handoff update:

```bash
npm run build
npm run lint
```

