/**
 * Everyone on the floor: the DJ (behind the booth), front-row heroes and the
 * generated crowd. Places them, forwards music events to their dancers,
 * runs crowd-wide moves (waves) and applies theme colours.
 */

import * as THREE from 'three';
import { Section, type Music, type MusicEvent } from './music';
import { clamp, Rng } from './rng';
import type { Palette } from './theme';
import { Dancer, type DanceContext } from './wobbler/dancer';
import { crowdLook, djLook, heroLooks } from './wobbler/look';
import { Wobbler } from './wobbler/wobbler';
import { DJ_RISER, DJ_Z, STAGE_Y } from './world/venue';

const DJ_POS = new THREE.Vector3(0, STAGE_Y + DJ_RISER, DJ_Z);

type DJRoutine = 'decks' | 'headphone' | 'fist' | 'hype' | 'point' | 'wave';

export class DJDancer extends Dancer {
  djRoutine: DJRoutine = 'decks';
  private scratch = 0;

  override onEvent(e: MusicEvent, ctx: DanceContext) {
    const rig = this.w.rig;
    const m = ctx.music;
    switch (e.type) {
      case 'danceBeat':
        rig.kick(-(0.9 + 1.3 * m.hype), 0);
        if (e.beat % 8 === 0) this.chooseDJ(m);
        return;
      case 'hat':
        this.scratch = e.strength;
        return;
      case 'drop':
        this.djRoutine = 'hype';
        this.jump(ctx.time, 0, 0.3);
        this.wooUntil = ctx.time + 1.0;
        return;
      case 'phraseStart':
        if (this.rng.chance(0.5)) this.djRoutine = 'point';
        break;
      case 'section':
        this.chooseDJ(m);
        break;
    }
    super.onEvent(e, ctx);
  }

  private chooseDJ(m: Music) {
    const opts: [DJRoutine, number][] =
      m.section === Section.Calm
        ? [
            ['decks', 3],
            ['headphone', 2],
          ]
        : m.section === Section.Build
          ? [
              ['headphone', 3],
              ['point', 1.5],
              ['decks', 1],
            ]
          : m.section === Section.Peak
            ? [
                ['fist', 3],
                ['hype', 2],
                ['wave', 2],
                ['decks', 1],
              ]
            : [
                ['decks', 4],
                ['fist', 1.5],
                ['headphone', 1],
              ];
    this.djRoutine = this.rng.weighted(opts);
    this.side = this.rng.chance(0.5) ? 1 : -1;
  }

  protected override arms(dt: number, ctx: DanceContext, beats: number, ph: number) {
    const [L, R] = this.w.arms;
    const main = this.side > 0 ? R : L;
    const other = this.side > 0 ? L : R;
    const punch = Math.exp(-ph * 8);
    const onDeck = (a: typeof L, k: number) =>
      a.target({ raise: 0.3, fwd: 1.1 + 0.16 * this.scratch * Math.sin(ctx.time * 30 + k), inward: 0.4, elbow: 0.25 });
    this.scratch *= Math.exp(-dt * 6);
    if (ctx.music.presence < 0.3) {
      onDeck(L, 0);
      onDeck(R, 1);
      return;
    }
    switch (this.djRoutine) {
      case 'decks':
        onDeck(L, 0);
        onDeck(R, 1.3);
        break;
      case 'headphone':
        main.target({ raise: 1.9, fwd: 0.2, inward: 0.55, elbow: 2.4 });
        onDeck(other, 0);
        break;
      case 'fist':
        main.target({ raise: 2.3 + 0.3 * punch, fwd: 0.3, inward: 0.1, elbow: 1.3 - 1.1 * punch });
        onDeck(other, 0);
        break;
      case 'hype': {
        const wig = 0.12 * Math.sin(ctx.time * 10);
        L.target({ raise: 2.7 + wig, fwd: 0.2, inward: 0, elbow: 0.2 });
        R.target({ raise: 2.7 - wig, fwd: 0.2, inward: 0, elbow: 0.2 });
        break;
      }
      case 'point':
        main.target({ raise: 1.7 + 0.2 * punch, fwd: 1.1, inward: -0.1, elbow: 0.05 });
        onDeck(other, 0);
        break;
      case 'wave': {
        const sw = Math.sin((Math.PI * beats) / 2);
        L.target({ raise: 2.5 - 0.35 * sw, fwd: 0.3, inward: 0, elbow: 0.25 });
        R.target({ raise: 2.5 + 0.35 * sw, fwd: 0.3, inward: 0, elbow: 0.25 });
        break;
      }
    }
  }
}

