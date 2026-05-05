import type {
  AudioAnalysisResult,
  BandEnergies,
  DebugAudioFrame,
  TuningSettings,
  VisualControlFrame,
} from './types';

type AnalyzerState = {
  previousSpectrum: Float32Array<ArrayBuffer> | null;
  waveform: Float32Array<ArrayBuffer>;
  spectrum: Uint8Array<ArrayBuffer>;
  smoothedBands: BandEnergies;
  smoothedMaster: number;
  adaptiveFloor: number;
  lastOnsetAt: number;
  lastKickAt: number;
  lastBeatAt: number;
  onsetTimes: number[];
  tempo: number | null;
  tempoConfidence: number;
};

const initialBands: BandEnergies = {
  bass: 0,
  lowMid: 0,
  mid: 0,
  high: 0,
};

export function createAnalyzerState(): AnalyzerState {
  return {
    previousSpectrum: null,
    waveform: new Float32Array(0),
    spectrum: new Uint8Array(0),
    smoothedBands: { ...initialBands },
    smoothedMaster: 0,
    adaptiveFloor: 0.02,
    lastOnsetAt: -Infinity,
    lastKickAt: -Infinity,
    lastBeatAt: -Infinity,
    onsetTimes: [],
    tempo: null,
    tempoConfidence: 0,
  };
}

export function analyzeAudioFrame(
  analyser: AnalyserNode,
  time: number,
  settings: TuningSettings,
  state: AnalyzerState,
): AudioAnalysisResult {
  if (state.waveform.length !== analyser.fftSize) {
    state.waveform = new Float32Array(analyser.fftSize);
  }

  if (state.spectrum.length !== analyser.frequencyBinCount) {
    state.spectrum = new Uint8Array(analyser.frequencyBinCount);
  }

  const waveform = state.waveform;
  const spectrum = state.spectrum;

  analyser.getFloatTimeDomainData(waveform);
  analyser.getByteFrequencyData(spectrum);

  const rms = computeRms(waveform);
  const peak = computePeak(waveform);
  const rawBands = computeBands(spectrum, analyser.context.sampleRate, analyser.fftSize);
  const signalGate = computeSignalGate(rms, settings.noiseFloor);
  const gatedBands = {
    bass: rawBands.bass * signalGate,
    lowMid: rawBands.lowMid * signalGate,
    mid: rawBands.mid * signalGate,
    high: rawBands.high * signalGate,
  };
  const spectralCentroid = computeSpectralCentroid(
    spectrum,
    analyser.context.sampleRate,
    analyser.fftSize,
  );
  const spectralFlux = computeSpectralFlux(spectrum, state);

  state.adaptiveFloor = lerp(
    state.adaptiveFloor,
    Math.max(settings.noiseFloor, rms * 0.65),
    rms > state.adaptiveFloor ? 0.008 : 0.035,
  );

  const smoothing = clamp(settings.smoothing, 0.01, 0.98);
  const response = 1 - smoothing;

  state.smoothedBands = {
    bass: lerp(state.smoothedBands.bass, gatedBands.bass, response),
    lowMid: lerp(state.smoothedBands.lowMid, gatedBands.lowMid, response),
    mid: lerp(state.smoothedBands.mid, gatedBands.mid, response),
    high: lerp(state.smoothedBands.high, gatedBands.high, response),
  };

  const gatedEnergy = clamp((rms - state.adaptiveFloor) / Math.max(0.001, 1 - state.adaptiveFloor), 0, 1);
  state.smoothedMaster = lerp(state.smoothedMaster, gatedEnergy, response);

  const nowMs = time * 1000;
  const onsetThreshold = settings.onsetSensitivity * 0.12 + state.adaptiveFloor * 0.8;
  const kickThreshold = settings.kickSensitivity * 0.18 + state.adaptiveFloor;
  const canFireOnset = nowMs - state.lastOnsetAt > settings.eventCooldownMs;
  const canFireKick = nowMs - state.lastKickAt > settings.eventCooldownMs * 1.25;

  const onsetPulse = canFireOnset && spectralFlux > onsetThreshold && gatedEnergy > 0.04;
  const kickPulse =
    canFireKick &&
    signalGate > 0.4 &&
    gatedBands.bass > kickThreshold &&
    gatedBands.bass > state.smoothedBands.bass * 1.08 &&
    gatedBands.bass > gatedBands.mid * 0.85;

  if (onsetPulse) {
    state.lastOnsetAt = nowMs;
  }

  if (kickPulse) {
    state.lastKickAt = nowMs;
  }

  if (onsetPulse || kickPulse) {
    state.onsetTimes.push(nowMs);
    state.onsetTimes = state.onsetTimes.slice(-18);
    updateTempoEstimate(state);
  }

  const beatInterval = state.tempo ? 60000 / state.tempo : null;
  const beatPulse =
    Boolean(beatInterval) &&
    state.tempoConfidence > 0.35 &&
    nowMs - state.lastBeatAt > beatInterval! * 0.75 &&
    (onsetPulse || kickPulse);

  if (beatPulse) {
    state.lastBeatAt = nowMs;
  }

  const impact = clamp(
    Math.max(spectralFlux * 2.1 * signalGate, peak * 0.72, kickPulse ? gatedBands.bass : 0),
    0,
    1,
  );
  const brightness = clamp(spectralCentroid / 9000, 0, 1);
  const masterEnergy = clamp(state.smoothedMaster * 1.4, 0, 1);
  const lightIntensity = clamp(masterEnergy * 0.55 + impact * 0.45 + brightness * 0.2, 0, 1);
  const motionIntensity = clamp(masterEnergy * 0.65 + state.smoothedBands.bass * 0.35, 0, 1);

  const debug: DebugAudioFrame = {
    rms,
    peak,
    spectralCentroid,
    spectralFlux,
    adaptiveFloor: state.adaptiveFloor,
    rawBands,
    signalGate,
    smoothedBands: state.smoothedBands,
  };

  const frame: VisualControlFrame = {
    time,
    masterEnergy,
    bassEnergy: state.smoothedBands.bass,
    lowMidEnergy: state.smoothedBands.lowMid,
    midEnergy: state.smoothedBands.mid,
    highEnergy: state.smoothedBands.high,
    brightness,
    impact,
    onsetPulse,
    beatPulse,
    kickPulse,
    motionIntensity,
    lightIntensity,
    tempo: state.tempo,
    tempoConfidence: state.tempoConfidence,
    debug,
  };

  return {
    frame,
    buffers: {
      waveform,
      spectrum,
    },
  };
}

