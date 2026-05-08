import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeAudioFrame, createAnalyzerState } from './analyzer';
import {
  createCueDescriptorFrame,
  createDescriptorAccumulator,
  summarizeDescriptors,
} from './descriptors';
import type {
  AudioDebugBuffers,
  AudioInputDevice,
  ActiveInputDevice,
  AudioSourceKind,
  CueDescriptorFrame,
  DescriptorSummary,
  SongWaveformOverview,
  TuningSettings,
  VisualControlFrame,
} from './types';

const fftSize = 2048;
const uiFrameIntervalMs = 50;
const descriptorHistoryWindowSeconds = 180;
const waveformOverviewBuckets = 1600;

type PendingFrameEvents = {
  beatPulse: boolean;
  impact: number;
  kickPulse: boolean;
  onsetPulse: boolean;
};

const defaultSettings: TuningSettings = {
  smoothing: 0.72,
  noiseFloor: 0.002,
  onsetSensitivity: 0.48,
  kickSensitivity: 0.45,
  eventCooldownMs: 115,
};

const emptyPendingFrameEvents: PendingFrameEvents = {
  beatPulse: false,
  impact: 0,
  kickPulse: false,
  onsetPulse: false,
};

type CapturableAudioElement = HTMLAudioElement & {
  captureStream?: () => MediaStream;
};

