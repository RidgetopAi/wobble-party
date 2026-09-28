/**
 * Camera director: a library of shots, cut or blended on musical boundaries.
 * Each shot is a function of time-in-shot returning eye + target; the
 * director adds handheld drift, beat breathing, drop shake and FOV punch.
 */

import * as THREE from 'three';
import { Section, type Music } from '../music';
import { Rng, clamp, easeInOut } from '../rng';
import type { Crowd } from '../crowd';
import { STAGE_Y, DJ_Z } from '../world/venue';

export type ShotKind = 'wide' | 'djClose' | 'djReverse' | 'crowdDolly' | 'heroClose' | 'crane' | 'overhead' | 'orbit' | 'stageSide';

interface Shot {
  kind: ShotKind;
  t: number;
  dur: number;
  seed: number;
  /** Hero index for close-ups. */
  hero: number;
  eye: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const DJ_HEAD = new THREE.Vector3(0, STAGE_Y + 1.25, DJ_Z);

/**
 * Shots are composed for 16:9. In a narrower window (a tiled half-screen or
 * portrait tile in Hyprland) widen the vertical FOV so the horizontal
 * coverage stays the same instead of cropping the stage.
 */
function fitFov(vfov: number, aspect: number) {
  const design = 16 / 9;
  if (aspect >= design) return vfov;
  const h = Math.tan(THREE.MathUtils.degToRad(vfov) / 2) * design;
  return Math.min(100, THREE.MathUtils.radToDeg(2 * Math.atan(h / aspect)));
}

export class CameraDirector {
  readonly camera: THREE.PerspectiveCamera;
  current: Shot;
  private prev: Shot | null = null;
  private blend = 1;
  private blendDur = 0;
  private rng = new Rng(77);
  private shake = 0;
  private fovPunch = 0;
  private barsInShot = 0;
  private recent: ShotKind[] = [];
  /** Manual override (keyboard) — sticks until cleared. */
  locked: ShotKind | null = null;
  private tmpE = new THREE.Vector3();
  private tmpT = new THREE.Vector3();

  constructor(
    aspect: number,
    private crowd: Crowd,
  ) {
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
    this.current = this.makeShot('wide', 16);
    this.evaluate(this.current);
  }

  private makeShot(kind: ShotKind, dur: number): Shot {
    return {
      kind,
      t: 0,
      dur,
      seed: this.rng.next(),
      hero: this.rng.int(this.crowd.heroes.length),
      eye: new THREE.Vector3(),
      target: new THREE.Vector3(),
      fov: 42,
    };
  }

  /** Switch shot; `blend` seconds (0 = hard cut). */
  go(kind: ShotKind, dur: number, blend: number) {
    this.prev = blend > 0 ? { ...this.current, eye: this.current.eye.clone(), target: this.current.target.clone() } : null;
    this.current = this.makeShot(kind, dur);
    this.blend = blend > 0 ? 0 : 1;
    this.blendDur = blend;
    this.barsInShot = 0;
    this.recent.push(kind);
    if (this.recent.length > 4) this.recent.shift();
    if (kind === 'heroClose') this.crowd.heroes[this.current.hero].lookAtCamera = dur;
  }

  /** Called on every bar (downbeat). Decides whether to cut. */
  onBar(music: Music) {
    if (this.locked) return;
    this.barsInShot++;
    const sec = music.section;
    const length = !music.playing ? 8 : sec === Section.Calm ? 8 : sec === Section.Build ? 4 : sec === Section.Peak ? 2 : 4;
    if (this.barsInShot < length) return;
    const beatDur = 60 / music.bpm;
    const opts: [ShotKind, number][] = !music.playing
      ? [
          ['orbit', 3],
          ['wide', 2],
          ['crowdDolly', 1],
        ]
      : sec === Section.Calm
        ? [
            ['orbit', 2],
            ['djClose', 2],
            ['heroClose', 3 * music.vocal],
            ['wide', 2],
            ['crowdDolly', 2],
          ]
        : sec === Section.Build
          ? [
              ['djClose', 3],
              ['stageSide', 2],
              ['crowdDolly', 2],
              ['wide', 1],
            ]
          : sec === Section.Peak
            ? [
                ['overhead', 2],
                ['crowdDolly', 3],
                ['djReverse', 2],
                ['wide', 2],
                ['heroClose', 1.5],
                ['orbit', 1],
              ]
            : [
                ['crowdDolly', 3],
                ['djClose', 2],
                ['djReverse', 1.5],
                ['heroClose', 2 * (0.3 + music.vocal)],
                ['wide', 2],
                ['stageSide', 1.5],
                ['orbit', 1.2],
              ];
    const filtered = opts.filter(([k]) => !this.recent.slice(-2).includes(k));
    const kind = this.rng.weighted(filtered.length ? filtered : opts);
    const blend = !music.playing || sec === Section.Calm ? 2.5 : sec === Section.Build ? 1.2 : 0;
    this.go(kind, length * 4 * beatDur + 2, blend);
  }

  onDrop() {
    if (this.locked) return;
    this.go(this.rng.chance(0.5) ? 'crane' : 'overhead', 10, 0);
    this.shake = 1;
    this.fovPunch = 1;
  }

