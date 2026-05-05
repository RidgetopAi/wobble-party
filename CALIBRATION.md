# Wobble Brain Calibration

Use calibration before tuning musical reactions.

The dashboard has two different layers:

- Raw band readings: closest to test-equipment measurement.
- Control buses: visual-safe values after smoothing, gating, and event logic.

If a control bus feels wrong, check the raw band calibration first.

## Calibration Fixtures

The dashboard includes known generated inputs:

| Fixture | Expected Raw Band |
| --- | --- |
| `60 Hz` | Bass |
| `250 Hz` | Low Mid |
| `1 kHz` | Mid |
| `6 kHz` | High |
| `White Noise` | Broadband inspection |
| `Band Step` | Bass -> Low Mid -> Mid -> High |

## How To Read It

1. Click a calibration fixture.
2. Watch the `Band Calibration` panel, not only `Control Buses`.
3. Confirm `Dominant` matches `Expected`.
4. Use raw band percentages to detect leakage.

Example validated readings from the first calibration pass:

| Input | Raw Bass | Raw Low Mid | Raw Mid | Raw High | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| `60 Hz` | 87% | 21% | 0% | 0% | Pass |
| `250 Hz` | 2% | 88% | 0% | 0% | Pass |
| `1 kHz` | 0% | 0% | 85% | 0% | Pass |
| `6 kHz` | 0% | 0% | 0% | 23% | Pass |

The 60 Hz fixture showing some low-mid response is leakage/transition behavior to watch, not a total failure. The key calibration finding is that 1 kHz and 6 kHz do not falsely register as bass.

## Live Input Notes

Browser microphone capture uses an input device. Headphones are normally output devices, not a source the browser can analyze.

If a headphone device appears as selectable input, it is usually one of these:

- a headset microphone
- a monitor/loopback input exposed by the OS
- a virtual audio device

In quiet-room testing, watch `Peak` and `RMS` under the waveform. If they are not near zero, the browser is receiving real signal or device noise. A low-frequency noise floor can show up mostly as Bass/Low Mid even when you are not speaking.

Use the input-device dropdown beside `Start Mic` to select the actual microphone or loopback source intentionally.

Use `Capture Audio` when you want browser-supported system/tab audio without opening the physical mic. The browser will ask you to share a tab/window/screen and, depending on browser/OS, may offer an audio-sharing checkbox. If no audio track is shared, the app cannot analyze desktop output from that path.

The current source options are:

- `Start Mic`: physical mic, headset mic, virtual input, or OS loopback exposed as an input.
- `Capture Audio`: browser screen/tab/system audio capture, when supported.
- `Load Audio` / fixtures: file playback routed directly into the analyzer.

When changing devices while live input is running, the app restarts the browser `MediaStream` and shows the active input track label returned by the browser. If every device still reports identical readings, check the active input label first.

The dashboard separates raw measurement from control output:

- Raw band meters can still show low-level FFT content below the noise floor.
- Control buses use `Gate`, based on RMS versus the configured noise floor.
- If `Gate` is near `0%`, Bass/Low Mid should not drive visuals even if raw bands show noise.

## Current Band Ranges

- Bass: 20-140 Hz
- Low Mid: 140-500 Hz
- Mid: 500-2500 Hz
- High: 2500-12000 Hz

Band energy uses a focused top-bin average. This avoids wide bands like High being under-reported just because they contain many empty FFT bins.