function computeRms(waveform: Float32Array<ArrayBuffer>): number {
  let total = 0;
  for (const sample of waveform) {
    total += sample * sample;
  }
  return Math.sqrt(total / waveform.length);
}

function computePeak(waveform: Float32Array<ArrayBuffer>): number {
  let peak = 0;
  for (const sample of waveform) {
    peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}

function computeSignalGate(rms: number, noiseFloor: number): number {
  const floor = Math.max(0.0001, noiseFloor);
  return clamp((rms - floor) / floor, 0, 1);
}

function computeBands(
  spectrum: Uint8Array<ArrayBuffer>,
  sampleRate: number,
  fftSize: number,
): BandEnergies {
  return {
    bass: averageBand(spectrum, sampleRate, fftSize, 20, 140),
    lowMid: averageBand(spectrum, sampleRate, fftSize, 140, 500),
    mid: averageBand(spectrum, sampleRate, fftSize, 500, 2500),
    high: averageBand(spectrum, sampleRate, fftSize, 2500, 12000),
  };
}

function averageBand(
  spectrum: Uint8Array<ArrayBuffer>,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number,
): number {
  const hzPerBin = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(minHz / hzPerBin));
  const end = Math.min(spectrum.length - 1, Math.ceil(maxHz / hzPerBin));
  const magnitudes: number[] = [];

  for (let index = start; index <= end; index += 1) {
    magnitudes.push(spectrum[index] / 255);
  }

  if (magnitudes.length === 0) return 0;

  magnitudes.sort((left, right) => right - left);

  const focusedBinCount = Math.min(
    magnitudes.length,
    Math.max(3, Math.ceil(magnitudes.length * 0.04)),
  );
  let total = 0;

  for (let index = 0; index < focusedBinCount; index += 1) {
    total += magnitudes[index];
  }

  return total / focusedBinCount;
}

function computeSpectralCentroid(
  spectrum: Uint8Array<ArrayBuffer>,
  sampleRate: number,
  fftSize: number,
): number {
  const hzPerBin = sampleRate / fftSize;
  let weighted = 0;
  let total = 0;

  for (let index = 0; index < spectrum.length; index += 1) {
    const magnitude = spectrum[index] / 255;
    weighted += index * hzPerBin * magnitude;
    total += magnitude;
  }

  return total > 0 ? weighted / total : 0;
}

function computeSpectralFlux(spectrum: Uint8Array<ArrayBuffer>, state: AnalyzerState): number {
  const normalized = new Float32Array(spectrum.length);
  let flux = 0;

  for (let index = 0; index < spectrum.length; index += 1) {
    normalized[index] = spectrum[index] / 255;
    if (state.previousSpectrum) {
      flux += Math.max(0, normalized[index] - state.previousSpectrum[index]);
    }
  }

  state.previousSpectrum = normalized;
  return clamp(flux / spectrum.length, 0, 1);
}

function updateTempoEstimate(state: AnalyzerState): void {
  if (state.onsetTimes.length < 4) {
    state.tempoConfidence = 0;
    return;
  }

  const intervals = state.onsetTimes
    .slice(1)
    .map((time, index) => time - state.onsetTimes[index])
    .filter((interval) => interval >= 250 && interval <= 1200);

  if (intervals.length < 3) {
    state.tempoConfidence = 0.1;
    return;
  }

  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const close = intervals.filter((interval) => Math.abs(interval - median) < median * 0.18);
  const bpm = 60000 / median;

  state.tempo = clamp(bpm, 60, 190);
  state.tempoConfidence = clamp(close.length / intervals.length, 0, 1);
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
