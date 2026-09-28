/**
 * Choreography. A Dancer turns the music into forces on its wobbler's rig,
 * arm targets and facial expression. Timing is on the stage's predictive
 * dance-beat clock, so bounces land on the beat instead of after it.
 *
 * Layers (all additive):
 *   groove   bob/squash + hops on the beat, nods, snare pops, kick squash
 *   sway     side-to-side lean; reshaped by vocal phrases and pitch
 *   shimmy   upper-body twist on busy hi-hats
 *   build    shake, rise, arms climb
 *   drop     staggered big jumps, spins, star eyes, "woo"
 *   swirl    the signature move: the lean sweeps a full circle on the bar
 *            while the face keeps looking ahead (a weeble going round)
 *   arms     a routine chosen every two bars by section + personality
 *   idle     breathing, glances and fidgets when the music stops
 */

import { Section, type Music, type MusicEvent } from '../music';
import { clamp, Rng, smoothstep } from '../rng';
import type { Personality } from './look';
import { Rig } from './rig';
import type { Arm, Wobbler } from './wobbler';

export type ArmRoutine =
  | 'rest'
  | 'swing'
  | 'pump'
  | 'clap'
  | 'wave'
  | 'roof'
  | 'point'
  | 'disco'
  | 'handsUp'
  | 'sing'
  | 'raise'
  | 'shake';

export interface DanceContext {
  music: Music;
  time: number;
  /** Yaw that faces the stage/DJ from this wobbler. */
  stageYaw: number;
  /** Yaw that faces the camera (for heroes in close-ups), or null. */
  cameraYaw: number | null;
}

export class Dancer {
  readonly p: Personality;
  protected rng: Rng;
  routine: ArmRoutine = 'rest';
  protected side: 1 | -1 = 1;
  protected swayOffset = 0;
  protected swayGain = 1;
  protected pending: { at: number; kind: 'jump' | 'spin' | 'hop'; v: number }[] = [];
  protected starUntil = 0;
  protected happyUntil = 0;
  protected wooUntil = 0;
  protected closedSinging = false;
  protected glanceUntil = 0;
  protected glance = 0;
  protected armPop = [0, 0];
  protected lastPhase = 0;
  protected nextIdle = 0;
  protected hopEveryBeat = false;
  protected hoppedBeat = -1;
  /** Active swirl, in (lagged) dance beats. */
  protected swirl: { start: number; loops: number; dir: 1 | -1; amp: number } | null = null;
  protected swirlEnv = 0;
  /** Seconds the camera wants this one to look at it. */
  lookAtCamera = 0;
  /** Belt/emblem glow scale (0 in light themes, where glow reads as smudges). */
  glowScale = 1;

  constructor(
    public w: Wobbler,
    seed: number,
  ) {
    this.p = w.look.personality;
    this.rng = new Rng(seed * 31 + 7);
    this.side = this.rng.chance(0.5) ? 1 : -1;
    this.swayOffset = this.rng.range(-0.08, 0.08);
  }

  /** Schedule a jump `delay` seconds from now. */
  jump(time: number, delay: number, airtime: number) {
    this.pending.push({ at: time + delay, kind: 'jump', v: Rig.hopSpeed(airtime) });
  }

  /**
   * Start the swirl on a beat `delayBeats` from the next one. One loop per bar,
   * so each beat lands on a quarter of the circle. No-op if already swirling.
   */
  startSwirl(music: Music, delayBeats = 0, loops = 2, dir: 1 | -1 = this.rng.chance(0.5) ? 1 : -1) {
    if (this.swirl || music.presence < 0.5) return;
    const start = Math.ceil(music.danceBeatPos - this.p.lag) + delayBeats;
    this.swirl = { start, loops, dir, amp: (0.17 + 0.1 * this.p.showoff) * (0.8 + 0.4 * this.p.sway) };
  }

