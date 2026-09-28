/**
 * MusicState: the stage's view of the song.
 *
 * Frames from the brain (~94/s) are folded into smoothed signals and events.
 * Beats are NOT taken from frame arrival: a local beat clock is extrapolated
 * every render frame and softly locked to the brain's beat phase, so beat
 * events fire exactly on time and moves can be scheduled ahead of the beat.
 */

import { approach, clamp } from './rng';

export interface Frame {
  t: number;
  silent: boolean;
  level: number;
  db: number;
  bands: number[];
  brightness: number;
  flux: number;
  onset: number;
  kick: number;
  snare: number;
  hat: number;
  bpm: number;
  beatConf: number;
  beatPhase: number;
  beat: number;
  barBeat: number;
  beatHit: boolean;
  energy: number;
  energyLong: number;
  build: number;
  drop: number;
  calm: number;
  density: number;
  section: number;
  vocal: number;
  vocalEnv: number;
  syllable: number;
  pitch: number;
  pitchHz: number;
  phrase: number;
}

export const Section = { Calm: 0, Groove: 1, Build: 2, Peak: 3 } as const;
export const SECTION_NAMES = ['calm', 'groove', 'build', 'peak'];

export type MusicEvent =
  | { type: 'beat'; beat: number; barBeat: number; strength: number }
  | { type: 'danceBeat'; beat: number; bar: number }
  | { type: 'kick' | 'snare' | 'hat' | 'syllable'; strength: number }
  | { type: 'drop'; strength: number }
  | { type: 'phraseStart' | 'phraseEnd' }
  | { type: 'section'; from: number; to: number }
  | { type: 'musicStart' | 'musicStop' };

type Listener = (e: MusicEvent) => void;

export class Music {
  // Smoothed signals, 0..1.
  level = 0;
  energy = 0;
  energyLong = 0;
  sub = 0;
  bass = 0;
  lowMid = 0;
  mid = 0;
  highMid = 0;
  high = 0;
  brightness = 0;
  flux = 0;
  vocal = 0;
  vocalEnv = 0;
  /** Slow floor of vocalEnv; the mouth rides on what rises above it. */
  vocalFloor = 0;
  /** Mouth opening, 0..1: pops open on each syllable and closes between. */
  mouth = 0;
  pitch = 0;
  build = 0;
  calm = 0;
  density = 0;
  section: number = Section.Groove;
  /** Envelope pulses (1 on hit, decaying). */
  kickPulse = 0;
  snarePulse = 0;
  hatPulse = 0;
  beatPulse = 0;
  dropPulse = 0;
  syllablePulse = 0;
  /** Time since the last drop, seconds. */
  sinceDrop = 1e9;
  /** Time in current vocal phrase (0 when not singing). */
  phraseTime = 0;
  inPhrase = false;
  /** 0..1 how much there is music playing at all (fades in/out). */
  presence = 0;
  silentFor = 1e9;

  bpm = 120;
  beatConf = 0;
  /** Continuous beat position (beat index + phase), extrapolated. */
  beatPos = 0;
  barBeat = 0;
  /** Dance tempo: bpm folded into a comfortable range, and its beat position. */
  danceMul = 1;
  danceBeatPos = 0;
  /** Composite "how hard should everyone dance" 0..1. */
  hype = 0;

  private listeners: Listener[] = [];
  private lastBeatFloor = -1;
  private lastDanceFloor = -1;
  private beatTarget = 0;
  private lastFrame: Frame | null = null;
  private barOffset = 0;
  private wasSilent = true;

  on(fn: Listener) {
    this.listeners.push(fn);
  }

  private emit(e: MusicEvent) {
    for (const l of this.listeners) l(e);
  }

  get beatPhase() {
    return this.beatPos - Math.floor(this.beatPos);
  }
  get dancePhase() {
    return this.danceBeatPos - Math.floor(this.danceBeatPos);
  }
  /** Position in the 4-beat bar, 0..4. */
  get barPos() {
    return ((((Math.floor(this.beatPos) - this.barOffset) % 4) + 4) % 4) + this.beatPhase;
  }
  get danceBpm() {
    return this.bpm * this.danceMul;
  }
  get playing() {
    return this.presence > 0.5;
  }

  ingest(f: Frame) {
    this.lastFrame = f;
    const target = f.beat + f.beatPhase;
    this.beatTarget = target;
    if (Math.abs(target - this.beatPos) > 1.5) {
      // Big disagreement (startup, seek): snap.
      this.beatPos = target;
      this.lastBeatFloor = Math.floor(target);
    }
    this.barOffset = (((f.beat - f.barBeat) % 4) + 4) % 4;
    if (f.bpm > 0) {
      this.bpm = f.bpm;
      // Fold into ~82..142 with hysteresis on the multiplier.
      const want = f.bpm >= 145 ? 0.5 : f.bpm < 80 ? 2 : 1;
      if (want !== this.danceMul) {
        const edge = this.danceMul === 0.5 ? f.bpm < 138 : this.danceMul === 2 ? f.bpm > 86 : true;
        if (edge) {
          this.danceMul = want;
          this.danceBeatPos = this.beatPos * want;
          this.lastDanceFloor = Math.floor(this.danceBeatPos);
        }
      }
    }
    this.beatConf = f.beatConf;
    if (f.kick > 0) {
      this.kickPulse = Math.max(this.kickPulse, 0.5 + 0.5 * f.kick);
      this.emit({ type: 'kick', strength: f.kick });
    }
    if (f.snare > 0) {
      this.snarePulse = Math.max(this.snarePulse, 0.5 + 0.5 * f.snare);
      this.emit({ type: 'snare', strength: f.snare });
    }
    if (f.hat > 0) {
      this.hatPulse = Math.max(this.hatPulse, 0.4 + 0.6 * f.hat);
      this.emit({ type: 'hat', strength: f.hat });
    }
    if (f.syllable > 0 && f.vocal > 0.45) {
      this.syllablePulse = Math.max(this.syllablePulse, 0.6 + 0.4 * clamp(f.syllable * 1.5));
      this.emit({ type: 'syllable', strength: f.syllable });
    }
    if (f.drop > 0) {
      this.dropPulse = 1;
      this.sinceDrop = 0;
      this.emit({ type: 'drop', strength: f.drop });
    }
    if (f.phrase === 1) {
      this.inPhrase = true;
      this.phraseTime = 0;
      this.emit({ type: 'phraseStart' });
    } else if (f.phrase === 2) {
      this.inPhrase = false;
      this.emit({ type: 'phraseEnd' });
    }
    if (f.section !== this.section) {
      const from = this.section;
      this.section = f.section;
      this.emit({ type: 'section', from, to: f.section });
    }
    if (f.silent !== this.wasSilent) {
      this.wasSilent = f.silent;
      this.emit({ type: f.silent ? 'musicStop' : 'musicStart' });
    }
  }

