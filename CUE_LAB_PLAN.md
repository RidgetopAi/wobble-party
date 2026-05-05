# Wobble Brain Cue Lab Plan

## Core Idea

Cue Lab is how we translate human musical moments into repeatable control logic.

The dashboard stays, but gains a workflow for marking parts of a song and turning those markings into reusable detectors.

```text
Audio
-> Measurements
-> Descriptors
-> Labeled fingerprints
-> Detectors
-> Control buses
-> Lighting / wobblers / camera
```

## What The User Should Be Able To Do

1. Capture or load a song.
2. Hear a moment that should do something.
3. Select the time range.
4. Loop that range.
5. Label it with intent:
   - `kick`
   - `snare`
   - `hat shimmer`
   - `deep saw`
   - `bass growl`
   - `drop impact`
   - `build tension`
   - `vocal focus`
6. Save the measured fingerprint.
7. Compare multiple labeled examples.
8. Promote repeatable patterns into named detectors.

## Descriptor Layer

The descriptor layer should sit above raw FFT and below cue detectors.

Initial descriptors:

- `intensity`: RMS/loudness and perceived energy
- `bassDominance`: low-end weight relative to the full signal
- `brightness`: spectral centroid / high-frequency balance
- `roughness`: unstable or harsh texture proxy
- `density`: how full the spectrum is
- `transientness`: short impact versus sustained sound
- `sustain`: whether energy holds over time
- `buildSlope`: whether energy/brightness/density is rising
- `onsetDensity`: how many attacks happen in a short window
- `beatConfidence`: whether beat timing is usable
- `lowMidPressure`: bass + low-mid sustained energy

These are not final names. They are working handles we can test.

## Cue Detector Examples

### Deep Saw / Growl

Likely fingerprint:

- high bass or low-mid pressure
- sustained envelope
- moderate/high roughness
- not a short kick transient
- often rising or modulating

Possible outputs:

- blinder ramp
- floor pressure
- haze density
- moving heads narrow/tension
- wobbler lean or heavy bob

### Drop Impact

Likely fingerprint:

- sudden RMS/peak jump
- strong spectral flux
- broad frequency activation
- section transition or beat alignment

Possible outputs:

- strobe burst
- blinder hit
- camera punch
- crowd jump
- beam snap open

### Hat Shimmer

Likely fingerprint:

- high-frequency energy
- frequent small onsets
- low bass dominance
- low impact

Possible outputs:

- pixel sparkle
- laser flicker
- LED chase
- small wobbler detail motion

### Vocal Focus

Likely fingerprint:

- mid-band presence
- lower chaos/density
- smoother envelope
- possible pitch/harmonic stability

Possible outputs:

- spotlight
- reduced movement chaos
- warmer wash
- camera focus toward performer

## Output Control Families

We need outputs for three systems, not lighting only.

### Lighting

- wash mood
- beam pulse
- laser intensity/fan
- strobe burst
- blinder hit/ramp
- floor glow
- pixel sparkle
- haze amount

### Wobblers

- bounce amount
- sway speed
- lean direction
- jump trigger
- crowd density/activity
- arm/hat accessory motion later
- heavy bob for bass/growl

### Camera

- push/pull intensity
- shake/punch amount
- orbit speed
- focal target
- wide/open versus tight/intimate framing
- section-transition moves

## Data Shape Sketch

```ts
type CueLabel =
  | 'kick'
  | 'snare'
  | 'hatShimmer'
  | 'deepSaw'
  | 'bassGrowl'
  | 'dropImpact'
  | 'buildTension'
  | 'vocalFocus';

type CueFingerprint = {
  id: string;
  label: CueLabel;
  sourceName: string;
  startTime: number;
  endTime: number;
  descriptorSummary: DescriptorSummary;
  notes?: string;
};

type DetectorOutput = {
  name: string;
  confidence: number;
  intensity: number;
  attack: number;
  sustain: number;
};

type ControlFrame = {
  lighting: LightingControls;
  wobblers: WobblerControls;
  camera: CameraControls;
};
```

## Build Sequence

1. Add a timeline/history buffer for recent descriptor frames.
2. Add range selection and loop playback for file/captured audio.
3. Add label creation for selected ranges.
4. Store cue fingerprints locally first.
5. Display descriptor summaries for labeled ranges.
6. Compare examples by label.
7. Add first hand-written detector from labeled examples.
8. Route detector output into lighting/wobbler/camera control families.

## Working Rule

Do not turn a single cool example into a detector.

A detector should need at least a few labeled examples or a deliberately generated calibration fixture. The goal is repeatable pattern recognition, not overfitting one song.