  onEvent(e: MusicEvent, ctx: DanceContext) {
    const { music, time } = ctx;
    const rig = this.w.rig;
    const h = music.hype * this.p.energy;
    switch (e.type) {
      case 'danceBeat': {
        if (e.beat % 8 === 0) {
          this.chooseRoutine(music);
          const hot = music.section === Section.Peak || music.section === Section.Groove;
          if (hot && this.rng.chance(0.03 + 0.1 * this.p.showoff * clamp(h))) this.startSwirl(music, 0, this.rng.chance(0.5) ? 1 : 2);
        }
        // Nod: a forward kick; the weeble springs back by itself.
        rig.kick(-(0.5 + 0.9 * h) * (0.5 + this.p.bounce) * this.w.look.scale, 0);
        this.hopEveryBeat = h * this.p.jumpy > 0.5 || (music.section === Section.Build && music.build > 0.75);
        break;
      }
      case 'beat': {
        // Backbeat accent: alternate side kicks on 2 and 4.
        if (e.barBeat % 2 === 1) rig.kick(0, (e.barBeat === 1 ? 1 : -1) * 0.5 * h * this.p.sway);
        break;
      }
      case 'kick':
        rig.squashKick(-0.9 * e.strength * (0.4 + this.p.bounce) * (0.3 + h));
        break;
      case 'snare':
        this.armPop[this.rng.int(2)] = Math.max(0.35, e.strength) * this.p.arms * (0.4 + h);
        break;
      case 'hat':
        if (this.p.shimmy > 0.6 && music.hype > 0.5) rig.kick(this.rng.range(-0.3, 0.3), this.rng.range(-0.3, 0.3));
        break;
      case 'drop': {
        const delay = this.rng.range(0, 0.18);
        this.jump(time, delay, 0.42 + 0.25 * this.p.jumpy);
        if (this.rng.chance(0.25 + 0.5 * this.p.jumpy)) this.pending.push({ at: time + delay + 0.05, kind: 'spin', v: this.rng.chance(0.5) ? 1 : -1 });
        this.routine = this.rng.chance(0.6) ? 'handsUp' : 'wave';
        if (this.rng.chance(0.35 + 0.4 * this.p.showoff)) this.starUntil = time + (4 * 60) / music.danceBpm;
        this.wooUntil = time + 0.7;
        // Once the landing settles, show off.
        if (this.rng.chance(0.2 + 0.4 * this.p.showoff)) this.startSwirl(music, 3);
        break;
      }
      case 'phraseStart':
        // Lean in and restart the sway with the singer.
        rig.kick(-0.9 * this.p.singer, 0);
        this.swayOffset = (music.danceBeatPos / 8) % 1;
        this.swayGain = 1.4;
        this.closedSinging = music.calm > 0.3 && this.rng.chance(this.p.singer * 0.6);
        if (music.vocal > 0.5 && this.rng.chance(this.p.singer * 0.5)) this.routine = 'sing';
        break;
      case 'phraseEnd':
        // Release: settle back with a little bounce.
        rig.squashKick(1.2 * this.p.singer);
        rig.kick(0.5, this.rng.range(-0.4, 0.4));
        this.swayGain = 0.8;
        this.closedSinging = false;
        if (this.rng.chance(0.3)) this.happyUntil = time + 0.9;
        break;
      case 'section':
        this.chooseRoutine(music);
        break;
    }
  }

  protected chooseRoutine(music: Music) {
    const p = this.p;
    const v = music.vocal;
    const opts: [ArmRoutine, number][] =
      music.presence < 0.3
        ? [['rest', 1]]
        : music.section === Section.Calm
          ? [
              ['rest', 2],
              ['swing', 3],
              ['sing', 3 * p.singer * v],
              ['wave', 0.6],
            ]
          : music.section === Section.Build
            ? [
                ['raise', 5],
                ['clap', 2 * p.arms],
                ['shake', 1.5 * p.shimmy],
              ]
            : music.section === Section.Peak
              ? [
                  ['handsUp', 3],
                  ['wave', 3],
                  ['pump', 3 * p.arms],
                  ['roof', 2],
                  ['disco', 1.2 * p.showoff * 3],
                ]
              : [
                  ['swing', 2],
                  ['pump', 2 * p.arms],
                  ['clap', 1.4],
                  ['point', 1],
                  ['disco', p.showoff * 3],
                  ['rest', 1.2],
                  ['sing', 2 * p.singer * v],
                  ['shake', p.shimmy],
                ];
    this.routine = this.rng.weighted(opts);
    this.side = this.rng.chance(0.5) ? 1 : -1;
  }