export function useAudioEngine() {
  const [sourceKind, setSourceKind] = useState<AudioSourceKind>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventCounts, setEventCounts] = useState({ beat: 0, kick: 0, onset: 0 });
  const [frame, setFrame] = useState<VisualControlFrame | null>(null);
  const [descriptorHistoryCount, setDescriptorHistoryCount] = useState(0);
  const [latestDescriptor, setLatestDescriptor] = useState<CueDescriptorFrame | null>(null);
  const [descriptorSummary, setDescriptorSummary] = useState<DescriptorSummary | null>(null);
  const [bufferVersion, setBufferVersion] = useState(0);
  const [activeInputDevice, setActiveInputDevice] = useState<ActiveInputDevice | null>(null);
  const [inputDevices, setInputDevices] = useState<AudioInputDevice[]>([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const [settings, setSettings] = useState<TuningSettings>(defaultSettings);
  const [songWaveform, setSongWaveform] = useState<SongWaveformOverview | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBuffersRef = useRef<AudioDebugBuffers>({
    waveform: new Float32Array(0),
    spectrum: new Uint8Array(0),
  });
  const descriptorHistoryRef = useRef<CueDescriptorFrame[]>([]);
  const descriptorAccumulatorRef = useRef(createDescriptorAccumulator());
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const sourceAudioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyzerStateRef = useRef(createAnalyzerState());
  const pendingFrameEventsRef = useRef<PendingFrameEvents>({ ...emptyPendingFrameEvents });
  const lastUiFrameAtRef = useRef(0);
  const settingsRef = useRef(settings);
  const sourceKindRef = useRef(sourceKind);

  const refreshInputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Audio input ${index + 1}`,
      }));

    setInputDevices(audioInputs);

    if (!selectedInputId && audioInputs[0]) {
      setSelectedInputId(audioInputs[0].deviceId);
    }
  }, [selectedInputId]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    sourceKindRef.current = sourceKind;
  }, [sourceKind]);

  const stopLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startAnalysisLoop = useCallback(() => {
    stopLoop();

    const tick = () => {
      const analyser = analyserRef.current;
      const context = contextRef.current;

      if (analyser && context) {
        const result = analyzeAudioFrame(
          analyser,
          context.currentTime,
          settingsRef.current,
          analyzerStateRef.current,
        );
        const nextFrame = result.frame;
        audioBuffersRef.current = result.buffers;

        if (nextFrame.onsetPulse || nextFrame.kickPulse || nextFrame.beatPulse) {
          pendingFrameEventsRef.current = {
            beatPulse: pendingFrameEventsRef.current.beatPulse || nextFrame.beatPulse,
            impact: Math.max(pendingFrameEventsRef.current.impact, nextFrame.impact),
            kickPulse: pendingFrameEventsRef.current.kickPulse || nextFrame.kickPulse,
            onsetPulse: pendingFrameEventsRef.current.onsetPulse || nextFrame.onsetPulse,
          };
          setEventCounts((current) => ({
            onset: current.onset + (nextFrame.onsetPulse ? 1 : 0),
            kick: current.kick + (nextFrame.kickPulse ? 1 : 0),
            beat: current.beat + (nextFrame.beatPulse ? 1 : 0),
          }));
        }

        const now = performance.now();
        if (now - lastUiFrameAtRef.current >= uiFrameIntervalMs) {
          const pendingEvents = pendingFrameEventsRef.current;
          const uiFrame = {
            ...nextFrame,
            beatPulse: nextFrame.beatPulse || pendingEvents.beatPulse,
            impact: Math.max(nextFrame.impact, pendingEvents.impact),
            kickPulse: nextFrame.kickPulse || pendingEvents.kickPulse,
            onsetPulse: nextFrame.onsetPulse || pendingEvents.onsetPulse,
          };
          pendingFrameEventsRef.current = { ...emptyPendingFrameEvents };
          const sourceTime =
            sourceKindRef.current === 'file' && audioRef.current
              ? audioRef.current.currentTime
              : uiFrame.time;
          const descriptor = createCueDescriptorFrame(
            uiFrame,
            sourceTime,
            descriptorAccumulatorRef.current,
          );
          descriptorHistoryRef.current = trimDescriptorHistory(
            [...descriptorHistoryRef.current, descriptor],
            sourceTime,
          );

          lastUiFrameAtRef.current = now;
          setLatestDescriptor(descriptor);
          setDescriptorHistoryCount(descriptorHistoryRef.current.length);
          setDescriptorSummary(summarizeDescriptors(descriptorHistoryRef.current));
          setFrame(uiFrame);
          setBufferVersion((version) => version + 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, [stopLoop]);

  const resetPipeline = useCallback(() => {
    stopLoop();

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    analyserRef.current?.disconnect();
    analyserRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setActiveInputDevice(null);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    sourceAudioBufferRef.current = null;

    analyzerStateRef.current = createAnalyzerState();
    pendingFrameEventsRef.current = { ...emptyPendingFrameEvents };
    descriptorAccumulatorRef.current = createDescriptorAccumulator();
    descriptorHistoryRef.current = [];
    audioBuffersRef.current = {
      waveform: new Float32Array(0),
      spectrum: new Uint8Array(0),
    };
    lastUiFrameAtRef.current = 0;
    setEventCounts({ beat: 0, kick: 0, onset: 0 });
    setBufferVersion((version) => version + 1);
    setFrame(null);
    setDescriptorHistoryCount(0);
    setLatestDescriptor(null);
    setDescriptorSummary(null);
    setSongWaveform(null);
    setIsRunning(false);
  }, [stopLoop]);

  const getContext = useCallback(async () => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }

    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  const createAnalyser = useCallback((context: AudioContext) => {
    const analyser = context.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0;
    analyserRef.current = analyser;
    return analyser;
  }, []);

  const startMicrophone = useCallback(async (deviceId = selectedInputId) => {
    try {
      setError(null);
      resetPipeline();

      const context = await getContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const selectedTrack = stream.getAudioTracks()[0];
      if (selectedTrack) {
        const trackSettings = selectedTrack.getSettings();
        const activeDeviceId = trackSettings.deviceId ?? deviceId;
        const requestedLabel =
          inputDevices.find((device) => device.deviceId === activeDeviceId)?.label ||
          selectedTrack.label ||
          'Selected audio input';

        setSelectedInputId(activeDeviceId);
        setActiveInputDevice({
          deviceId: activeDeviceId,
          groupId: trackSettings.groupId,
          label: requestedLabel,
          sampleRate: trackSettings.sampleRate,
        });
      }
      await refreshInputDevices();

      const analyser = createAnalyser(context);
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      mediaStreamRef.current = stream;
      sourceRef.current = source;
      setSourceKind('microphone');
      setIsRunning(true);
      startAnalysisLoop();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to start microphone input.';
      setError(message);
      setSourceKind('idle');
      setIsRunning(false);
    }
  }, [
    createAnalyser,
    getContext,
    inputDevices,
    refreshInputDevices,
    resetPipeline,
    selectedInputId,
    startAnalysisLoop,
  ]);

  const startSystemAudio = useCallback(async () => {
    try {
      setError(null);
      resetPipeline();

      const context = await getContext();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: true,
      });
      const audioTrack = stream.getAudioTracks()[0];

      if (!audioTrack) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('No audio track was shared. Choose a tab/window/screen with audio sharing enabled.');
      }

      stream.getVideoTracks().forEach((track) => track.stop());

      const trackSettings = audioTrack.getSettings();
      setActiveInputDevice({
        deviceId: trackSettings.deviceId ?? 'system-audio',
        groupId: trackSettings.groupId,
        label: audioTrack.label || 'System or tab audio',
        sampleRate: trackSettings.sampleRate,
      });

      const analyser = createAnalyser(context);
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      mediaStreamRef.current = stream;
      sourceRef.current = source;
      setSourceKind('system');
      setIsRunning(true);
      startAnalysisLoop();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Unable to start system/tab audio capture.';
      setError(message);
      setSourceKind('idle');
      setIsRunning(false);
    }
  }, [createAnalyser, getContext, resetPipeline, startAnalysisLoop]);

  const startFile = useCallback(
    async (file: File, shouldAutoplay = true) => {
      try {
        setError(null);
        resetPipeline();

        const context = await getContext();
        const audioElement = audioRef.current;

        if (!audioElement) {
          throw new Error('Audio element is not ready.');
        }

        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        audioElement.crossOrigin = 'anonymous';
        audioElement.muted = false;
        audioElement.volume = 1;
        audioElement.src = objectUrl;
        audioElement.load();

        if (shouldAutoplay) {
          await audioElement.play();
        } else {
          audioElement.currentTime = 0;
        }

        const analyser = createAnalyser(context);
        const capturedStream = (audioElement as CapturableAudioElement).captureStream?.();
        const hasCapturedAudio = Boolean(capturedStream?.getAudioTracks().length);
        const source = capturedStream && hasCapturedAudio
          ? context.createMediaStreamSource(capturedStream)
          : mediaElementSourceRef.current ?? context.createMediaElementSource(audioElement);
        if (!hasCapturedAudio) {
          mediaElementSourceRef.current = source as MediaElementAudioSourceNode;
          analyser.connect(context.destination);
        }
        source.connect(analyser);

        sourceRef.current = source;
        setSourceKind('file');
        setIsRunning(true);
        startAnalysisLoop();

        void decodeSourceAudio(file, context).then((decodedSource) => {
          sourceAudioBufferRef.current = decodedSource.audioBuffer;
          setSongWaveform(decodedSource.waveform);
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to start file input.';
        setError(message);
        setSourceKind('idle');
        setIsRunning(false);
      }
    },
    [createAnalyser, getContext, resetPipeline, startAnalysisLoop],
  );

  const createRoughClipFile = useCallback((startTime: number, endTime: number, name: string) => {
    const audioBuffer = sourceAudioBufferRef.current;
    if (!audioBuffer) {
      throw new Error('Load a song before saving rough clips.');
    }

    const startSample = Math.floor(clamp(startTime, 0, audioBuffer.duration) * audioBuffer.sampleRate);
    const endSample = Math.ceil(clamp(endTime, 0, audioBuffer.duration) * audioBuffer.sampleRate);
    if (endSample <= startSample) {
      throw new Error('Choose a region with a start before the end.');
    }

    const monoSamples = downmixAudioBufferRange(audioBuffer, startSample, endSample);
    return new File([encodeMonoWav(monoSamples, audioBuffer.sampleRate)], `${name}.wav`, {
      type: 'audio/wav',
    });
  }, []);

  const stop = useCallback(() => {
    resetPipeline();
    setSourceKind('idle');
  }, [resetPipeline]);

  useEffect(() => {
    return () => {
      resetPipeline();
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== 'closed') {
        void context.close();
      }
    };
  }, [resetPipeline]);

  return {
    audioRef,
    audioBuffersRef,
    descriptorHistoryRef,
    descriptorHistoryCount,
    descriptorSummary,
    activeInputDevice,
    bufferVersion,
    error,
    eventCounts,
    frame,
    latestDescriptor,
    inputDevices,
    isRunning,
    selectedInputId,
    setSelectedInputId,
    settings,
    sourceKind,
    songWaveform,
    setSettings,
    createRoughClipFile,
    startFile,
    startMicrophone,
    startSystemAudio,
    stop,
  };
}

async function decodeSourceAudio(
  file: File,
  context: AudioContext,
): Promise<{ audioBuffer: AudioBuffer; waveform: SongWaveformOverview }> {
  const audioBuffer = await context.decodeAudioData(await file.arrayBuffer());
  return {
    audioBuffer,
    waveform: createSongWaveformOverview(audioBuffer),
  };
}

function createSongWaveformOverview(audioBuffer: AudioBuffer): SongWaveformOverview {
  const bucketCount = Math.min(waveformOverviewBuckets, audioBuffer.length);
  const samplesPerBucket = Math.max(1, Math.floor(audioBuffer.length / bucketCount));
  const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) =>
    audioBuffer.getChannelData(index),
  );

  const buckets = Array.from({ length: bucketCount }, (_, bucketIndex) => {
    const start = bucketIndex * samplesPerBucket;
    const end =
      bucketIndex === bucketCount - 1
        ? audioBuffer.length
        : Math.min(audioBuffer.length, start + samplesPerBucket);
    let min = 1;
    let max = -1;
    let squaredTotal = 0;
    let count = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      let sample = 0;
      for (const channel of channels) {
        sample += channel[sampleIndex] ?? 0;
      }
      sample /= channels.length;

      min = Math.min(min, sample);
      max = Math.max(max, sample);
      squaredTotal += sample * sample;
      count += 1;
    }

    return {
      min,
      max,
      rms: count > 0 ? Math.sqrt(squaredTotal / count) : 0,
    };
  });

  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    buckets,
  };
}

function downmixAudioBufferRange(
  audioBuffer: AudioBuffer,
  startSample: number,
  endSample: number,
): Float32Array<ArrayBuffer> {
  const sampleCount = endSample - startSample;
  const output = new Float32Array(sampleCount);
  const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) =>
    audioBuffer.getChannelData(index),
  );

  for (let index = 0; index < sampleCount; index += 1) {
    let sample = 0;
    for (const channel of channels) {
      sample += channel[startSample + index] ?? 0;
    }
    output[index] = sample / channels.length;
  }

  return output;
}

function encodeMonoWav(samples: Float32Array<ArrayBuffer>, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const headerSize = 44;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = headerSize;
  for (const sample of samples) {
    const clamped = clamp(sample, -1, 1);
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function trimDescriptorHistory(
  history: CueDescriptorFrame[],
  currentSourceTime: number,
): CueDescriptorFrame[] {
  const windowStart = currentSourceTime - descriptorHistoryWindowSeconds;
  const firstKeptIndex = history.findIndex((descriptor) => descriptor.sourceTime >= windowStart);
  return firstKeptIndex <= 0 ? history : history.slice(firstKeptIndex);
}
