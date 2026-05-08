import type { CueDescriptorFrame, CueFingerprint, NamedCueControls } from './types';

type DescriptorMetric = keyof CueFingerprint['descriptorSummary']['averages'];

const snareMetricWeights: Partial<Record<DescriptorMetric, number>> = {
  bassDominance: 0.55,
  brightness: 0.9,
  density: 0.45,
  intensity: 0.8,
  lowMidPressure: 0.55,
  onsetDensity: 0.55,
  roughness: 0.85,
  sustain: 0.35,
  transientness: 1.15,
};

export function detectNamedCues(
  descriptor: CueDescriptorFrame | null,
  fingerprints: CueFingerprint[],
): NamedCueControls {
  if (!descriptor) {
    return createEmptyCueControls();
  }

  const snareFingerprints = fingerprints.filter((fingerprint) => fingerprint.label === 'snare');
  return {
    snareConfidence: detectFromFingerprints(descriptor, snareFingerprints, snareMetricWeights),
  };
}

function detectFromFingerprints(
  descriptor: CueDescriptorFrame,
  fingerprints: CueFingerprint[],
  weights: Partial<Record<DescriptorMetric, number>>,
) {
  if (fingerprints.length === 0) return 0;

  const totalWeight = Object.values(weights).reduce((total, weight) => total + (weight ?? 0), 0);
  if (totalWeight <= 0) return 0;

  let bestSimilarity = 0;
  for (const fingerprint of fingerprints) {
    let weightedDistance = 0;

    for (const [metric, weight] of Object.entries(weights) as [DescriptorMetric, number][]) {
      const targetAverage = fingerprint.descriptorSummary.averages[metric];
      const targetPeak = fingerprint.descriptorSummary.peaks[metric];
      const target = targetAverage * 0.72 + targetPeak * 0.28;
      weightedDistance += Math.abs(descriptor[metric] - target) * weight;
    }

    const similarity = clamp(1 - weightedDistance / totalWeight);
    bestSimilarity = Math.max(bestSimilarity, similarity);
  }

  const hitGate = clamp(descriptor.transientness * 0.75 + descriptor.roughness * 0.25);
  const confidence = bestSimilarity * (0.42 + hitGate * 0.58);
  return clamp((confidence - 0.42) / 0.42);
}

function createEmptyCueControls(): NamedCueControls {
  return {
    snareConfidence: 0,
  };
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