  update(dt: number, ctx: DanceContext) {
    const { music, time } = ctx;
    const w = this.w;
    const rig = w.rig;
    const p = this.p;
    const pres = music.presence;
    const h = clamp(music.hype * p.energy, 0, 1.3);
    const beatDur = 60 / Math.max(40, music.danceBpm);
    const beats = music.danceBeatPos - p.lag;
    const ph = ((beats % 1) + 1) % 1;

    // Scheduled actions.
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const a = this.pending[i];
      if (a.at <= time) {
        if (a.kind === 'jump' || a.kind === 'hop') rig.hop(a.v);
        else if (a.kind === 'spin') {
          rig.yaw.target += Math.PI * 2 * a.v;
          rig.yaw.v += 9 * a.v;
          rig.stretchForce(40);
        }
        this.pending.splice(i, 1);
      }
    }

    // ---- groove: bob/squash shaped to the beat, with a lead for spring lag
    const lead = 0.06;
    const q = (ph + lead) % 1;
    const land = Math.exp(-q * 7) + 0.5 * Math.exp(-(1 - q) * 16);
    const A = (0.03 + 0.09 * h * p.bounce) * pres;
    const build = music.section === Section.Build ? music.build : music.build * 0.5;
    const breathe = 0.018 * Math.sin(time * 1.7 + p.lag * 40) * (1 - pres);
    rig.stretch.target = 1 - A * land + A * 0.4 + 0.12 * build * pres + 0.1 * music.pitch * music.vocal * p.singer + breathe - 0.04 * music.calm;

    // Hops that land on the beat. Height scales with hype via the airtime;
    // the take-off speed is solved from the time actually left until the
    // beat, so landings are exact regardless of frame timing.
    const air = Math.min(0.3, 0.42 * beatDur) * (0.6 + 0.4 * clamp(h));
    const takeoff = 1 - air / beatDur;
    const beatIdx = Math.floor(beats);
    if (pres > 0.5 && this.swirlEnv < 0.3 && this.lastPhase < takeoff && ph >= takeoff && !rig.airborne && this.hoppedBeat !== beatIdx) {
      const every = this.hopEveryBeat || (h * p.bounce > 0.75 && music.section === Section.Peak);
      const onDown = (beatIdx + 1) % 2 === 0 && h * p.jumpy > 0.35;
      if (every || onDown) {
        rig.hop(Rig.hopSpeed((1 - ph) * beatDur));
        this.hoppedBeat = beatIdx;
      }
    }
    this.lastPhase = ph;

    // ---- sway (bar-long cycle; vocals make it bigger and lean in)
    this.swayGain += (1 - this.swayGain) * (1 - Math.exp(-dt * 0.8));
    const swayCycle = music.section === Section.Calm ? 8 : 4;
    const sw = Math.sin(2 * Math.PI * (beats / swayCycle - this.swayOffset));
    const swayAmp = (0.035 + 0.08 * p.sway) * (0.5 + 0.8 * music.calm + 0.5 * music.vocal * p.singer) * this.swayGain * pres;
    rig.tiltZ.target = sw * swayAmp;
    rig.tiltX.target = -0.07 * music.vocal * p.singer * pres + 0.08 * music.pitch * music.vocal * p.singer;

