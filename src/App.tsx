import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  ChangeEvent,
  Dispatch,
  PointerEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from 'react';
import './App.css';
import { summarizeDescriptors } from './audio/descriptors';
import { createCueControlFrame } from './audio/outputControls';
import { useAudioEngine } from './audio/useAudioEngine';
import {
  deleteRoughCueClip,
  getRoughCueClip,
  listRoughCueClipRecords,
  saveRoughCueClip,
  updateRoughCueClip,
} from './storage/roughClips';
import type {
  CueControlFrame,
  CueFingerprint,
  CueDescriptorFrame,
  CueLabel,
  DescriptorSummary,
  RoughCueClip,
  RoughCueClipRecord,
  SongWaveformOverview,
  TuningSettings,
  VisualControlFrame,
} from './audio/types';

const meterKeys = [
  ['masterEnergy', 'Master'],
  ['bassEnergy', 'Bass'],
  ['lowMidEnergy', 'Low Mid'],
  ['midEnergy', 'Mid'],
  ['highEnergy', 'High'],
  ['brightness', 'Bright'],
  ['impact', 'Impact'],
  ['motionIntensity', 'Motion'],
  ['lightIntensity', 'Light'],
] as const;

const descriptorKeys = [
  ['intensity', 'Intensity'],
  ['bassDominance', 'Bass Dom'],
  ['brightness', 'Brightness'],
  ['roughness', 'Roughness'],
  ['density', 'Density'],
  ['transientness', 'Transient'],
  ['sustain', 'Sustain'],
  ['buildSlope', 'Build'],
  ['onsetDensity', 'Onset Dens'],
  ['beatConfidence', 'Beat Conf'],
  ['lowMidPressure', 'Low-Mid'],
] as const;

const cueLabels = [
  ['kick', 'Kick'],
  ['snare', 'Snare'],
  ['hatShimmer', 'Hat Shimmer'],
  ['deepSaw', 'Deep Saw'],
  ['bassGrowl', 'Bass Growl'],
  ['dropImpact', 'Drop Impact'],
  ['buildTension', 'Build Tension'],
  ['vocalFocus', 'Vocal Focus'],
] as const satisfies readonly [CueLabel, string][];

const cueFingerprintStorageKey = 'wobble-party-cue-fingerprints';
const wobbleWorkshopSettingsStorageKey = 'wobble-party-workshop-settings';
const wobbleWorkshopPresetsStorageKey = 'wobble-party-workshop-presets';
const microSeekSeconds = 0.1;

const fixtures = [
  {
    name: 'Kick Pulse',
    path: '/test-audio/kick-pulse.wav',
  },
  {
    name: 'Steady Pad',
    path: '/test-audio/steady-pad.wav',
  },
  {
    name: 'High Ticks',
    path: '/test-audio/high-ticks.wav',
  },
  {
    name: 'Busy Mix',
    path: '/test-audio/busy-mix.wav',
  },
] as const;

type CalibrationBand = 'bass' | 'lowMid' | 'mid' | 'high' | 'broadband';

type AudioFixture = {
  expected: CalibrationBand;
  name: string;
  path: string;
};

type CueRegion = {
  startTime: number;
  endTime: number;
  isLooping: boolean;
};

type FloatingPanelPosition = {
  x: number;
  y: number;
};

type WaveformViewWindow = {
  startRatio: number;
  endRatio: number;
};

type WobbleWorkshopSettings = {
  audioInfluence: number;
  manualEnergy: number;
  bounceScale: number;
  bobScale: number;
  swayScale: number;
  leanScale: number;
  jumpScale: number;
  detailScale: number;
  glowScale: number;
};

type WobbleWorkshopPreset = {
  id: string;
  name: string;
  notes?: string;
  settings: WobbleWorkshopSettings;
  createdAt: string;
};

const defaultWobbleWorkshopSettings: WobbleWorkshopSettings = {
  audioInfluence: 1,
  manualEnergy: 0,
  bounceScale: 1,
  bobScale: 1,
  swayScale: 1,
  leanScale: 1,
  jumpScale: 1,
  detailScale: 1,
  glowScale: 1,
};

const fullWaveformView: WaveformViewWindow = {
  startRatio: 0,
  endRatio: 1,
};

const calibrationFixtures = [
  {
    name: '60 Hz',
    path: '/test-audio/calibration/sine-60hz.wav',
    expected: 'bass',
  },
  {
    name: '250 Hz',
    path: '/test-audio/calibration/sine-250hz.wav',
    expected: 'lowMid',
  },
  {
    name: '1 kHz',
    path: '/test-audio/calibration/sine-1000hz.wav',
    expected: 'mid',
  },
  {
    name: '6 kHz',
    path: '/test-audio/calibration/sine-6000hz.wav',
    expected: 'high',
  },
  {
    name: 'White Noise',
    path: '/test-audio/calibration/white-noise.wav',
    expected: 'broadband',
  },
  {
    name: 'Band Step',
    path: '/test-audio/calibration/band-step.wav',
    expected: 'broadband',
  },
] as const satisfies readonly AudioFixture[];

