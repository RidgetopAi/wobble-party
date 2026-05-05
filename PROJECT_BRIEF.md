# Wobble Party Project Brief

## What We Are Building

Wobble Party is a music-reactive tiny concert world. The user plays music, and a stylized crowd, stage, lights, lasers, and camera system respond like a miniature live show.

The core differentiator is the wobble-brain: an audio signal-processing engine that turns messy sound into clean visual control signals.

## Current Priority

Focus on wobble-brain first.

The first milestone is a diagnostic dashboard, not a polished 3D concert scene. The dashboard must prove that we can reliably extract useful audio data and shape it into coherent control output.

## Product Position

This should feel playful and technically impressive:

- Not a generic bars-and-waves visualizer
- Not raw FFT data mapped directly to random effects
- More like a tiny lighting director responding to the song

## First Deliverable

`Audio Engine Prototype v0.1`

A browser app that accepts microphone or local file input and displays:

- Raw audio diagnostics
- Cleaned and smoothed control buses
- Event detections
- Tempo confidence
- Live `VisualControlFrame` output

## Core Principle

Trace the signal, do not guess at the symptom.

If a visual reaction feels wrong, inspect the path:

```text
audio input -> raw measurements -> conditioning -> event detection -> control frame -> visual mapping
```

## Important Non-Goals For Now

- No Spotify integration
- No full 3D production scene
- No complex character system
- No premature ML pipeline
- No overbuilt architecture before signal quality is proven

## Key Files

- `gpt-wobble-party-rough-plan.md`: Original expanded planning draft
- `WOBBLE_BRAIN_PLAN.md`: Current concise wobble-brain-first plan