    // ---- swirl: tilt targets go round a circle, one loop per bar. Yaw is
    // untouched, so the face stays put while the bottom rolls round under it.
    this.swirlEnv = 0;
    const sw8 = this.swirl;
    if (sw8) {
      // Small lead for the tilt spring's lag, like the groove.
      const u = (beats + 0.08 - sw8.start) / 4;
      if (u >= sw8.loops || pres < 0.3) this.swirl = null;
      else if (u > 0) {
        this.swirlEnv = smoothstep(0, 0.3, u) * smoothstep(sw8.loops, sw8.loops - 0.3, u) * pres;
        const a = 2 * Math.PI * u * sw8.dir;
        const r = sw8.amp * this.swirlEnv;
        rig.tiltX.target += r * Math.cos(a);
        rig.tiltZ.target = rig.tiltZ.target * (1 - this.swirlEnv) + r * Math.sin(a);
      }
    }

    // ---- shimmy
    const shim = p.shimmy * clamp(music.high * 1.2 + music.density - 0.6) * h;
    rig.twist.target = 0.3 * shim * Math.sin(2 * Math.PI * beats * 2);

    // ---- build shake
    if (build > 0.2 && pres > 0.5) {
      const s = build * build * 26 * (0.5 + p.energy * 0.5);
      rig.torque(this.rng.range(-s, s), this.rng.range(-s, s));
    }

    // ---- facing
    this.glanceUntil -= dt;
    if (this.glanceUntil < 0 && this.rng.chance(dt * 0.08)) {
      this.glance = this.rng.range(-0.6, 0.6);
      this.glanceUntil = this.rng.range(0.6, 1.6);
    }
    const glance = this.glanceUntil > 0 ? this.glance : 0;
    this.lookAtCamera -= dt;
    const faceYaw = this.lookAtCamera > 0 && ctx.cameraYaw !== null ? ctx.cameraYaw : ctx.stageYaw + glance * 0.6;
    const turns = Math.round((rig.yaw.target - faceYaw) / (Math.PI * 2));
    const want = faceYaw + turns * Math.PI * 2;
    if (Math.abs(rig.yaw.target - want) > 0.02 && Math.abs(rig.yaw.x - rig.yaw.target) < 0.5) rig.yaw.target = want;

    // ---- idle fidgets during silence
    if (pres < 0.3) {
      this.nextIdle -= dt;
      if (this.nextIdle <= 0) {
        this.nextIdle = this.rng.range(2, 7);
        const r = this.rng.next();
        if (r < 0.3) rig.kick(this.rng.range(-0.6, 0.6), this.rng.range(-0.6, 0.6));
        else if (r < 0.4) rig.hop(1.2);
        else {
          this.glance = this.rng.range(-1, 1);
          this.glanceUntil = this.rng.range(1, 2.5);
        }
      }
    }