export class Crowd {
  readonly group = new THREE.Group();
  readonly shadows = new THREE.Group();
  readonly all: Wobbler[] = [];
  readonly dancers: Dancer[] = [];
  readonly heroes: Dancer[] = [];
  readonly dj: DJDancer;
  /** Points on the crowd for lights to aim at. */
  readonly targets: THREE.Vector3[] = [];
  private yawToStage = new Map<Dancer, number>();
  private rng = new Rng(2024);

  constructor(count: number, quality: 'high' | 'low', palette: Palette) {
    const djW = new Wobbler(djLook(), 1, quality);
    djW.placeAt(DJ_POS.x, DJ_POS.z, 0);
    djW.home.y = DJ_POS.y;
    this.dj = new DJDancer(djW, 1);
    this.add(this.dj, 0);

    // Heroes are the front row: nothing between them and the stage, so
    // close-ups have a clear line of sight.
    const heroSpots: [number, number][] = [
      [-1.3, -1.1],
      [1.3, -1.1],
      [-3.8, -0.8],
      [3.8, -0.8],
      [0.0, -0.7],
    ];
    heroLooks().forEach((look, i) => {
      const w = new Wobbler(look, 100 + i, quality);
      const [x, z] = heroSpots[i];
      const d = new Dancer(w, 100 + i);
      this.place(d, x, z);
      this.heroes.push(d);
    });

    // Crowd rows: an arc facing the booth, denser up front.
    const spots: [number, number][] = [];
    for (let row = 0; spots.length < count && row < 14; row++) {
      const z = 0.35 + row * 1.35;
      const half = 5 + row * 0.75;
      const n = Math.round((half * 2) / 1.45);
      for (let k = 0; k <= n; k++) {
        const x = -half + (k / n) * half * 2 + this.rng.range(-0.3, 0.3) + (row % 2) * 0.35;
        const zz = z + this.rng.range(-0.35, 0.35);
        if (heroSpots.some(([hx, hz]) => Math.hypot(hx - x, hz - zz) < 1.3)) continue;
        spots.push([x, zz]);
      }
    }
    spots.sort((a, b) => Math.hypot(a[0], a[1] + 1) - Math.hypot(b[0], b[1] + 1));
    for (let i = 0; i < Math.min(count, spots.length); i++) {
      const [x, z] = spots[i];
      const w = new Wobbler(crowdLook(i + 1), 500 + i, i < 30 ? quality : 'low');
      this.place(new Dancer(w, 500 + i), x, z);
      if (i % 3 === 0) this.targets.push(new THREE.Vector3(x, 0.8, z));
    }
    this.applyPalette(palette);
  }

  private place(d: Dancer, x: number, z: number) {
    const yaw = Math.atan2(DJ_POS.x - x, DJ_POS.z - z);
    d.w.placeAt(x, z, yaw);
    this.add(d, yaw);
  }

  private add(d: Dancer, yaw: number) {
    this.all.push(d.w);
    this.dancers.push(d);
    this.yawToStage.set(d, yaw);
    this.group.add(d.w.root);
    this.shadows.add(d.w.shadow);
  }

  applyPalette(p: Palette) {
    for (const w of this.all) w.applyPalette(p);
  }

  onEvent(e: MusicEvent, ctx: Omit<DanceContext, 'stageYaw'>) {
    for (const d of this.dancers) d.onEvent(e, { ...ctx, stageYaw: this.yawToStage.get(d)! });
  }

  /** A stadium wave rolling across the crowd from one side. */
  wave(time: number, fromLeft: boolean, beatDur: number) {
    for (const d of this.dancers) {
      if (d === this.dj) continue;
      const x = d.w.home.x;
      const delay = clamp(((fromLeft ? x : -x) + 14) / 28) * beatDur * 4;
      d.jump(time, delay, 0.32);
    }
  }

  update(dt: number, music: Music, time: number, camera: THREE.Camera) {
    for (const d of this.dancers) {
      const cam = d.lookAtCamera > 0 ? Math.atan2(camera.position.x - d.w.home.x, camera.position.z - d.w.home.z) : null;
      d.update(dt, { music, time, stageYaw: this.yawToStage.get(d)!, cameraYaw: cam });
      d.w.update(dt);
    }
  }
}
