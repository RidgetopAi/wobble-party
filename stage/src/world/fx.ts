/** Confetti bursts (candy corn in the spooky skin) and drifting haze. */

import * as THREE from 'three';
import type { Music } from '../music';
import { Rng } from '../rng';
import type { Palette } from '../theme';

const N_CONFETTI = 900;

/** A candy corn: a rounded triangle in white, orange and yellow bands. */
function candyCornGeometry() {
  const g = new THREE.ConeGeometry(0.055, 0.15, 10, 6);
  g.scale(1, 1, 0.55);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + 0.075) / 0.15; // 0 base .. 1 tip
    const c = t > 0.72 ? [1, 0.97, 0.9] : t > 0.3 ? [1, 0.45, 0.05] : [1, 0.8, 0.1];
    col.push(...c);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

export class Confetti {
  readonly mesh: THREE.InstancedMesh;
  readonly candy: THREE.InstancedMesh;
  readonly group = new THREE.Group();
  /** Which shape the bursts use; switching mid-air changes the pieces in flight too. */
  private kind: 'confetti' | 'candy' = 'confetti';
  private pos = new Float32Array(N_CONFETTI * 3);
  private vel = new Float32Array(N_CONFETTI * 3);
  private rot = new Float32Array(N_CONFETTI * 3);
  private spin = new Float32Array(N_CONFETTI * 3);
  private life = new Float32Array(N_CONFETTI);
  private colorIdx = new Uint8Array(N_CONFETTI);
  private rng = new Rng(99);
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private v = new THREE.Vector3();
  private s = new THREE.Vector3(1, 1, 1);
  private next = 0;
  private c = new THREE.Color();

  constructor(private p: Palette) {
    const g = new THREE.PlaneGeometry(0.13, 0.08);
    const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.4, metalness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.25 });
    this.mesh = new THREE.InstancedMesh(g, mat, N_CONFETTI);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N_CONFETTI; i++) {
      this.mesh.setColorAt(i, new THREE.Color(1, 1, 1));
      this.m.makeScale(0, 0, 0);
      this.mesh.setMatrixAt(i, this.m);
    }
    const cmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.08 });
    this.candy = new THREE.InstancedMesh(candyCornGeometry(), cmat, N_CONFETTI);
    this.candy.frustumCulled = false;
    this.candy.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.candy.visible = false;
    // The burst/update loop drives one mesh; the group holds both.
    this.group.add(this.mesh, this.candy);
  }

  setKind(kind: 'confetti' | 'candy') {
    if (kind === this.kind) return;
    this.kind = kind;
    this.mesh.visible = kind === 'confetti';
    this.candy.visible = kind === 'candy';
    // Clear pieces that died while this mesh was hidden; live ones are redrawn next update.
    const live = kind === 'candy' ? this.candy : this.mesh;
    this.m.makeScale(0, 0, 0);
    for (let i = 0; i < N_CONFETTI; i++) live.setMatrixAt(i, this.m);
    live.instanceMatrix.needsUpdate = true;
  }

  burst(count: number, from: THREE.Vector3, spread: THREE.Vector3, up = 3) {
    const r = this.rng;
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % N_CONFETTI;
      this.pos.set([from.x + r.range(-spread.x, spread.x), from.y + r.range(-spread.y, spread.y), from.z + r.range(-spread.z, spread.z)], i * 3);
      this.vel.set([r.range(-1.5, 1.5), r.range(0, up), r.range(-0.5, 2.5)], i * 3);
      this.rot.set([r.range(0, 6), r.range(0, 6), r.range(0, 6)], i * 3);
      this.spin.set([r.range(-9, 9), r.range(-9, 9), r.range(-9, 9)], i * 3);
      this.life[i] = r.range(5, 8);
      this.colorIdx[i] = r.int(6);
    }
  }

  update(dt: number) {
    for (let i = 0; i < N_CONFETTI; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const o = i * 3;
      // Flutter: drag + sideways drift.
      this.vel[o + 1] -= 3.2 * dt;
      const drag = Math.exp(-dt * 1.8);
      this.vel[o] *= drag;
      this.vel[o + 1] = Math.max(this.vel[o + 1] * drag, -1.3);
      this.vel[o + 2] *= drag;
      this.pos[o] += (this.vel[o] + Math.sin(this.rot[o] * 2) * 0.4) * dt;
      this.pos[o + 1] += this.vel[o + 1] * dt;
      this.pos[o + 2] += this.vel[o + 2] * dt;
      if (this.pos[o + 1] < 0.02) {
        this.pos[o + 1] = 0.02;
        this.vel[o] = this.vel[o + 1] = this.vel[o + 2] = 0;
        this.spin[o] = this.spin[o + 1] = this.spin[o + 2] = 0;
        this.rot[o] = Math.PI / 2;
      }
      for (let k = 0; k < 3; k++) this.rot[o + k] += this.spin[o + k] * dt;
      const fade = Math.min(1, this.life[i] / 1.2);
      this.q.setFromEuler(this.e.set(this.rot[o], this.rot[o + 1], this.rot[o + 2]));
      this.v.set(this.pos[o], this.pos[o + 1], this.pos[o + 2]);
      this.s.setScalar(fade);
      this.m.compose(this.v, this.q, this.s);
      if (this.kind === 'candy') {
        this.candy.setMatrixAt(i, this.m);
      } else {
        this.mesh.setMatrixAt(i, this.m);
        this.mesh.setColorAt(i, this.c.copy(this.p.lights[this.colorIdx[i]]));
      }
    }
    const live = this.kind === 'candy' ? this.candy : this.mesh;
    live.instanceMatrix.needsUpdate = true;
    if (live.instanceColor) live.instanceColor.needsUpdate = true;
  }
}

function hazeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const rng = new Rng(5);
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    const x = rng.range(40, 216);
    const y = rng.range(60, 196);
    const r = rng.range(30, 90);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.08)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Haze {
  readonly group = new THREE.Group();
  private sprites: { s: THREE.Sprite; base: THREE.Vector3; ph: number }[] = [];
  private mat: THREE.SpriteMaterial;

  constructor(private p: Palette) {
    this.mat = new THREE.SpriteMaterial({ map: hazeTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.12 });
    const rng = new Rng(11);
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(this.mat);
      const base = new THREE.Vector3(rng.range(-14, 14), rng.range(0.6, 5), rng.range(-9, 12));
      s.position.copy(base);
      s.scale.setScalar(rng.range(7, 13));
      this.group.add(s);
      this.sprites.push({ s, base, ph: rng.range(0, 6) });
    }
  }

  update(time: number, music: Music) {
    this.mat.color.copy(this.p.haze);
    this.mat.opacity = (this.p.light ? 0.06 : 0.1) * (0.6 + 0.4 * music.presence) + 0.06 * music.dropPulse;
    for (const h of this.sprites) {
      h.s.position.set(h.base.x + Math.sin(time * 0.05 + h.ph) * 2, h.base.y + Math.sin(time * 0.07 + h.ph * 2) * 0.4, h.base.z);
    }
  }
}