    this.arms(dt, ctx, beats, ph);
    this.face(ctx, h);
  }

  protected arms(dt: number, ctx: DanceContext, beats: number, ph: number) {
    const { music } = ctx;
    const [L, R] = this.w.arms;
    const s = this.side;
    const main = s > 0 ? R : L;
    const other = s > 0 ? L : R;
    const punch = Math.exp(-ph * 8);
    const rest = (a: Arm, k = 1) => a.target({ raise: 0.5 + 0.06 * k, fwd: 0.08, inward: 0, elbow: 0.45 });
    const pres = music.presence;
    switch (pres < 0.3 ? 'rest' : this.routine) {
      case 'rest':
        rest(L);
        rest(R);
        break;
      case 'swing': {
        const sw = Math.sin(Math.PI * beats);
        L.target({ raise: 0.55, fwd: 0.55 * sw, inward: 0, elbow: 0.7 });
        R.target({ raise: 0.55, fwd: -0.55 * sw, inward: 0, elbow: 0.7 });
        break;
      }
      case 'pump':
        main.target({ raise: 2.25 + 0.3 * punch, fwd: 0.35, inward: 0.1, elbow: 1.35 - 1.15 * punch });
        rest(other);
        break;
      case 'clap': {
        const c = Math.exp(-((ph + 0.9) % 1) * 9);
        for (const a of [L, R]) a.target({ raise: 0.7, fwd: 1.15, inward: 0.35 + 0.75 * c, elbow: 0.55 });
        break;
      }
      case 'wave': {
        const sw = Math.sin((Math.PI * beats) / 2);
        L.target({ raise: 2.55 - 0.35 * sw, fwd: 0.25, inward: 0, elbow: 0.25 });
        R.target({ raise: 2.55 + 0.35 * sw, fwd: 0.25, inward: 0, elbow: 0.25 });
        break;
      }
      case 'roof':
        for (const a of [L, R]) a.target({ raise: 2.2, fwd: 0.2, inward: 0.1, elbow: 1.45 - 1.2 * punch });
        break;
      case 'point':
        main.target({ raise: 1.75 + 0.25 * punch, fwd: 1.0, inward: 0.25, elbow: 0.05 });
        rest(other, 1);
        break;
      case 'disco': {
        const up = Math.floor(beats) % 2 === 0;
        main.target(up ? { raise: 2.6, fwd: 0.35, inward: 0, elbow: 0.05 } : { raise: 0.35, fwd: 0.7, inward: 0.9, elbow: 0.15 });
        rest(other);
        break;
      }
      case 'handsUp': {
        const wig = 0.1 * Math.sin(ctx.time * 11);
        L.target({ raise: 2.75 + wig, fwd: 0.15, inward: 0, elbow: 0.15 });
        R.target({ raise: 2.75 - wig, fwd: 0.15, inward: 0, elbow: 0.15 });
        break;
      }
      case 'sing':
        // Mic hand to the mouth, the other hand emotes with the pitch.
        main.target({ raise: 0.3, fwd: 1.45, inward: 1.05, elbow: 1.95 });
        other.target({ raise: 0.8 + 1.2 * clamp(music.pitch + 0.3) * music.vocal, fwd: 0.6, inward: 0, elbow: 0.25 });
        break;
      case 'raise': {
        const b = smoothstep(0, 1, music.build);
        const shake = 0.15 * b * Math.sin(ctx.time * 20);
        L.target({ raise: 0.5 + 2.2 * b + shake, fwd: 0.3, inward: 0, elbow: 0.3 });
        R.target({ raise: 0.5 + 2.2 * b - shake, fwd: 0.3, inward: 0, elbow: 0.3 });
        break;
      }
      case 'shake': {
        const sh = Math.sin(2 * Math.PI * beats * 2);
        L.target({ raise: 1.0, fwd: 0.45 * sh, inward: 0.2, elbow: 0.6 });
        R.target({ raise: 1.0, fwd: -0.45 * sh, inward: 0.2, elbow: 0.6 });
        break;
      }
    }
    // Snare pops ride on top of any routine.
    for (let i = 0; i < 2; i++) {
      const a = this.w.arms[i];
      a.add.raise += this.armPop[i] * 0.5;
      a.add.elbow -= this.armPop[i] * 0.3;
      this.armPop[i] *= Math.exp(-dt * 12);
    }
  }

  protected face(ctx: DanceContext, h: number) {
    const { music, time } = ctx;
    const e = this.w.expr;
    const p = this.p;
    const singing = music.vocal * (0.25 + 0.75 * p.singer);
    const woo = time < this.wooUntil ? 0.85 : 0;
    e.mouth = Math.max(woo, clamp(music.mouth * singing * 1.1));
    e.smile = 0.5 + 0.35 * clamp(h);
    e.star = time < this.starUntil;
    e.happy = !e.star && (time < this.happyUntil || this.swirlEnv > 0.5 || (music.section === Section.Peak && h > 0.9 && Math.sin(time * 0.7 + p.lag * 50) > 0.6));
    e.closed = this.closedSinging && music.vocal > 0.4;
    e.blush = 0.45 + 0.4 * clamp(h);
    e.lookX = this.glanceUntil > 0 ? this.glance : 0;
    e.lookY = 0.3 * music.pitch * music.vocal;
    e.glowBelt = (0.25 * music.hype + 1.1 * music.kickPulse * music.presence) * this.glowScale;
    e.glowEmblem = (0.2 * music.hype + 0.7 * music.snarePulse * music.presence) * this.glowScale;
  }
}
