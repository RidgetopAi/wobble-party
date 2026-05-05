export type AudioSourceKind = 'idle' | 'microphone' | 'system' | 'file';

export type BandEnergies = {
  bass: number;
  lowMid: number;
  mid: number;
  high: number;
};

export type DebugAudioFrame = {
  rms: number;
  peak: number;
  spectralCentroid: number;
  spectralFlux: number;
  adaptiveFloor: number;
  rawBands: BandEnergies;
  signalGate: number;
  smoothedBands: BandEnergies;
};

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

  debug: DebugAudioFrame;
};

export type CueDescriptorFrame = {
  time: number;
  sourceTime: number;
  intensity: number;
  bassDominance: number;
  brightness: number;
  roughness: number;
  density: number;
  transientness: number;
  sustain: number;
  buildSlope: number;
  onsetDensity: number;
  beatConfidence: number;
  lowMidPressure: number;
};

export type DescriptorSummary = {
  startTime: number;
  endTime: number;
  duration: number;
  frameCount: number;
  averages: Omit<CueDescriptorFrame, 'time' | 'sourceTime'>;
  peaks: Omit<CueDescriptorFrame, 'time' | 'sourceTime'>;
};

export type CueLabel =
  | 'kick'
  | 'snare'
  | 'hatShimmer'
  | 'deepSaw'
  | 'bassGrowl'
  | 'dropImpact'
  | 'buildTension'
  | 'vocalFocus';

export type CueFingerprint = {
  id: string;
  label: CueLabel;
  sourceName: string;
  startTime: number;
  endTime: number;
  descriptorSummary: DescriptorSummary;
  notes?: string;
  createdAt: string;
};

export type LightingControls = {
  washMood: number;
  beamPulse: number;
  laserIntensity: number;
  strobeBurst: number;
  blinderHit: number;
  floorGlow: number;
  pixelSparkle: number;
  hazeAmount: number;
};

export type WobblerControls = {
  bounceAmount: number;
  swaySpeed: number;
  leanAmount: number;
  jumpTrigger: number;
  crowdActivity: number;
  detailMotion: number;
  heavyBob: number;
};

export type CameraControls = {
  pushPull: number;
  shakePunch: number;
  orbitSpeed: number;
  focalTarget: number;
  framingTightness: number;
  transitionMove: number;
};

export type CueControlFrame = {
  lighting: LightingControls;
  wobblers: WobblerControls;
  camera: CameraControls;
};

export type TuningSettings = {
  smoothing: number;
  noiseFloor: number;
  onsetSensitivity: number;
  kickSensitivity: number;
  eventCooldownMs: number;
};

export type AudioDebugBuffers = {
  waveform: Float32Array<ArrayBuffer>;
  spectrum: Uint8Array<ArrayBuffer>;
};

export type SongWaveformBucket = {
  min: number;
  max: number;
  rms: number;
};

export type SongWaveformOverview = {
  duration: number;
  sampleRate: number;
  buckets: SongWaveformBucket[];
};

export type RoughCueClip = {
  id: string;
  name: string;
  sourceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  createdAt: string;
  status: 'rough' | 'refining' | 'finalized';
  label?: CueLabel;
  notes?: string;
};

export type RoughCueClipRecord = RoughCueClip & {
  blob: Blob;
};

export type AudioAnalysisResult = {
  frame: VisualControlFrame;
  buffers: AudioDebugBuffers;
};

export type AudioInputDevice = {
  deviceId: string;
  label: string;
};

export type ActiveInputDevice = {
  deviceId: string;
  groupId?: string;
  label: string;
  sampleRate?: number;
};
