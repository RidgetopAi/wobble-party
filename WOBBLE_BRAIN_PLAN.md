# Wobble Party: Wobble-Brain First Plan

## Product Thesis

Wobble Party only works if the audio brain produces clean, stable, musical control signals. The 3D concert can be simple at first. The signal layer cannot be sloppy.

The first product milestone is not a finished visualizer. It is a browser diagnostic dashboard that proves we can turn audio into reliable control data.

```text
Audio in
-> measurement
-> conditioning
-> event detection
-> confidence scoring
-> control buses
-> visual control frame
```

Next layer:

```text
Audio
-> measurements
-> perceptual descriptors
-> labeled fingerprints
-> cue detectors
-> lighting / wobblers / camera controls
```

## North Star

The user should feel like their music is directing a tiny live show, not driving a random frequency toy.

That means the visual layer should consume a small set of intentional control buses instead of raw FFT bins:

- Energy Bus: crowd intensity, camera movement, ambient light
- Bass Bus: crowd bounce, floor pulse, stage thump
- Impact Bus: strobes, flashes, camera punch
- High Bus: lasers, particles, shimmer
- Brightness Bus: color temperature, light sharpness
- Beat Bus: synchronized movement and phrase timing

Cue Lab will extend these buses with named musical detectors like `deepSaw`, `hatShimmer`, `dropImpact`, and `vocalFocus`.

## Strategic Boundaries

Start source-agnostic:

- Microphone input for immediate live testing
- Local file input for repeatable analysis
- Shared output format for both real-time and pre-analysis modes

Do not start with Spotify or streaming-platform integration. That creates product, legal, and synchronization constraints before the core engine exists.

Do not start with full 3D polish. Build only enough visual feedback to prove control quality.

## Wobble-Brain MVP

The MVP is a browser-based diagnostic dashboard that outputs a `VisualControlFrame` every render tick or analysis frame.

Minimum input support:

- Microphone input
- Local audio file input

Minimum diagnostics:

- Waveform
- Frequency spectrum
- Raw band meters
- Smoothed band meters
- RMS / loudness
- Spectral centroid / brightness
- Spectral flux
- Onset markers
- Bass impact candidates
- Beat pulse estimate
- Tempo estimate and confidence
- Threshold values
- Final control-frame inspector

Minimum tunables:

- Smoothing amount
- Noise floor / gate
- Band weighting
- Onset sensitivity
- Bass impact sensitivity
- Beat confidence threshold
- Cooldowns for event pulses

## Initial Control Frame

```ts
export type VisualControlFrame = {
  time: number;

  masterEnergy: number;
  bassEnergy: number;
  lowMidEnergy: number;
  midEnergy: number;
  highEnergy: number;
  brightness: number;

  impact: number;
  onsetPulse: boolean;
  beatPulse: boolean;
  kickPulse: boolean;

  motionIntensity: number;
  lightIntensity: number;

  tempo: number | null;
  tempoConfidence: number;

  debug?: DebugAudioFrame;
};
```

All normalized scalar outputs should be stable in `0.0..1.0`. Event booleans should use confidence thresholds and cooldowns so visuals do not chatter.

## First Signal Chain

```text
Input audio
-> downmix to mono
-> frame/window audio
-> FFT
-> band energy extraction
-> RMS and peak level
-> spectral centroid
-> spectral flux
-> adaptive noise floor
-> onset detection
-> bass impact detection
-> short-window tempo estimate
-> smoothing and cooldowns
-> VisualControlFrame
```

## Quality Bar

The dashboard should let us answer these questions with evidence:

- Is latency low enough for visual reactions to feel connected?
- Are bass impacts firing on kicks more than sustained bass?
- Are onsets meaningful, or are they just noise?
- Are smoothed values responsive without jitter?
- Does tempo stabilize on simple 4/4 music?
- Does the system degrade gracefully when tempo confidence is low?
- Can the same audio file produce repeatable control output?

## Acceptance Criteria For v0.1

Wobble-brain v0.1 is done when:

- Microphone input produces live control frames.
- File playback produces repeatable control frames.
- Raw and smoothed values are visible side by side.
- Onset and kick candidates are visible on a timeline.
- Tunable parameters change detector behavior in real time.
- `VisualControlFrame` is logged or inspectable live.
- The engine does not require any 3D scene to debug.

## Build Sequence

1. Scaffold the web app with TypeScript, React, and Vite.
2. Build audio input plumbing for microphone and local files.
3. Implement a small audio analysis core with typed frame outputs.
4. Render raw waveform, spectrum, and band meters.
5. Add smoothing, normalization, and adaptive noise floor.
6. Add onset, impact, and basic beat/tempo estimation.
7. Add the diagnostic dashboard and tuning controls.
8. Add a tiny placeholder visual panel driven only by control buses.
9. Save representative debug output for repeatable tuning.

## First Visual Constraint

The first visual prototype should be deliberately simple:

- A row of placeholder wobble figures
- Bass bus makes them bounce
- Impact bus triggers a strobe
- High bus drives particles or laser intensity
- Energy bus controls crowd activity

If the simple scene does not feel musical, the answer is to improve the signal layer before adding visual complexity.

## Technical Bias

Use browser-native Web Audio first. Reach for libraries only after we know which detector is weak.

Initial stack:

- TypeScript
- React
- Vite
- Web Audio API
- Canvas for diagnostics
- Zustand only if state coordination becomes annoying
- Three.js / React Three Fiber after the diagnostic dashboard proves useful

## Open Research Questions

- What frequency-band ranges produce the cleanest control buses across genres?
- How much smoothing preserves feel without adding visible lag?
- Can real-time beat tracking be good enough for the first demo, or should beat-driven visuals be confidence-gated early?
- What debug fixtures should we use to test kick-heavy, vocal-heavy, ambient, and chaotic tracks?
- Should pre-analysis use the same browser engine first, or should we later compare against Python/librosa for ground truth?

## Working Rule

When a reaction looks wrong, trace the signal path from audio input to visual output. Do not tune the symptom blindly.