function App() {
  const [activeCalibration, setActiveCalibration] = useState<AudioFixture | null>(null);
  const [cueRegion, setCueRegion] = useState<CueRegion>({
    startTime: 0,
    endTime: 0,
    isLooping: false,
  });
  const [currentSourceTime, setCurrentSourceTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [selectedCueLabel, setSelectedCueLabel] = useState<CueLabel>('kick');
  const [cueNotes, setCueNotes] = useState('');
  const [isWaveformInspectorOpen, setIsWaveformInspectorOpen] = useState(false);
  const [waveformView, setWaveformView] = useState<WaveformViewWindow>({
    startRatio: 0,
    endRatio: 1,
  });
  const [isBusProofFloating, setIsBusProofFloating] = useState(false);
  const [busProofPosition, setBusProofPosition] = useState<FloatingPanelPosition>({ x: 28, y: 92 });
  const [wobbleWorkshopSettings, setWobbleWorkshopSettings] = useState<WobbleWorkshopSettings>(
    loadStoredWorkshopSettings,
  );
  const [roughClips, setRoughClips] = useState<RoughCueClipRecord[]>([]);
  const [activeRoughClipId, setActiveRoughClipId] = useState<string | null>(null);
  const [roughClipError, setRoughClipError] = useState<string | null>(null);
  const [savedFingerprints, setSavedFingerprints] = useState<CueFingerprint[]>(() =>
    loadStoredFingerprints(),
  );
  const {
    activeInputDevice,
    audioRef,
    audioBuffersRef,
    bufferVersion,
    descriptorHistoryRef,
    descriptorHistoryCount,
    descriptorSummary,
    error,
    eventCounts,
    frame,
    inputDevices,
    isRunning,
    latestDescriptor,
    selectedInputId,
    setSelectedInputId,
    settings,
    songWaveform,
    sourceKind,
    setSettings,
    createRoughClipFile,
    startFile,
    startMicrophone,
    startSystemAudio,
    stop,
  } = useAudioEngine();

  const status = useMemo(() => {
    if (error) return 'Input error';
    if (!isRunning) return 'Idle';
    if (sourceKind === 'microphone') return 'Listening to microphone';
    if (sourceKind === 'system') return 'Capturing system/tab audio';
    return 'Analyzing file playback';
  }, [error, isRunning, sourceKind]);

  const effectiveMediaDuration = mediaDuration || songWaveform?.duration || 0;
  const isSeekableFile = sourceKind === 'file' && effectiveMediaDuration > 0;
  const isLiveCapture = sourceKind === 'microphone' || sourceKind === 'system';
  const displayedSourceTime =
    sourceKind === 'file' ? currentSourceTime : (latestDescriptor?.sourceTime ?? currentSourceTime);
  const canEditCueRegion =
    isSeekableFile || (isLiveCapture && isRunning && displayedSourceTime > 0);
  const cueControlFrame = useMemo(
    () => createCueControlFrame(frame, latestDescriptor),
    [frame, latestDescriptor],
  );

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    const element = audioElement;

    function handleLoadedMetadata() {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      setMediaDuration(duration);
      setCurrentSourceTime(element.currentTime);
      setCueRegion({
        startTime: 0,
        endTime: duration,
        isLooping: false,
      });
    }

    function handleTimeUpdate() {
      setCurrentSourceTime(element.currentTime);
      setCueRegion((region) => {
        if (
          !region.isLooping ||
          region.endTime <= region.startTime ||
          element.currentTime < region.endTime
        ) {
          return region;
        }

        element.currentTime = region.startTime;
        void element.play();
        return region;
      });
    }

    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('durationchange', handleLoadedMetadata);
    element.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('durationchange', handleLoadedMetadata);
      element.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioRef]);

  useEffect(() => {
    void refreshRoughClips();
  }, []);

  useEffect(() => {
    localStorage.setItem(wobbleWorkshopSettingsStorageKey, JSON.stringify(wobbleWorkshopSettings));
  }, [wobbleWorkshopSettings]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || isEditableTarget(event.target)) return;

      const audioElement = audioRef.current;
      if (!audioElement || !audioElement.src) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (audioElement.paused) {
          void audioElement.play();
        } else {
          audioElement.pause();
        }
        return;
      }

      const seekDelta = getKeyboardSeekDelta(event);
      if (seekDelta !== null) {
        event.preventDefault();
        seekAudioElement(audioElement, seekDelta);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioRef]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void startFile(file);
    }
    event.target.value = '';
  }

  function handleSaveFingerprint() {
    const endTime = cueRegion.endTime > cueRegion.startTime ? cueRegion.endTime : effectiveMediaDuration;
    const selectedFrames = descriptorHistoryRef.current.filter(
      (descriptor) =>
        descriptor.sourceTime >= cueRegion.startTime && descriptor.sourceTime <= endTime,
    );
    const descriptorSummary = summarizeDescriptors(selectedFrames);

    if (!descriptorSummary) return;

    const fingerprint: CueFingerprint = {
      id: crypto.randomUUID(),
      label: selectedCueLabel,
      sourceName: activeInputDevice?.label ?? 'File playback',
      sourceClipId: activeRoughClipId ?? undefined,
      startTime: cueRegion.startTime,
      endTime,
      descriptorSummary,
      notes: cueNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setSavedFingerprints((current) => {
      const next = [fingerprint, ...current].slice(0, 40);
      localStorage.setItem(cueFingerprintStorageKey, JSON.stringify(next));
      return next;
    });
    setCueNotes('');
  }

  function handleUpdateFingerprint(
    id: string,
    updates: Partial<Pick<CueFingerprint, 'label' | 'notes'>>,
  ) {
    setSavedFingerprints((current) => {
      const next = current.map((fingerprint) =>
        fingerprint.id === id ? { ...fingerprint, ...updates } : fingerprint,
      );
      localStorage.setItem(cueFingerprintStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function handleDeleteFingerprint(id: string) {
    setSavedFingerprints((current) => {
      const next = current.filter((fingerprint) => fingerprint.id !== id);
      localStorage.setItem(cueFingerprintStorageKey, JSON.stringify(next));
      return next;
    });
  }

  async function refreshRoughClips() {
    setRoughClips(await listRoughCueClipRecords());
  }

  async function handleSaveRoughClip() {
    const endTime = cueRegion.endTime > cueRegion.startTime ? cueRegion.endTime : effectiveMediaDuration;
    const duration = Math.max(0, endTime - cueRegion.startTime);
    if (!isSeekableFile || duration <= 0) return;

    const clipNumber = roughClips.length + 1;
    const name = `rough-cue-${String(clipNumber).padStart(2, '0')}`;
    setRoughClipError(null);
    const clipFile = createRoughClipFile(cueRegion.startTime, endTime, name);
    const clip: RoughCueClip = {
      id: crypto.randomUUID(),
      name,
      sourceName: activeInputDevice?.label ?? 'File playback',
      startTime: cueRegion.startTime,
      endTime,
      duration,
      createdAt: new Date().toISOString(),
      status: 'rough',
      label: selectedCueLabel,
      notes: cueNotes.trim() || undefined,
    };

    await saveRoughCueClip({ ...clip, blob: clipFile });
    setActiveRoughClipId(clip.id);
    await refreshRoughClips();
  }

  async function handleLoadRoughClip(id: string) {
    setRoughClipError(null);
    const clip = roughClips.find((candidate) => candidate.id === id) ?? (await getRoughCueClip(id));
    if (!clip) {
      setRoughClipError('Rough clip was not found in local storage.');
      return;
    }

    setActiveRoughClipId(clip.id);
    setSelectedCueLabel(clip.label ?? 'kick');
    setCueNotes(clip.notes ?? '');
    const clipFile = new File([clip.blob], `${clip.name}.wav`, { type: 'audio/wav' });
    await startFile(clipFile, false);
    await updateRoughCueClip(clip.id, { status: 'refining' });
    await refreshRoughClips();
  }

  async function handleUpdateRoughClip(id: string, updates: Partial<Pick<RoughCueClip, 'label' | 'name' | 'notes' | 'status'>>) {
    await updateRoughCueClip(id, updates);
    await refreshRoughClips();
  }

  async function handleDeleteRoughClip(id: string) {
    await deleteRoughCueClip(id);
    if (activeRoughClipId === id) setActiveRoughClipId(null);
    await refreshRoughClips();
  }

  async function handleFixtureLoad(path: string, name: string) {
    setActiveCalibration(null);
    const response = await fetch(path);
    const blob = await response.blob();
    const file = new File([blob], `${name}.wav`, { type: 'audio/wav' });
    await startFile(file);
  }

  async function handleCalibrationLoad(fixture: AudioFixture) {
    setActiveCalibration(fixture);
    const response = await fetch(fixture.path);
    const blob = await response.blob();
    const file = new File([blob], `${fixture.name}.wav`, { type: 'audio/wav' });
    await startFile(file);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Wobble Brain v0.1</p>
          <h1>Audio Diagnostic Dashboard</h1>
        </div>
        <div className="status-panel">
          <span className={`status-dot ${isRunning ? 'live' : ''}`} />
          <span>{status}</span>
        </div>
      </section>

      <section className="control-strip">
        <button
          type="button"
          onClick={() => {
            setActiveCalibration(null);
            void startMicrophone();
          }}
        >
          Start Mic
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveCalibration(null);
            void startSystemAudio();
          }}
        >
          Capture Audio
        </button>
        <select
          aria-label="Audio input device"
          className="device-select"
          value={selectedInputId}
          onChange={(event) => {
            const deviceId = event.target.value;
            setSelectedInputId(deviceId);
            if (sourceKind === 'microphone' && isRunning) {
              setActiveCalibration(null);
              void startMicrophone(deviceId);
            }
          }}
        >
          {inputDevices.length === 0 ? <option value="">Default input - labels appear after mic permission</option> : null}
          {inputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <label className="file-button">
          Load Audio
          <input accept="audio/*" type="file" onChange={handleFileChange} />
        </label>
        <button type="button" className="secondary" disabled={!isRunning} onClick={stop}>
          Stop
        </button>
        <audio ref={audioRef} className="audio-player" controls onEnded={stop} />
      </section>

      <section className="fixture-strip" aria-label="Test audio fixtures">
        <span>Fixtures</span>
        {fixtures.map((fixture) => (
          <button
            key={fixture.path}
            type="button"
            className="fixture-button"
            onClick={() => void handleFixtureLoad(fixture.path, fixture.name)}
          >
            {fixture.name}
          </button>
        ))}
      </section>

      <section className="fixture-strip" aria-label="Calibration audio fixtures">
        <span>Calibration</span>
        {calibrationFixtures.map((fixture) => (
          <button
            key={fixture.path}
            type="button"
            className="fixture-button"
            onClick={() => void handleCalibrationLoad(fixture)}
          >
            {fixture.name}
          </button>
        ))}
      </section>

      {error ? <p className="error-line">{error}</p> : null}

      <section className="input-debug">
        <span>Active input</span>
        <strong>{activeInputDevice?.label ?? (sourceKind === 'file' ? 'File playback' : 'None')}</strong>
        {activeInputDevice?.sampleRate ? <span>{activeInputDevice.sampleRate} Hz</span> : null}
      </section>

      <section className="song-overview-section">
        <Panel title="Song Waveform Overview">
          <div className="panel-actions">
            <button
              type="button"
              className="secondary"
              disabled={!songWaveform}
              onClick={() => setIsWaveformInspectorOpen(true)}
            >
              Pop Out
            </button>
          </div>
          <SongOverviewCanvas
            audioRef={audioRef}
            currentTime={displayedSourceTime}
            region={cueRegion}
            waveform={songWaveform}
            view={fullWaveformView}
          />
        </Panel>
      </section>

      <section className="workshop-section">
        <Panel title="Wobble Workshop">
          <WobbleWorkshopPanel
            controlFrame={cueControlFrame}
            frame={frame}
            settings={wobbleWorkshopSettings}
            setSettings={setWobbleWorkshopSettings}
          />
        </Panel>
      </section>

      <section className="dashboard-grid">
        <Panel title="Waveform">
          <WaveformCanvas buffersRef={audioBuffersRef} frame={frame} version={bufferVersion} />
        </Panel>

        <Panel title="Frequency Spectrum">
          <SpectrumCanvas buffersRef={audioBuffersRef} version={bufferVersion} />
        </Panel>

        <Panel title="Cue Region Loop">
          <CueRegionPanel
            audioRef={audioRef}
            canEdit={canEditCueRegion}
            canPlayback={isSeekableFile}
            currentTime={displayedSourceTime}
            duration={effectiveMediaDuration}
            region={cueRegion}
            setRegion={setCueRegion}
          />
        </Panel>

        <Panel title="Rough Cue Clips">
          <RoughCueClipsPanel
            activeClipId={activeRoughClipId}
            canSave={isSeekableFile && cueRegion.endTime > cueRegion.startTime}
            clips={roughClips}
            error={roughClipError}
            onDelete={handleDeleteRoughClip}
            onLoadClip={handleLoadRoughClip}
            onSave={handleSaveRoughClip}
            onUpdate={handleUpdateRoughClip}
          />
        </Panel>

        <Panel title="Cue Fingerprints">
          <CueFingerprintPanel
            canSave={descriptorHistoryCount > 0 && cueRegion.endTime > cueRegion.startTime}
            label={selectedCueLabel}
            notes={cueNotes}
            region={cueRegion}
            savedFingerprints={savedFingerprints}
            setLabel={setSelectedCueLabel}
            setNotes={setCueNotes}
            onSave={handleSaveFingerprint}
            onDelete={handleDeleteFingerprint}
            onLoadClip={handleLoadRoughClip}
            onUpdate={handleUpdateFingerprint}
          />
        </Panel>

        <Panel title="Control Buses">
          <div className="meter-list">
            {meterKeys.map(([key, label]) => (
              <Meter key={key} label={label} value={frame?.[key] ?? 0} />
            ))}
          </div>
        </Panel>

        <Panel title="Band Calibration">
          <CalibrationPanel
            activeFixture={activeCalibration}
            frame={frame}
            isLiveInput={sourceKind === 'microphone' || sourceKind === 'system'}
          />
        </Panel>

        <Panel title="Event Tracer">
          <div className="event-grid">
            <EventPill active={Boolean(frame?.onsetPulse)} label="Onset" />
            <EventPill active={Boolean(frame?.kickPulse)} label="Kick" />
            <EventPill active={Boolean(frame?.beatPulse)} label="Beat" />
          </div>
          <dl className="metric-grid">
            <Metric label="Tempo" value={frame?.tempo ? `${frame.tempo.toFixed(0)} BPM` : 'No lock'} />
            <Metric label="Confidence" value={formatPercent(frame?.tempoConfidence ?? 0)} />
            <Metric label="Flux" value={(frame?.debug.spectralFlux ?? 0).toFixed(3)} />
            <Metric label="Floor" value={(frame?.debug.adaptiveFloor ?? 0).toFixed(3)} />
            <Metric label="Gate" value={formatPercent(frame?.debug.signalGate ?? 0)} />
            <Metric label="Onsets" value={String(eventCounts.onset)} />
            <Metric label="Kicks" value={String(eventCounts.kick)} />
            <Metric label="Beats" value={String(eventCounts.beat)} />
          </dl>
        </Panel>

        <Panel title="Cue Lab Descriptors">
          <DescriptorPanel
            descriptor={latestDescriptor}
            historyCount={descriptorHistoryCount}
            summary={descriptorSummary}
          />
        </Panel>

        <Panel title="Output Families">
          <OutputFamiliesPanel controlFrame={cueControlFrame} />
        </Panel>

        <Panel title="Tuning">
          <TuningControls settings={settings} setSettings={setSettings} />
        </Panel>

        <Panel title="VisualControlFrame">
          <pre className="frame-inspector">{formatFrame(frame)}</pre>
        </Panel>

        <Panel title="Control Bus Proof">
          <div className="panel-actions">
            <button type="button" className="secondary" onClick={() => setIsBusProofFloating(true)}>
              Pop Out
            </button>
          </div>
          <BusProof frame={frame} />
        </Panel>
      </section>

      {isBusProofFloating ? (
        <FloatingBusProof
          frame={frame}
          position={busProofPosition}
          setPosition={setBusProofPosition}
          onClose={() => setIsBusProofFloating(false)}
        />
      ) : null}

      {isWaveformInspectorOpen ? (
        <WaveformInspector
          audioRef={audioRef}
          currentTime={displayedSourceTime}
          region={cueRegion}
          setRegion={setCueRegion}
          setView={setWaveformView}
          view={waveformView}
          waveform={songWaveform}
          onClose={() => setIsWaveformInspectorOpen(false)}
        />
      ) : null}
    </main>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function FloatingBusProof({
  frame,
  onClose,
  position,
  setPosition,
}: {
  frame: VisualControlFrame | null;
  onClose: () => void;
  position: FloatingPanelPosition;
  setPosition: Dispatch<SetStateAction<FloatingPanelPosition>>;
}) {
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panelX: number;
    panelY: number;
  } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panelX: position.x,
      panelY: position.y,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    const nextX = dragStart.panelX + event.clientX - dragStart.startX;
    const nextY = dragStart.panelY + event.clientY - dragStart.startY;
    setPosition({
      x: clamp(nextX, 8, Math.max(8, window.innerWidth - 380)),
      y: clamp(nextY, 8, Math.max(8, window.innerHeight - 360)),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  return (
    <aside
      className="floating-bus-proof"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div
        className="floating-panel-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <strong>Control Bus Proof</strong>
        <button
          type="button"
          className="secondary"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
        >
          Dock
        </button>
      </div>
      <BusProof frame={frame} />
    </aside>
  );
}

function WaveformInspector({
  audioRef,
  currentTime,
  onClose,
  region,
  setRegion,
  setView,
  view,
  waveform,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTime: number;
  onClose: () => void;
  region: CueRegion;
  setRegion: Dispatch<SetStateAction<CueRegion>>;
  setView: Dispatch<SetStateAction<WaveformViewWindow>>;
  view: WaveformViewWindow;
  waveform: SongWaveformOverview | null;
}) {
  const duration = waveform?.duration ?? 0;
  const viewStartTime = view.startRatio * duration;
  const viewEndTime = view.endRatio * duration;

  function zoom(multiplier: number) {
    setView((current) => {
      const center = (current.startRatio + current.endRatio) / 2;
      const currentSize = current.endRatio - current.startRatio;
      const nextSize = clamp(currentSize * multiplier, 0.01, 1);
      return clampViewWindow(center - nextSize / 2, center + nextSize / 2);
    });
  }

  function pan(direction: number) {
    setView((current) => {
      const size = current.endRatio - current.startRatio;
      const delta = size * 0.35 * direction;
      return clampViewWindow(current.startRatio + delta, current.endRatio + delta);
    });
  }

  function zoomToPlayhead() {
    if (!duration) return;
    const center = clamp(currentTime / duration, 0, 1);
    const size = Math.min(0.18, view.endRatio - view.startRatio);
    setView(clampViewWindow(center - size / 2, center + size / 2));
  }

  function useVisibleAsRegion() {
    if (!duration) return;
    setRegion((current) => ({
      ...current,
      startTime: viewStartTime,
      endTime: viewEndTime,
      isLooping: false,
    }));
  }

  return (
    <div className="waveform-inspector-backdrop">
      <section className="waveform-inspector">
        <div className="waveform-inspector-header">
          <div>
            <h2>Song Waveform Inspector</h2>
            <p>
              {duration
                ? `${formatTime(viewStartTime)}-${formatTime(viewEndTime)} visible`
                : 'Load audio to inspect the waveform'}
            </p>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            Dock
          </button>
        </div>

        <div className="waveform-inspector-actions">
          <button type="button" className="secondary" disabled={!waveform} onClick={() => zoom(0.5)}>
            Zoom In
          </button>
          <button type="button" className="secondary" disabled={!waveform} onClick={() => zoom(2)}>
            Zoom Out
          </button>
          <button type="button" className="secondary" disabled={!waveform} onClick={() => pan(-1)}>
            Pan Left
          </button>
          <button type="button" className="secondary" disabled={!waveform} onClick={() => pan(1)}>
            Pan Right
          </button>
          <button type="button" className="secondary" disabled={!waveform} onClick={zoomToPlayhead}>
            Playhead
          </button>
          <button type="button" className="secondary" disabled={!waveform} onClick={() => setView(fullWaveformView)}>
            Full Song
          </button>
          <button type="button" disabled={!waveform} onClick={useVisibleAsRegion}>
            Use Visible As Region
          </button>
        </div>

        <SongOverviewCanvas
          audioRef={audioRef}
          currentTime={currentTime}
          height={440}
          region={region}
          view={view}
          waveform={waveform}
          width={1800}
          onSelectRegion={(startTime, endTime) =>
            setRegion((current) => ({
              ...current,
              startTime,
              endTime,
              isLooping: false,
            }))
          }
        />

        <dl className="metric-grid waveform-inspector-readout">
          <Metric label="Playhead" value={formatTime(currentTime)} />
          <Metric label="Region Start" value={formatTime(region.startTime)} />
          <Metric label="Region End" value={formatTime(region.endTime)} />
          <Metric label="Region Length" value={formatTime(Math.max(0, region.endTime - region.startTime))} />
        </dl>
      </section>
    </div>
  );
}

function SongOverviewCanvas({
  audioRef,
  currentTime,
  height = 260,
  onSelectRegion,
  region,
  view,
  waveform,
  width = 1400,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTime: number;
  height?: number;
  onSelectRegion?: (startTime: number, endTime: number) => void;
  region: CueRegion;
  view: WaveformViewWindow;
  waveform: SongWaveformOverview | null;
  width?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#111827';
    context.fillRect(0, 0, width, height);

    if (!waveform || waveform.buckets.length === 0) {
      context.fillStyle = '#64748b';
      context.font = '18px sans-serif';
      context.textAlign = 'center';
      context.fillText('Load an audio file to see the full song waveform', width / 2, height / 2);
      return;
    }

    const centerY = height * 0.5;
    const amplitudeHeight = height * 0.42;
    const viewStart = clamp(view.startRatio, 0, 1);
    const viewEnd = clamp(view.endRatio, viewStart + 0.001, 1);
    const viewDuration = Math.max(0.001, viewEnd - viewStart);
    const startBucket = Math.floor(viewStart * waveform.buckets.length);
    const endBucket = Math.min(
      waveform.buckets.length,
      Math.ceil(viewEnd * waveform.buckets.length),
    );
    const bucketWidth = width / Math.max(1, endBucket - startBucket);
    const maxRms = Math.max(0.001, ...waveform.buckets.map((bucket) => bucket.rms));

    for (let index = startBucket; index < endBucket; index += 1) {
      const bucket = waveform.buckets[index];
      const x = (index - startBucket) * bucketWidth;
      const activity = bucket.rms / maxRms;
      const activityHeight = Math.max(1, activity * height);
      const minY = centerY + clamp(bucket.min, -1, 1) * amplitudeHeight;
      const maxY = centerY + clamp(bucket.max, -1, 1) * amplitudeHeight;

      context.fillStyle = `rgba(20, 184, 166, ${0.1 + activity * 0.32})`;
      context.fillRect(x, height - activityHeight, Math.max(1, bucketWidth), activityHeight);
      context.fillStyle = '#2dd4bf';
      context.fillRect(x, maxY, Math.max(1, bucketWidth), Math.max(1, minY - maxY));
    }

    if (region.endTime > region.startTime) {
      const startRatio = region.startTime / waveform.duration;
      const endRatio = region.endTime / waveform.duration;
      const startX = ((startRatio - viewStart) / viewDuration) * width;
      const endX = ((endRatio - viewStart) / viewDuration) * width;
      context.fillStyle = 'rgba(250, 204, 21, 0.18)';
      context.fillRect(
        clamp(startX, 0, width),
        0,
        Math.max(1, clamp(endX, 0, width) - clamp(startX, 0, width)),
        height,
      );
      context.strokeStyle = '#facc15';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(startX, 0);
      context.lineTo(startX, height);
      context.moveTo(endX, 0);
      context.lineTo(endX, height);
      context.stroke();
    }

    const playheadRatio = clamp(currentTime, 0, waveform.duration) / waveform.duration;
    const playheadX = ((playheadRatio - viewStart) / viewDuration) * width;
    context.strokeStyle = '#f8fafc';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(playheadX, 0);
    context.lineTo(playheadX, height);
    context.stroke();
  }, [currentTime, height, region, view, waveform, width]);

  function getTimeFromPointer(event: PointerEvent<HTMLCanvasElement>) {
    if (!waveform) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const viewStart = clamp(view.startRatio, 0, 1);
    const viewEnd = clamp(view.endRatio, viewStart + 0.001, 1);
    const ratio = viewStart + clamp((event.clientX - rect.left) / rect.width, 0, 1) * (viewEnd - viewStart);
    return ratio * waveform.duration;
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!waveform || !audioRef.current) return;

    const selectedTime = getTimeFromPointer(event);
    if (selectedTime === null) return;

    if (event.shiftKey && onSelectRegion) {
      selectionStartRef.current = selectedTime;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    audioRef.current.currentTime = selectedTime;
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (!onSelectRegion || selectionStartRef.current === null) return;
    const selectedTime = getTimeFromPointer(event);
    if (selectedTime === null) return;
    const startTime = Math.min(selectionStartRef.current, selectedTime);
    const endTime = Math.max(selectionStartRef.current, selectedTime);
    if (endTime - startTime >= 0.05) {
      onSelectRegion(startTime, endTime);
    }
    selectionStartRef.current = null;
  }

  return (
    <div className="song-overview">
      <canvas
        ref={canvasRef}
        className="song-overview-canvas"
        height={height}
        width={width}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      <div className="chart-readout">
        <span>{waveform ? `${formatTime(waveform.duration)} total` : 'No song loaded'}</span>
        <span>{formatTime(currentTime)} playhead</span>
        <span>{waveform ? `${waveform.buckets.length} activity buckets` : '0 activity buckets'}</span>
      </div>
    </div>
  );
}

function WaveformCanvas({
  buffersRef,
  frame,
  version,
}: {
  buffersRef: RefObject<{ waveform: Float32Array<ArrayBuffer>; spectrum: Uint8Array<ArrayBuffer> }>;
  frame: VisualControlFrame | null;
  version: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#111827';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#2dd4bf';
    context.lineWidth = 2;
    context.beginPath();

    const waveform = buffersRef.current.waveform;
    if (waveform.length === 0) {
      context.moveTo(0, height / 2);
      context.lineTo(width, height / 2);
    } else {
      const peak = Math.max(frame?.debug.peak ?? 0, 0.01);
      const displayGain = Math.min(16, 0.72 / peak);
      const step = Math.max(1, Math.floor(waveform.length / width));

      for (let index = 0; index < waveform.length; index += step) {
        const x = (index / (waveform.length - 1)) * width;
        let min = 1;
        let max = -1;

        for (let sampleIndex = index; sampleIndex < Math.min(waveform.length, index + step); sampleIndex += 1) {
          min = Math.min(min, waveform[sampleIndex]);
          max = Math.max(max, waveform[sampleIndex]);
        }

        const sample = Math.abs(max) > Math.abs(min) ? max : min;
        const y = (0.5 - clamp(sample * displayGain, -1, 1) * 0.46) * height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
    }

    context.stroke();
  }, [buffersRef, frame, version]);

  return (
    <div className="chart-stack">
      <canvas ref={canvasRef} className="chart" width="720" height="180" />
      <div className="chart-readout">
        <span>Peak {(frame?.debug.peak ?? 0).toFixed(3)}</span>
        <span>RMS {(frame?.debug.rms ?? 0).toFixed(3)}</span>
      </div>
    </div>
  );
}

function SpectrumCanvas({
  buffersRef,
  version,
}: {
  buffersRef: RefObject<{ waveform: Float32Array<ArrayBuffer>; spectrum: Uint8Array<ArrayBuffer> }>;
  version: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const spectrum = buffersRef.current.spectrum;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#111827';
    context.fillRect(0, 0, width, height);

    if (spectrum.length === 0) return;

    const barWidth = width / spectrum.length;
    for (let index = 0; index < spectrum.length; index += 1) {
      const value = spectrum[index] / 255;
      const barHeight = value * height;
      context.fillStyle = `rgb(${Math.round(45 + value * 180)}, ${Math.round(
        110 + value * 100,
      )}, ${Math.round(120 + value * 90)})`;
      context.fillRect(index * barWidth, height - barHeight, Math.max(1, barWidth), barHeight);
    }
  }, [buffersRef, version]);

  return <canvas ref={canvasRef} className="chart" width="720" height="180" />;
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="meter-row">
      <div className="meter-label">
        <span>{label}</span>
        <span>{formatPercent(value)}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ transform: `scaleX(${value})` }} />
      </div>
    </div>
  );
}

function EventPill({ active, label }: { active: boolean; label: string }) {
  return <div className={`event-pill ${active ? 'active' : ''}`}>{label}</div>;
}

function CalibrationPanel({
  activeFixture,
  frame,
  isLiveInput,
}: {
  activeFixture: AudioFixture | null;
  frame: VisualControlFrame | null;
  isLiveInput: boolean;
}) {
  const rawBands = frame?.debug.rawBands;
  const dominant = rawBands
    ? (Object.entries(rawBands).sort(([, left], [, right]) => right - left)[0]?.[0] as
        | CalibrationBand
        | undefined)
    : undefined;
  const expected = activeFixture?.expected;
  const passes =
    expected === undefined
      ? null
      : expected === 'broadband'
        ? null
        : dominant === expected && (rawBands?.[expected] ?? 0) > 0.05;
  const result =
    frame && frame.debug.signalGate < 0.05
      ? 'Below Floor'
      : passes === null
        ? 'Inspect'
        : passes
          ? 'Pass'
          : 'Check';

  return (
    <div className="calibration-panel">
      <div className="calibration-summary">
        <Metric label="Input" value={activeFixture?.name ?? (isLiveInput ? 'Live Source' : 'None')} />
        <Metric label="Expected" value={formatBandName(expected)} />
        <Metric label="Dominant" value={formatBandName(dominant)} />
        <Metric label="Result" value={result} />
      </div>
      <div className="meter-list compact">
        <Meter label="Raw Bass" value={rawBands?.bass ?? 0} />
        <Meter label="Raw Low Mid" value={rawBands?.lowMid ?? 0} />
        <Meter label="Raw Mid" value={rawBands?.mid ?? 0} />
        <Meter label="Raw High" value={rawBands?.high ?? 0} />
      </div>
    </div>
  );
}

function DescriptorPanel({
  descriptor,
  historyCount,
  summary,
}: {
  descriptor: CueDescriptorFrame | null;
  historyCount: number;
  summary: DescriptorSummary | null;
}) {
  return (
    <div className="descriptor-panel">
      <dl className="metric-grid descriptor-summary">
        <Metric label="Frames" value={String(historyCount)} />
        <Metric label="Window" value={summary ? `${summary.duration.toFixed(1)}s` : '0.0s'} />
        <Metric label="Source Time" value={descriptor ? `${descriptor.sourceTime.toFixed(2)}s` : 'None'} />
        <Metric
          label="Avg Intensity"
          value={formatPercent(summary?.averages.intensity ?? descriptor?.intensity ?? 0)}
        />
      </dl>
      <div className="descriptor-table" role="table" aria-label="Cue descriptor values">
        <div className="descriptor-row descriptor-head" role="row">
          <span>Descriptor</span>
          <span>Live</span>
          <span>Avg</span>
          <span>Peak</span>
        </div>
        {descriptorKeys.map(([key, label]) => (
          <div key={key} className="descriptor-row" role="row">
            <span>{label}</span>
            <span>{formatDecimal(descriptor?.[key] ?? 0)}</span>
            <span>{formatDecimal(summary?.averages[key] ?? 0)}</span>
            <span>{formatDecimal(summary?.peaks[key] ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutputFamiliesPanel({ controlFrame }: { controlFrame: CueControlFrame }) {
  return (
    <div className="output-family-panel">
      <ControlFamily title="Lighting" values={controlFrame.lighting} />
      <ControlFamily title="Wobblers" values={controlFrame.wobblers} />
      <ControlFamily title="Camera" values={controlFrame.camera} />
    </div>
  );
}

function ControlFamily({ title, values }: { title: string; values: Record<string, number> }) {
  return (
    <div className="control-family">
      <h3>{title}</h3>
      <div className="meter-list compact">
        {Object.entries(values).map(([key, value]) => (
          <Meter key={key} label={formatControlName(key)} value={value} />
        ))}
      </div>
    </div>
  );
}

function RoughCueClipsPanel({
  activeClipId,
  canSave,
  clips,
  error,
  onDelete,
  onLoadClip,
  onSave,
  onUpdate,
}: {
  activeClipId: string | null;
  canSave: boolean;
  clips: RoughCueClip[];
  error: string | null;
  onDelete: (id: string) => Promise<void>;
  onLoadClip: (id: string) => Promise<void>;
  onSave: () => Promise<void>;
  onUpdate: (
    id: string,
    updates: Partial<Pick<RoughCueClip, 'label' | 'name' | 'notes' | 'status'>>,
  ) => Promise<void>;
}) {
  return (
    <div className="rough-clips-panel">
      <button type="button" disabled={!canSave} onClick={() => void onSave()}>
        Save Rough Clip
      </button>
      {error ? <p className="inline-error">{error}</p> : null}

      <div className="rough-clip-list">
        {clips.length === 0 ? (
          <p>No rough clips saved yet.</p>
        ) : (
          clips.map((clip) => (
            <RoughClipRow
              key={clip.id}
              clip={clip}
              isActive={clip.id === activeClipId}
              onDelete={onDelete}
              onLoadClip={onLoadClip}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RoughClipRow({
  clip,
  isActive,
  onDelete,
  onLoadClip,
  onUpdate,
}: {
  clip: RoughCueClip;
  isActive: boolean;
  onDelete: (id: string) => Promise<void>;
  onLoadClip: (id: string) => Promise<void>;
  onUpdate: (
    id: string,
    updates: Partial<Pick<RoughCueClip, 'label' | 'name' | 'notes' | 'status'>>,
  ) => Promise<void>;
}) {
  return (
    <div className={`rough-clip-row ${isActive ? 'active' : ''}`}>
      <div className="rough-clip-main">
        <input
          aria-label="Rough clip name"
          defaultValue={clip.name}
          onBlur={(event) => void onUpdate(clip.id, { name: event.target.value.trim() || clip.name })}
        />
        <select
          aria-label="Rough clip label"
          value={clip.label ?? 'kick'}
          onChange={(event) => void onUpdate(clip.id, { label: event.target.value as CueLabel })}
        >
          {cueLabels.map(([value, display]) => (
            <option key={value} value={value}>
              {display}
            </option>
          ))}
        </select>
        <select
          aria-label="Rough clip status"
          value={clip.status}
          onChange={(event) =>
            void onUpdate(clip.id, { status: event.target.value as RoughCueClip['status'] })
          }
        >
          <option value="rough">Rough</option>
          <option value="refining">Refining</option>
          <option value="finalized">Finalized</option>
        </select>
      </div>
      <input
        aria-label="Rough clip notes"
        className="rough-clip-notes"
        placeholder="Notes for refining"
        defaultValue={clip.notes ?? ''}
        onBlur={(event) => void onUpdate(clip.id, { notes: event.target.value.trim() || undefined })}
      />
      <div className="rough-clip-meta">
        <span>{formatTime(clip.duration)}</span>
        <span>
          {formatTime(clip.startTime)}-{formatTime(clip.endTime)}
        </span>
      </div>
      <div className="rough-clip-actions">
        <button type="button" className="secondary" onClick={() => void onLoadClip(clip.id)}>
          Load
        </button>
        <button type="button" className="secondary" onClick={() => void onDelete(clip.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

function CueFingerprintPanel({
  canSave,
  label,
  notes,
  onDelete,
  onLoadClip,
  onSave,
  onUpdate,
  region,
  savedFingerprints,
  setLabel,
  setNotes,
}: {
  canSave: boolean;
  label: CueLabel;
  notes: string;
  onDelete: (id: string) => void;
  onLoadClip: (id: string) => Promise<void>;
  onSave: () => void;
  onUpdate: (id: string, updates: Partial<Pick<CueFingerprint, 'label' | 'notes'>>) => void;
  region: CueRegion;
  savedFingerprints: CueFingerprint[];
  setLabel: Dispatch<SetStateAction<CueLabel>>;
  setNotes: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="cue-fingerprint-panel">
      <div className="fingerprint-form">
        <label className="field-row">
          <span>Label</span>
          <select value={label} onChange={(event) => setLabel(event.target.value as CueLabel)}>
            {cueLabels.map(([value, display]) => (
              <option key={value} value={value}>
                {display}
              </option>
            ))}
          </select>
        </label>
        <label className="field-row">
          <span>Notes</span>
          <input
            maxLength={140}
            placeholder="Optional cue notes"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <button type="button" disabled={!canSave} onClick={onSave}>
          Save Fingerprint
        </button>
      </div>

      <dl className="metric-grid cue-region-summary">
        <Metric label="Selected Start" value={formatTime(region.startTime)} />
        <Metric label="Selected End" value={formatTime(region.endTime)} />
        <Metric label="Saved" value={String(savedFingerprints.length)} />
        <Metric label="Current Label" value={formatCueLabel(label)} />
      </dl>

      <div className="fingerprint-list">
        {savedFingerprints.length === 0 ? (
          <p>No saved fingerprints yet.</p>
        ) : (
          savedFingerprints.slice(0, 10).map((fingerprint) => (
            <FingerprintRow
              key={fingerprint.id}
              fingerprint={fingerprint}
              onDelete={onDelete}
              onLoadClip={onLoadClip}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FingerprintRow({
  fingerprint,
  onDelete,
  onLoadClip,
  onUpdate,
}: {
  fingerprint: CueFingerprint;
  onDelete: (id: string) => void;
  onLoadClip: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Pick<CueFingerprint, 'label' | 'notes'>>) => void;
}) {
  return (
    <div className="fingerprint-row">
      <select
        aria-label="Fingerprint label"
        value={fingerprint.label}
        onChange={(event) => onUpdate(fingerprint.id, { label: event.target.value as CueLabel })}
      >
        {cueLabels.map(([value, display]) => (
          <option key={value} value={value}>
            {display}
          </option>
        ))}
      </select>
      <input
        aria-label="Fingerprint notes"
        defaultValue={fingerprint.notes ?? ''}
        maxLength={140}
        placeholder="Notes"
        onBlur={(event) =>
          onUpdate(fingerprint.id, { notes: event.target.value.trim() || undefined })
        }
      />
      <span>
        {formatTime(fingerprint.startTime)}-{formatTime(fingerprint.endTime)}
      </span>
      <span>{formatPercent(fingerprint.descriptorSummary.averages.intensity)}</span>
      <button
        type="button"
        className="secondary"
        disabled={!fingerprint.sourceClipId}
        onClick={() => {
          if (fingerprint.sourceClipId) void onLoadClip(fingerprint.sourceClipId);
        }}
      >
        Load Clip
      </button>
      <button type="button" className="secondary" onClick={() => onDelete(fingerprint.id)}>
        Delete
      </button>
    </div>
  );
}

function CueRegionPanel({
  audioRef,
  canEdit,
  canPlayback,
  currentTime,
  duration,
  region,
  setRegion,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  canEdit: boolean;
  canPlayback: boolean;
  currentTime: number;
  duration: number;
  region: CueRegion;
  setRegion: Dispatch<SetStateAction<CueRegion>>;
}) {
  const maxTime = Math.max(duration, region.endTime, currentTime, 0.01);
  const normalizedEnd = region.endTime > region.startTime ? region.endTime : maxTime;

  function seekTo(time: number) {
    if (!canPlayback || !audioRef.current) return;
    audioRef.current.currentTime = clamp(time, 0, maxTime);
  }

  function setStartTime(startTime: number) {
    setRegion((current) => ({
      ...current,
      startTime: clamp(
        startTime,
        0,
        current.endTime > current.startTime ? Math.max(0, current.endTime - 0.05) : maxTime,
      ),
    }));
  }

  function setEndTime(endTime: number) {
    setRegion((current) => ({
      ...current,
      endTime: clamp(endTime, Math.min(maxTime, current.startTime + 0.05), maxTime),
    }));
  }

  function captureStart() {
    setStartTime(currentTime);
  }

  function captureEnd() {
    setEndTime(currentTime);
  }

  function playRegion() {
    if (!canPlayback || !audioRef.current || normalizedEnd <= region.startTime) return;
    audioRef.current.currentTime = region.startTime;
    setRegion((current) => ({ ...current, isLooping: true }));
    void audioRef.current.play();
  }

  function toggleLoop() {
    setRegion((current) => ({ ...current, isLooping: !current.isLooping }));
  }

  function stopLoop() {
    setRegion((current) => ({ ...current, isLooping: false }));
    audioRef.current?.pause();
  }

  return (
    <div className="cue-region-panel">
      <dl className="metric-grid cue-region-summary">
        <Metric label="Current" value={formatTime(currentTime)} />
        <Metric label="Start" value={formatTime(region.startTime)} />
        <Metric label="End" value={formatTime(normalizedEnd)} />
        <Metric label="Length" value={formatTime(Math.max(0, normalizedEnd - region.startTime))} />
      </dl>

      <div className="region-slider-stack" aria-disabled={!canEdit}>
        <label className="slider-row">
          <span>
            Region Start
            <strong>{formatTime(region.startTime)}</strong>
          </span>
          <input
            disabled={!canEdit}
            max={maxTime}
            min={0}
            step={0.01}
            type="range"
            value={region.startTime}
            onChange={(event) => setStartTime(Number(event.target.value))}
          />
        </label>
        <label className="slider-row">
          <span>
            Region End
            <strong>{formatTime(normalizedEnd)}</strong>
          </span>
          <input
            disabled={!canEdit}
            max={maxTime}
            min={0}
            step={0.01}
            type="range"
            value={normalizedEnd}
            onChange={(event) => setEndTime(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="region-actions">
        <button type="button" className="secondary region-secondary" disabled={!canEdit} onClick={captureStart}>
          Set Start
        </button>
        <button type="button" className="secondary region-secondary" disabled={!canEdit} onClick={captureEnd}>
          Set End
        </button>
        <button type="button" disabled={!canPlayback} onClick={playRegion}>
          Play Region
        </button>
        <button type="button" className="secondary region-secondary" disabled={!canPlayback} onClick={toggleLoop}>
          {region.isLooping ? 'Loop On' : 'Loop Off'}
        </button>
        <button type="button" className="secondary region-secondary" disabled={!canPlayback || !region.isLooping} onClick={stopLoop}>
          Stop Loop
        </button>
        <button type="button" className="secondary region-secondary" disabled={!canPlayback} onClick={() => seekTo(region.startTime)}>
          Seek Start
        </button>
      </div>
    </div>
  );
}

function WobbleWorkshopPanel({
  controlFrame,
  frame,
  setSettings,
  settings,
}: {
  controlFrame: CueControlFrame;
  frame: VisualControlFrame | null;
  setSettings: Dispatch<SetStateAction<WobbleWorkshopSettings>>;
  settings: WobbleWorkshopSettings;
}) {
  const [swayDirection, setSwayDirection] = useState(1);
  const [presetName, setPresetName] = useState('Baseline groove');
  const [presetNotes, setPresetNotes] = useState('');
  const [presets, setPresets] = useState<WobbleWorkshopPreset[]>(loadStoredWorkshopPresets);
  const lastSwayPulseAtRef = useRef(-Infinity);
  const wobblers = controlFrame.wobblers;
  const manual = settings.manualEnergy;
  const bounce = clamp(
    (wobblers.bounceAmount * settings.audioInfluence + manual) * settings.bounceScale,
    0,
    1,
  );
  const bob = clamp(
    (wobblers.heavyBob * settings.audioInfluence + manual) * settings.bobScale,
    0,
    1,
  );
  const sway = clamp(
    (wobblers.swaySpeed * settings.audioInfluence + manual) * settings.swayScale,
    0,
    1,
  );
  const lean = clamp(
    (wobblers.leanAmount * settings.audioInfluence + manual) * settings.leanScale,
    0,
    1,
  );
  const jump = clamp(
    (wobblers.jumpTrigger * settings.audioInfluence + manual) * settings.jumpScale,
    0,
    1,
  );
  const detail = clamp(
    (wobblers.detailMotion * settings.audioInfluence + manual) * settings.detailScale,
    0,
    1,
  );
  const activity = clamp(wobblers.crowdActivity * settings.audioInfluence + manual, 0, 1);
  const glow = clamp(
    ((frame?.lightIntensity ?? 0) * settings.audioInfluence + manual) * settings.glowScale,
    0,
    1,
  );
  const expression = jump > 0.48 || frame?.kickPulse ? 'jump' : detail > 0.58 ? 'hype' : activity > 0.34 ? 'party' : 'idle';
  const shouldStepSway = Boolean(
    frame &&
      (frame.beatPulse ||
        frame.kickPulse ||
        (frame.tempoConfidence < 0.25 && frame.onsetPulse)),
  );

  useEffect(() => {
    if (!frame || !shouldStepSway || frame.time === lastSwayPulseAtRef.current) return;
    lastSwayPulseAtRef.current = frame.time;
    setSwayDirection((current) => current * -1);
  }, [frame, shouldStepSway]);

  function handleSavePreset() {
    const preset: WobbleWorkshopPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim() || `Workshop preset ${presets.length + 1}`,
      notes: presetNotes.trim() || undefined,
      settings,
      createdAt: new Date().toISOString(),
    };
    const next = [preset, ...presets].slice(0, 24);
    setPresets(next);
    localStorage.setItem(wobbleWorkshopPresetsStorageKey, JSON.stringify(next));
    setPresetName('');
    setPresetNotes('');
  }

  function handleLoadPreset(preset: WobbleWorkshopPreset) {
    setSettings(preset.settings);
  }

  function handleDeletePreset(id: string) {
    const next = presets.filter((preset) => preset.id !== id);
    setPresets(next);
    localStorage.setItem(wobbleWorkshopPresetsStorageKey, JSON.stringify(next));
  }

  return (
    <div className="wobble-workshop">
      <div
        className="hero-wobbler-stage"
        style={{ '--stage-glow': glow } as CSSProperties}
      >
        <HeroWobbler
          activity={activity}
          bob={bob}
          bounce={bounce}
          detail={detail}
          expression={expression}
          glow={glow}
          jump={jump}
          lean={lean}
          sway={sway}
          swayDirection={swayDirection}
        />
      </div>

      <div className="workshop-controls">
        <div className="workshop-control-group">
          <Slider
            label="Audio Influence"
            max={1}
            min={0}
            step={0.01}
            value={settings.audioInfluence}
            onChange={(audioInfluence) =>
              setSettings((current) => ({ ...current, audioInfluence }))
            }
          />
          <Slider
            label="Manual Test"
            max={1}
            min={0}
            step={0.01}
            value={settings.manualEnergy}
            onChange={(manualEnergy) => setSettings((current) => ({ ...current, manualEnergy }))}
          />
        </div>

        <div className="workshop-control-group">
          <Slider
            label="Bounce"
            max={2}
            min={0}
            step={0.01}
            value={settings.bounceScale}
            onChange={(bounceScale) => setSettings((current) => ({ ...current, bounceScale }))}
          />
          <Slider
            label="Heavy Bob"
            max={2}
            min={0}
            step={0.01}
            value={settings.bobScale}
            onChange={(bobScale) => setSettings((current) => ({ ...current, bobScale }))}
          />
          <Slider
            label="Sway"
            max={2}
            min={0}
            step={0.01}
            value={settings.swayScale}
            onChange={(swayScale) => setSettings((current) => ({ ...current, swayScale }))}
          />
          <Slider
            label="Lean"
            max={2}
            min={0}
            step={0.01}
            value={settings.leanScale}
            onChange={(leanScale) => setSettings((current) => ({ ...current, leanScale }))}
          />
        </div>

        <div className="workshop-control-group">
          <Slider
            label="Jump"
            max={2}
            min={0}
            step={0.01}
            value={settings.jumpScale}
            onChange={(jumpScale) => setSettings((current) => ({ ...current, jumpScale }))}
          />
          <Slider
            label="Detail"
            max={2}
            min={0}
            step={0.01}
            value={settings.detailScale}
            onChange={(detailScale) => setSettings((current) => ({ ...current, detailScale }))}
          />
          <Slider
            label="Glow"
            max={2}
            min={0}
            step={0.01}
            value={settings.glowScale}
            onChange={(glowScale) => setSettings((current) => ({ ...current, glowScale }))}
          />
        </div>

        <dl className="metric-grid workshop-readout">
          <Metric label="Bounce" value={formatPercent(bounce)} />
          <Metric label="Bob" value={formatPercent(bob)} />
          <Metric label="Sway" value={formatPercent(sway)} />
          <Metric label="Lean" value={formatPercent(lean)} />
          <Metric label="Jump" value={formatPercent(jump)} />
          <Metric label="Detail" value={formatPercent(detail)} />
          <Metric label="Glow" value={formatPercent(glow)} />
        </dl>

        <div className="workshop-presets">
          <div className="workshop-preset-form">
            <input
              aria-label="Workshop preset name"
              maxLength={48}
              placeholder="Preset name"
              type="text"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
            />
            <input
              aria-label="Workshop preset notes"
              maxLength={120}
              placeholder="Notes for this motion pass"
              type="text"
              value={presetNotes}
              onChange={(event) => setPresetNotes(event.target.value)}
            />
            <button type="button" onClick={handleSavePreset}>
              Save Preset
            </button>
          </div>

          <div className="workshop-preset-list">
            {presets.length === 0 ? (
              <p>No workshop presets saved yet.</p>
            ) : (
              presets.slice(0, 5).map((preset) => (
                <div key={preset.id} className="workshop-preset-row">
                  <div>
                    <strong>{preset.name}</strong>
                    {preset.notes ? <span>{preset.notes}</span> : null}
                  </div>
                  <button type="button" className="secondary" onClick={() => handleLoadPreset(preset)}>
                    Load
                  </button>
                  <button type="button" className="secondary" onClick={() => handleDeletePreset(preset.id)}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroWobbler({
  activity,
  bob,
  bounce,
  detail,
  expression,
  glow,
  jump,
  lean,
  sway,
  swayDirection,
}: {
  activity: number;
  bob: number;
  bounce: number;
  detail: number;
  expression: 'idle' | 'party' | 'hype' | 'jump';
  glow: number;
  jump: number;
  lean: number;
  sway: number;
  swayDirection: number;
}) {
  return (
    <div
      className="hero-wobbler-groove"
      style={
        {
          '--activity': activity,
          '--bob': bob,
          '--bounce': bounce,
          '--detail': detail,
          '--glow': glow,
          '--jump': jump,
          '--lean': lean,
          '--sway': sway,
          '--sway-side': swayDirection,
        } as CSSProperties
      }
    >
      <div className={`hero-wobbler expression-${expression}`}>
        <div className="hero-shadow" />
        <div className="hero-body">
          <div className="hero-cap">
            <span className="hero-cap-mark">W</span>
          </div>
          <div className="hero-brim" />
          <div className="hero-face">
            <div className="hero-glasses">
              <span />
              <span />
            </div>
            <div className="hero-mouth">
              <span />
            </div>
            <div className="hero-cheek left" />
            <div className="hero-cheek right" />
          </div>
          <div className="hero-bandana">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="hero-belt" />
          <div className="hero-arm hero-arm-left">
            <span className="hero-hand horns" />
          </div>
          <div className="hero-arm hero-arm-right">
            <span className="hero-mic" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BusProof({ frame }: { frame: VisualControlFrame | null }) {
  const bass = frame?.bassEnergy ?? 0;
  const impact = frame?.impact ?? 0;
  const high = frame?.highEnergy ?? 0;
  const energy = frame?.motionIntensity ?? 0;
  const brightness = frame?.brightness ?? 0;

  return (
    <div
      className="bus-proof"
      style={
        {
          '--bass': bass,
          '--impact': impact,
          '--high': high,
          '--energy': energy,
          '--brightness': brightness,
        } as CSSProperties
      }
    >
      <div className="stage-lights">
        <span />
        <span />
        <span />
      </div>
      <div className="stage-line" />
      <div className="wobble-row">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} className="wobble-figure" style={{ '--offset': index % 3 } as CSSProperties} />
        ))}
      </div>
      <div className="floor-pulse" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TuningControls({
  settings,
  setSettings,
}: {
  settings: TuningSettings;
  setSettings: Dispatch<SetStateAction<TuningSettings>>;
}) {
  return (
    <div className="tuning-list">
      <Slider
        label="Smoothing"
        max={0.95}
        min={0.05}
        step={0.01}
        value={settings.smoothing}
        onChange={(smoothing) => setSettings((current) => ({ ...current, smoothing }))}
      />
      <Slider
        label="Noise Floor"
        max={0.12}
        min={0}
        step={0.001}
        value={settings.noiseFloor}
        onChange={(noiseFloor) => setSettings((current) => ({ ...current, noiseFloor }))}
      />
      <Slider
        label="Onset Sensitivity"
        max={1}
        min={0.05}
        step={0.01}
        value={settings.onsetSensitivity}
        onChange={(onsetSensitivity) =>
          setSettings((current) => ({ ...current, onsetSensitivity }))
        }
      />
      <Slider
        label="Kick Sensitivity"
        max={1}
        min={0.05}
        step={0.01}
        value={settings.kickSensitivity}
        onChange={(kickSensitivity) => setSettings((current) => ({ ...current, kickSensitivity }))}
      />
      <Slider
        label="Cooldown"
        max={300}
        min={40}
        step={5}
        value={settings.eventCooldownMs}
        onChange={(eventCooldownMs) =>
          setSettings((current) => ({ ...current, eventCooldownMs }))
        }
      />
    </div>
  );
}

function Slider({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="slider-row">
      <span>
        {label}
        <strong>{value.toFixed(step < 1 ? 3 : 0)}</strong>
      </span>
      <input
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function formatFrame(frame: VisualControlFrame | null) {
  if (!frame) return 'Waiting for audio input...';

  return JSON.stringify(
    {
      time: Number(frame.time.toFixed(2)),
      masterEnergy: Number(frame.masterEnergy.toFixed(3)),
      bassEnergy: Number(frame.bassEnergy.toFixed(3)),
      lowMidEnergy: Number(frame.lowMidEnergy.toFixed(3)),
      midEnergy: Number(frame.midEnergy.toFixed(3)),
      highEnergy: Number(frame.highEnergy.toFixed(3)),
      brightness: Number(frame.brightness.toFixed(3)),
      impact: Number(frame.impact.toFixed(3)),
      onsetPulse: frame.onsetPulse,
      beatPulse: frame.beatPulse,
      kickPulse: frame.kickPulse,
      motionIntensity: Number(frame.motionIntensity.toFixed(3)),
      lightIntensity: Number(frame.lightIntensity.toFixed(3)),
      tempo: frame.tempo ? Number(frame.tempo.toFixed(1)) : null,
      tempoConfidence: Number(frame.tempoConfidence.toFixed(3)),
    },
    null,
    2,
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatTime(value: number) {
  const safeValue = Math.max(0, value);
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue - minutes * 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function formatCueLabel(label: CueLabel) {
  return cueLabels.find(([value]) => value === label)?.[1] ?? label;
}

function formatControlName(name: string) {
  return name.replace(/[A-Z]/g, (match) => ` ${match}`).replace(/^./, (match) => match.toUpperCase());
}

function loadStoredFingerprints() {
  try {
    const stored = localStorage.getItem(cueFingerprintStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as CueFingerprint[]) : [];
  } catch {
    return [];
  }
}

function loadStoredWorkshopSettings(): WobbleWorkshopSettings {
  try {
    const stored = localStorage.getItem(wobbleWorkshopSettingsStorageKey);
    if (!stored) return defaultWobbleWorkshopSettings;
    const parsed = JSON.parse(stored) as Partial<WobbleWorkshopSettings>;
    return {
      ...defaultWobbleWorkshopSettings,
      ...parsed,
    };
  } catch {
    return defaultWobbleWorkshopSettings;
  }
}

function loadStoredWorkshopPresets(): WobbleWorkshopPreset[] {
  try {
    const stored = localStorage.getItem(wobbleWorkshopPresetsStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as WobbleWorkshopPreset[]) : [];
  } catch {
    return [];
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
}

function getKeyboardSeekDelta(event: KeyboardEvent) {
  if (event.code === 'ArrowLeft') return event.shiftKey ? -1 : -5;
  if (event.code === 'ArrowRight') return event.shiftKey ? 1 : 5;
  if (event.key === ',') return -microSeekSeconds;
  if (event.key === '.') return microSeekSeconds;
  return null;
}

function seekAudioElement(audioElement: HTMLAudioElement, deltaSeconds: number) {
  const duration = Number.isFinite(audioElement.duration) ? audioElement.duration : Infinity;
  audioElement.currentTime = clamp(audioElement.currentTime + deltaSeconds, 0, duration);
}

function clampViewWindow(startRatio: number, endRatio: number): WaveformViewWindow {
  const size = clamp(endRatio - startRatio, 0.01, 1);
  let start = startRatio;
  let end = start + size;

  if (start < 0) {
    start = 0;
    end = size;
  }

  if (end > 1) {
    end = 1;
    start = 1 - size;
  }

  return {
    startRatio: clamp(start, 0, 1),
    endRatio: clamp(end, 0, 1),
  };
}

function formatDecimal(value: number) {
  return value.toFixed(2);
}

function formatBandName(band: CalibrationBand | undefined) {
  if (!band) return 'None';
  if (band === 'lowMid') return 'Low Mid';
  if (band === 'broadband') return 'Broadband';
  return band[0].toUpperCase() + band.slice(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default App;
