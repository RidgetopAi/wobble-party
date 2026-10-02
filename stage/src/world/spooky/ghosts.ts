/**
 * Real ghosts: see-through wobblers that drift round the room above the
 * crowd, bob on the beat, "oooh" along with the singer and swoop low over
 * everyone when the drop lands.
 */

import * as THREE from 'three';
import { Section, type Music, type MusicEvent } from '../../music';
import { approach, clamp, Rng } from '../../rng';
import type { Palette } from '../../theme';
import { CostumeKind } from '../../wobbler/costume';
import { crowdLook } from '../../wobbler/look';
import { Wobbler } from '../../wobbler/wobbler';

interface Ghost {
  w: Wobbler;
  phase: number;
  speed: number;
  rx: number;
  rz: number;
  cz: number;
  height: number;
  swoop: number;
  mats: THREE.Material[];
}

export class Ghosts {
  readonly group = new THREE.Group();
  private ghosts: Ghost[] = [];
  private rng = new Rng(1313);
  private t = 0;
  private swoopUntil = -1;

  constructor(quality: 'high' | 'low', palette: Palette) {
    for (let i = 0; i < 4; i++) {
      const look = crowdLook(900 + i);
      look.costume = { kind: CostumeKind.Ghost, accessories: ['ghostHem'], body: new THREE.Color('#eef0ff'), acc: new THREE.Color('#eef0ff'), outfit: { ...look.outfit, kind: 0, emblem: 0 } };
      look.scale = 1.15;
      const w = new Wobbler(look, 9000 + i, quality);
      w.setSkin('spooky');
      w.applyPalette(palette);
      const mats: THREE.Material[] = [];
      w.root.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (!m) return;
        m.transparent = true;
        m.depthWrite = false;
        mats.push(m);
      });
      this.group.add(w.root);
      this.ghosts.push({
        w,
        mats,
        phase: this.rng.range(0, 6.28),
        speed: this.rng.range(0.07, 0.12) * (i % 2 ? 1 : -1),
        rx: this.rng.range(7, 11),
        rz: this.rng.range(4, 7),
        cz: this.rng.range(3, 7),
        height: this.rng.range(3.6, 5.6),
        swoop: 0,
      });
    }
  }

  applyPalette(p: Palette) {
    for (const g of this.ghosts) g.w.applyPalette(p);
  }

  onEvent(e: MusicEvent, music: Music) {
    if (e.type === 'drop') this.swoopUntil = this.t + (8 * 60) / Math.max(60, music.danceBpm);
  }

  update(dt: number, music: Music) {
    this.t += dt;
    const beats = music.danceBeatPos;
    const swooping = this.t < this.swoopUntil;
    for (const g of this.ghosts) {
      const w = g.w;
      g.phase += dt * g.speed * (1 + 0.8 * music.hype);
      g.swoop = approach(g.swoop, swooping ? 1 : 0, swooping ? 2.5 : 0.8, dt);
      const x = Math.sin(g.phase) * g.rx;
      // Stay over the room, not in the camera's face at the back.
      const z = Math.min(10, g.cz + Math.cos(g.phase * 1.3) * g.rz);
      const bob = 0.25 * Math.sin(Math.PI * beats + g.phase * 3) * music.presence + 0.3 * Math.sin(this.t * 0.9 + g.phase);
      w.home.set(x, g.height - 2.4 * g.swoop + bob, z);
      // Face where they are going, half turned to the room.
      const vx = Math.cos(g.phase) * g.rx * g.speed;
      const vz = -Math.sin(g.phase * 1.3) * 1.3 * g.rz * g.speed;
      const yaw = Math.atan2(vx, vz);
      const turns = Math.round((w.rig.yaw.target - yaw) / (Math.PI * 2));
      w.rig.yaw.target = yaw + turns * Math.PI * 2;
      w.rig.tiltZ.target = 0.18 * Math.sin((Math.PI * beats) / 2) * music.presence - 0.25 * Math.sign(g.speed) * g.swoop;
      w.rig.tiltX.target = 0.15 + 0.2 * g.swoop;
      w.rig.stretch.target = 1.05 + 0.05 * Math.sin(this.t * 2 + g.phase);
      // "Boo" arms, wiggling; arms up and wailing when the singer goes for it.
      const wail = clamp(music.vocal * 1.4 - 0.3);
      const wig = 0.25 * Math.sin(this.t * 6 + g.phase);
      for (const [k, a] of w.arms.entries()) {
        const s = k ? 1 : -1;
        a.target({ raise: 1.4 + 1.1 * wail + wig * s, fwd: 1.2 - 0.8 * wail, inward: 0.2, elbow: 0.7 - 0.4 * wail });
      }
      const e = w.expr;
      e.mouth = Math.max(0.15, clamp(music.mouth * music.vocal * 1.3), 0.8 * g.swoop);
      e.happy = music.section === Section.Peak && Math.sin(this.t * 0.5 + g.phase) > 0.5;
      w.beatPhase = ((beats % 1) + 1) % 1;
      w.costumeGlow = 0.6 + 0.6 * music.vocal + 0.8 * music.dropPulse;
      const alpha = 0.3 + 0.18 * music.vocal + 0.1 * Math.sin(this.t * 1.7 + g.phase);
      for (const m of g.mats) m.opacity = alpha;
      w.update(dt);
    }
  }
}
