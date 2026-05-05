# Wobble-Brain v0.1 Task Breakdown

Umbrella task:

- `e27877fa-fc33-4bd7-92cb-3b5770911289` - Build Audio Engine Prototype v0.1 diagnostic dashboard

Current status: v0.1 implementation pass completed on 2026-05-04.

## Subtasks

1. Completed - `703fb305-4c9b-4d12-a684-fe24bd9b0ef0` - Scaffold browser app
   - Create the TypeScript React/Vite app structure.
   - Keep the first screen focused on the diagnostic tool.
   - Add baseline scripts and project structure.

2. Completed - `2478bfcd-3d64-437a-be7c-b54b8454e89f` - Implement audio input plumbing
   - Add microphone input.
   - Add local audio file playback.
   - Route both through a shared Web Audio pipeline.

3. Completed - `090fdbe6-36c2-459f-9d8d-598fc8e3306d` - Build raw analysis core
   - Extract waveform data.
   - Extract FFT/spectrum data.
   - Compute RMS, peak level, and band energies.

4. Completed - `a59e5de9-7a06-4228-8f27-126f7a5ec66c` - Add signal conditioning layer
   - Normalize values to stable `0.0..1.0` ranges.
   - Add smoothing, noise floor/gating, and cooldowns.
   - Produce visual-safe scalar outputs.

5. Completed - `34c5d351-ef4c-475a-a737-232779c31f6e` - Detect onsets, impacts, and tempo candidates
   - Add spectral flux/onset detection.
   - Add bass impact candidates.
   - Add basic beat pulse, tempo estimate, and confidence.

6. Completed - `dceabadd-104a-4272-bf22-9fe705657b1f` - Build diagnostic dashboard UI
   - Render waveform and spectrum.
   - Show raw vs smoothed meters.
   - Show thresholds, markers, tempo confidence, tunables, and live `VisualControlFrame`.

7. Completed - `59f4d043-729b-466c-8f9b-8a2068d1349a` - Define repeatable signal-quality fixtures
   - Pick or generate test audio for kick-heavy, vocal-heavy, ambient, and busy tracks.
   - Define observable checks for latency, jitter, false positives, and repeatability.

8. Completed - `a5c24506-d39c-4d06-af7e-991abd0856f6` - Add placeholder visual bus proof
   - Add a simple visual panel driven only by control buses.
   - Validate bass bounce, impact flash, high shimmer, and energy motion before full 3D work.
