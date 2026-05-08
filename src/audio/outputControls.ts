import type { CueControlFrame, CueDescriptorFrame, NamedCueControls, VisualControlFrame } from './types';

export function createCueControlFrame(
  frame: VisualControlFrame | null,
  descriptor: CueDescriptorFrame | null,
  cues: NamedCueControls = { snareConfidence: 0 },
): CueControlFrame {
  const energy = frame?.masterEnergy ?? 0;
  const bass = frame?.bassEnergy ?? 0;
  const high = frame?.highEnergy ?? 0;
  const impact = frame?.impact ?? 0;
  const brightness = descriptor?.brightness ?? frame?.brightness ?? 0;
  const roughness = descriptor?.roughness ?? 0;
  const density = descriptor?.density ?? 0;
  const sustain = descriptor?.sustain ?? 0;
  const transientness = descriptor?.transientness ?? 0;
  const lowMidPressure = descriptor?.lowMidPressure ?? 0;
  const buildSlope = descriptor?.buildSlope ?? 0;
  const pulseHit = frame?.kickPulse ? 1 : frame?.onsetPulse ? 0.78 : frame?.beatPulse ? 0.42 : 0;
  const snareConfidence = cues.snareConfidence;

  return {
    lighting: {
      washMood: clamp(energy * 0.55 + sustain * 0.45),
      beamPulse: clamp(impact * 0.58 + transientness * 0.3 + snareConfidence * 0.22),
      laserIntensity: clamp(high * 0.65 + brightness * 0.35),
      strobeBurst: clamp(impact * transientness * 1.2 + snareConfidence * 0.45),
      blinderHit: clamp(impact * 0.75 + buildSlope * 0.25),
      floorGlow: clamp(bass * 0.55 + lowMidPressure * 0.45),
      pixelSparkle: clamp(high * 0.45 + brightness * 0.35 + density * 0.2),
      hazeAmount: clamp(sustain * 0.45 + lowMidPressure * 0.35 + roughness * 0.2),
    },
    wobblers: {
      bounceAmount: clamp(bass * 0.72 + impact * 0.28),
      swaySpeed: clamp(energy * 0.5 + density * 0.25 + brightness * 0.25),
      leanAmount: clamp(lowMidPressure * 0.55 + sustain * 0.45),
      jumpTrigger: clamp(impact * 0.38 + transientness * 0.22 + pulseHit * 0.42 + snareConfidence * 0.52),
      hitReaction: clamp(
        Math.max(
          impact * 0.72 + transientness * 0.22 + snareConfidence * 0.42,
          pulseHit * Math.max(impact, 0.35),
        ),
      ),
      snarePop: snareConfidence,
      crowdActivity: clamp(energy * 0.65 + density * 0.35),
      detailMotion: clamp(high * 0.55 + brightness * 0.45),
      heavyBob: clamp(bass * 0.82 + lowMidPressure * 0.18 + pulseHit * bass * 0.18),
    },
    camera: {
      pushPull: clamp(energy * 0.45 + buildSlope * 0.35 + sustain * 0.2),
      shakePunch: clamp(impact * 0.8 + transientness * 0.2),
      orbitSpeed: clamp(energy * 0.45 + brightness * 0.25 + density * 0.3),
      focalTarget: clamp((descriptor?.bassDominance ?? 0) * 0.35 + brightness * 0.35 + sustain * 0.3),
      framingTightness: clamp(sustain * 0.55 + (1 - density) * 0.25 + lowMidPressure * 0.2),
      transitionMove: clamp(buildSlope * 0.65 + impact * 0.35),
    },
    cues,
  };
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
