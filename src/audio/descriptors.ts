import type { CueDescriptorFrame, DescriptorSummary, VisualControlFrame } from './types';

const descriptorKeys = [
  'intensity',
  'bassDominance',
  'brightness',
  'roughness',
  'density',
  'transientness',
  'sustain',
  'buildSlope',
  'onsetDensity',
  'beatConfidence',
  'lowMidPressure',
] as const;

type DescriptorMetric = (typeof descriptorKeys)[number];

type DescriptorAccumulator = {
  previousFrame: CueDescriptorFrame | null;
  recentOnsets: number[];
  sustainValue: number;
};

export function createDescriptorAccumulator(): DescriptorAccumulator {
  return {
    previousFrame: null,
    recentOnsets: [],
    sustainValue: 0,
  };
}

export function createCueDescriptorFrame(
  frame: VisualControlFrame,
  sourceTime: number,
  accumulator: DescriptorAccumulator,
): CueDescriptorFrame {
  const bands = frame.debug.smoothedBands;
  const bandTotal = bands.bass + bands.lowMid + bands.mid + bands.high;
  const rawBands = frame.debug.rawBands;
  const activeRawBandCount = [rawBands.bass, rawBands.lowMid, rawBands.mid, rawBands.high].filter(
    (value) => value > 0.08,
  ).length;

  if (frame.onsetPulse || frame.kickPulse) {
    accumulator.recentOnsets.push(sourceTime);
  }
  accumulator.recentOnsets = accumulator.recentOnsets.filter((time) => sourceTime - time <= 2);

  const intensity = clamp(frame.masterEnergy * 0.72 + frame.debug.rms * 2.4 * 0.28);
  const transientness = clamp(frame.impact * 0.7 + frame.debug.spectralFlux * 6 * 0.3);
  const sustainTarget = clamp(
    intensity * (1 - transientness * 0.55) + Math.min(bands.bass + bands.lowMid, 1) * 0.18,
  );
  accumulator.sustainValue = lerp(accumulator.sustainValue, sustainTarget, 0.12);

  const previousIntensity = accumulator.previousFrame?.intensity ?? intensity;
  const previousBrightness = accumulator.previousFrame?.brightness ?? frame.brightness;
  const previousDensity = accumulator.previousFrame?.density ?? activeRawBandCount / 4;
  const density = clamp(activeRawBandCount / 4 + Math.min(bandTotal, 1) * 0.28);

  const descriptor: CueDescriptorFrame = {
    time: frame.time,
    sourceTime,
    intensity,
    bassDominance: bandTotal > 0.001 ? clamp((bands.bass + bands.lowMid * 0.35) / bandTotal) : 0,
    brightness: frame.brightness,
    roughness: clamp(frame.debug.spectralFlux * 8 + frame.impact * 0.35),
    density,
    transientness,
    sustain: accumulator.sustainValue,
    buildSlope: clamp(
      (intensity - previousIntensity) * 4 +
        (frame.brightness - previousBrightness) * 1.4 +
        (density - previousDensity) * 1.6,
    ),
    onsetDensity: clamp(accumulator.recentOnsets.length / 8),
    beatConfidence: frame.tempoConfidence,
    lowMidPressure: clamp(bands.bass * 0.45 + bands.lowMid * 0.75),
  };

  accumulator.previousFrame = descriptor;
  return descriptor;
}

export function summarizeDescriptors(frames: CueDescriptorFrame[]): DescriptorSummary | null {
  if (frames.length === 0) return null;

  const averages = createEmptyMetrics();
  const peaks = createEmptyMetrics();

  for (const frame of frames) {
    for (const key of descriptorKeys) {
      averages[key] += frame[key];
      peaks[key] = Math.max(peaks[key], frame[key]);
    }
  }

  for (const key of descriptorKeys) {
    averages[key] /= frames.length;
  }

  const startTime = frames[0].sourceTime;
  const endTime = frames[frames.length - 1].sourceTime;

  return {
    startTime,
    endTime,
    duration: Math.max(0, endTime - startTime),
    frameCount: frames.length,
    averages,
    peaks,
  };
}

function createEmptyMetrics(): Record<DescriptorMetric, number> {
  return {
    intensity: 0,
    bassDominance: 0,
    brightness: 0,
    roughness: 0,
    density: 0,
    transientness: 0,
    sustain: 0,
    buildSlope: 0,
    onsetDensity: 0,
    beatConfidence: 0,
    lowMidPressure: 0,
  };
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