  onPhraseStart(music: Music) {
    if (this.locked || !music.playing) return;
    if (this.barsInShot >= 2 && this.rng.chance(0.35)) this.go(this.rng.chance(0.6) ? 'heroClose' : 'djClose', 8, music.section === Section.Calm ? 1.5 : 0);
  }

  private evaluate(s: Shot) {
    const t = s.t;
    const u = clamp(t / Math.max(1, s.dur));
    const sd = s.seed;
    const e = s.eye;
    const g = s.target;
    s.fov = 42;
    switch (s.kind) {
      case 'wide': {
        const side = (sd - 0.5) * 8;
        e.set(side * (1 - u * 0.5), 6.2 - u * 0.8, 19 - u * 3);
        g.set(side * 0.2, 2.4, -3);
        s.fov = 40;
        break;
      }
      case 'djClose': {
        const a = (sd - 0.5) * 0.9 + Math.sin(t * 0.15) * 0.25;
        const r = 4.4 - u * 0.9;
        e.set(Math.sin(a) * r, STAGE_Y + 1.35 + 0.2 * Math.sin(t * 0.2), DJ_Z + Math.cos(a) * r);
        g.copy(DJ_HEAD).add(this.tmpT.set(0, -0.15, 0));
        s.fov = 34;
        break;
      }
      case 'djReverse': {
        const sx = sd > 0.5 ? 1 : -1;
        e.set(sx * (1.3 + 0.3 * u), STAGE_Y + 2.4, DJ_Z - 2.2);
        g.set(sx * -1.5, 0.9, 5);
        s.fov = 48;
        break;
      }
      case 'crowdDolly': {
        const dir = sd > 0.5 ? 1 : -1;
        const x = dir * (-6 + 12 * u);
        e.set(x, 1.25, -2.2);
        g.set(x * 0.7 + dir * 1.5, 0.75, 4);
        s.fov = 46;
        break;
      }
      case 'heroClose': {
        const hero = this.crowd.heroes[s.hero].w;
        const hp = hero.root.position;
        const yaw = hero.rig.yaw.x;
        const d = 2.3 - u * 0.35;
        const side = (sd - 0.5) * 0.9;
        e.set(hp.x + Math.sin(yaw + side) * d, hp.y + 0.35, hp.z + Math.cos(yaw + side) * d);
        g.set(hp.x, hp.y + 0.1, hp.z);
        s.fov = 36;
        break;
      }
      case 'crane': {
        const k = easeInOut(clamp(t / 6));
        e.set(Math.sin(t * 0.2) * 2, 1.2 + k * 9, -1.5 + k * 11);
        g.set(0, 0.5, 2 - k * 2);
        s.fov = 50;
        break;
      }
      case 'overhead': {
        const a = t * 0.12 + sd * 6;
        e.set(Math.sin(a) * 3, 13.5, 6 + Math.cos(a) * 3);
        g.set(0, 0, 4.5);
        s.fov = 52;
        break;
      }
      case 'orbit': {
        const a = (sd - 0.5) * 2 + t * 0.07 * (sd > 0.5 ? 1 : -1);
        e.set(Math.sin(a) * 11, 4.2, 5 + Math.cos(a) * 11);
        g.set(0, 1.2, 1);
        s.fov = 44;
        break;
      }
      case 'stageSide': {
        const sx = sd > 0.5 ? 1 : -1;
        e.set(sx * (8.5 - u), STAGE_Y + 2.2, -4.8 + u * 0.6);
        g.set(-sx * 1, 1.6, -1.5);
        s.fov = 44;
        break;
      }
    }
  }

  update(dt: number, music: Music, time: number) {
    this.current.t += dt;
    this.evaluate(this.current);
    const eye = this.tmpE.copy(this.current.eye);
    const target = this.tmpT.copy(this.current.target);
    let fov = this.current.fov;
    if (this.prev && this.blend < 1) {
      this.prev.t += dt;
      this.evaluate(this.prev);
      this.blend = Math.min(1, this.blend + dt / this.blendDur);
      const k = easeInOut(this.blend);
      eye.lerpVectors(this.prev.eye, this.current.eye, k);
      target.lerpVectors(this.prev.target, this.current.target, k);
      fov = this.prev.fov + (this.current.fov - this.prev.fov) * k;
    }
    // Handheld drift + breathing on the beat.
    const drift = 0.06;
    eye.x += Math.sin(time * 0.53) * drift + Math.sin(time * 1.31) * drift * 0.4;
    eye.y += Math.sin(time * 0.71) * drift * 0.6 + music.kickPulse * 0.03 * music.hype;
    // Shake decays; peaks keep a little.
    this.shake = Math.max(this.shake * Math.exp(-dt * 2.5), music.section === Section.Peak ? 0.12 * music.kickPulse : 0);
    if (this.shake > 0.001) {
      eye.x += (Math.sin(time * 37) + Math.sin(time * 23)) * 0.06 * this.shake;
      eye.y += (Math.sin(time * 41) + Math.sin(time * 29)) * 0.05 * this.shake;
    }
    this.fovPunch *= Math.exp(-dt * 3);
    this.camera.position.copy(eye);
    this.camera.lookAt(target);
    this.camera.fov = fitFov(fov - 6 * this.fovPunch, this.camera.aspect);
    this.camera.updateProjectionMatrix();
  }
}