  /** Advance by dt seconds of render time. */
  update(dt: number) {
    const f = this.lastFrame;
    if (f) {
      const r = (rate: number) => 1 - Math.exp(-rate * dt);
      this.level += (f.level - this.level) * r(20);
      this.energy += (f.energy - this.energy) * r(10);
      this.energyLong += (f.energyLong - this.energyLong) * r(4);
      const [sub, bass, lowMid, mid, highMid, high] = f.bands;
      this.sub += (sub - this.sub) * r(18);
      this.bass += (bass - this.bass) * r(18);
      this.lowMid += (lowMid - this.lowMid) * r(14);
      this.mid += (mid - this.mid) * r(14);
      this.highMid += (highMid - this.highMid) * r(14);
      this.high += (high - this.high) * r(14);
      this.brightness += (f.brightness - this.brightness) * r(6);
      this.flux += (f.flux - this.flux) * r(25);
      this.vocal += (f.vocal - this.vocal) * r(12);
      this.vocalEnv += (f.vocalEnv - this.vocalEnv) * r(30);
      this.vocalFloor += (this.vocalEnv - this.vocalFloor) * r(this.vocalEnv < this.vocalFloor ? 8 : 1.5);
      this.pitch += (f.pitch - this.pitch) * r(8);
      this.build += (f.build - this.build) * r(4);
      this.calm += (f.calm - this.calm) * r(3);
      this.density += (f.density - this.density) * r(3);
      const playingNow = f.silent ? 0 : 1;
      this.presence = approach(this.presence, playingNow, playingNow ? 3 : 0.8, dt);
      this.silentFor = f.silent ? this.silentFor + dt : 0;
    }

    // Beat clock: advance at tempo, then pull gently toward the brain.
    const bps = this.bpm / 60;
    this.beatTarget += bps * dt;
    this.beatPos += bps * dt;
    let err = this.beatTarget - this.beatPos;
    if (err > 0.5) err -= 1;
    if (err < -0.5) err += 1;
    // Never let the pull move the clock backwards across a beat.
    this.beatPos += clamp(err * (1 - Math.exp(-6 * dt)), -0.5 * bps * dt, 2 * bps * dt);
    const floor = Math.floor(this.beatPos);
    if (floor !== this.lastBeatFloor) {
      if (floor > this.lastBeatFloor && this.presence > 0.3) {
        const barBeat = ((((floor - this.barOffset) % 4) + 4) % 4);
        this.barBeat = barBeat;
        this.beatPulse = 1;
        this.emit({ type: 'beat', beat: floor, barBeat, strength: this.beatConf });
      }
      this.lastBeatFloor = floor;
    }
    this.danceBeatPos = this.beatPos * this.danceMul;
    const dfloor = Math.floor(this.danceBeatPos);
    if (dfloor !== this.lastDanceFloor) {
      if (dfloor > this.lastDanceFloor && this.presence > 0.3) {
        this.emit({ type: 'danceBeat', beat: dfloor, bar: Math.floor(dfloor / 4) });
      }
      this.lastDanceFloor = dfloor;
    }

    // Pulses decay.
    const decay = (v: number, rate: number) => v * Math.exp(-rate * dt);
    this.kickPulse = decay(this.kickPulse, 9);
    this.snarePulse = decay(this.snarePulse, 8);
    this.hatPulse = decay(this.hatPulse, 14);
    this.beatPulse = decay(this.beatPulse, 6);
    this.dropPulse = decay(this.dropPulse, 0.7);
    this.syllablePulse = decay(this.syllablePulse, 12);
    this.sinceDrop += dt;
    if (this.inPhrase) this.phraseTime += dt;

    // vocalEnv sits high through a whole sung phrase, so it cannot drive the
    // mouth directly: syllable pops open it, the rise over the floor holds notes.
    const rise = clamp((this.vocalEnv - this.vocalFloor) / 0.15);
    const gate = clamp((this.vocal - 0.35) / 0.3);
    this.mouth = gate * clamp(0.06 + 0.3 * rise * rise + 0.9 * this.syllablePulse);
    const conf = clamp(this.beatConf * 1.6);
    const target = clamp(
      (0.25 + 0.75 * this.energy) * (0.35 + 0.65 * conf) * this.presence +
        this.dropPulse * 0.4 +
        (this.section === Section.Peak ? 0.15 : 0) -
        this.calm * 0.25,
    );
    this.hype = approach(this.hype, target, 2.5, dt);
  }
}
