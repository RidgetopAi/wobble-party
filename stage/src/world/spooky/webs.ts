/**
 * Cobwebs in the truss corners and a spider that lets itself down on its
 * thread as a build rises, then shoots back up when the drop lands.
 */

import * as THREE from 'three';
import { Section, type Music, type MusicEvent } from '../../music';
import { approach, Rng } from '../../rng';
import type { Palette } from '../../theme';

const TRUSS_Y = 8.6;

/** A quarter web in the xy plane: corner at the origin, spanning +x and -y. */
function webGeometry(size: number, rng: Rng) {
  const spokes = 7;
  const rings = 7;
  const pts: number[] = [];
  const at = (k: number, r: number) => {
    const a = (-Math.PI / 2) * (k / (spokes - 1));
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const lens = Array.from({ length: spokes }, () => size * rng.range(0.85, 1.05));
  for (let k = 0; k < spokes; k++) {
    const [x, y] = at(k, lens[k]);
    pts.push(0, 0, 0, x, y, 0);
  }
  for (let j = 1; j <= rings; j++) {
    const f = j / (rings + 0.6);
    for (let k = 0; k < spokes - 1; k++) {
      const [x0, y0] = at(k, lens[k] * f);
      const [x1, y1] = at(k + 1, lens[k + 1] * f);
      // Each thread sags toward the corner in the middle.
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps;
        const t1 = (s + 1) / steps;
        const sag0 = 1 - 0.12 * Math.sin(Math.PI * t0);
        const sag1 = 1 - 0.12 * Math.sin(Math.PI * t1);
        pts.push((x0 + (x1 - x0) * t0) * sag0, (y0 + (y1 - y0) * t0) * sag0, 0, (x0 + (x1 - x0) * t1) * sag1, (y0 + (y1 - y0) * t1) * sag1, 0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

export class Webs {
  readonly group = new THREE.Group();
  private mat: THREE.LineBasicMaterial;
  private spider = new THREE.Group();
  private legs: THREE.Group[] = [];
  private thread: THREE.Line;
  private threadPos: THREE.BufferAttribute;
  private drop = 0.6;
  private zip = 0;
  private t = 0;
  private x = -3.4;
  private z = -3.6;

  constructor(private p: Palette) {
    const rng = new Rng(77);
    this.mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false });
    const corner = (x: number, z: number, flip: number, size: number) => {
      const w = new THREE.LineSegments(webGeometry(size, rng), this.mat);
      w.position.set(x, TRUSS_Y - 0.25, z);
      w.scale.x = flip;
      this.group.add(w);
    };
    corner(-11.55, -3.4, 1, 2.6);
    corner(11.55, -3.4, -1, 2.2);
    corner(-11.55, -9.2, 1, 1.8);
    corner(11.55, -9.2, -1, 2.4);

    // The spider: round abdomen, small head, red eyes, eight bent legs.
    const black = new THREE.MeshStandardMaterial({ color: 0x0d0b10, roughness: 0.3, metalness: 0.2 });
    const eyes = new THREE.MeshBasicMaterial({ color: 0xff2030 });
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), black);
    abdomen.position.y = 0.12;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), black);
    head.position.set(0, -0.1, 0.1);
    this.spider.add(abdomen, head);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), eyes);
      eye.position.set(sx * 0.045, -0.1, 0.21);
      this.spider.add(eye);
    }
    const legGeo = new THREE.CylinderGeometry(0.014, 0.012, 0.3, 5);
    legGeo.translate(0, 0.15, 0);
    for (let i = 0; i < 8; i++) {
      const sx = i < 4 ? -1 : 1;
      const k = i % 4;
      const hip = new THREE.Group();
      hip.position.set(sx * 0.06, -0.02, 0.06 - k * 0.05);
      hip.rotation.set(0, (k - 1.5) * 0.35 * sx, sx * -1.1);
      const upper = new THREE.Mesh(legGeo, black);
      const knee = new THREE.Group();
      knee.position.y = 0.3;
      knee.rotation.z = sx * 1.9;
      const lower = new THREE.Mesh(legGeo, black);
      lower.scale.y = 1.2;
      knee.add(lower);
      hip.add(upper, knee);
      this.spider.add(hip);
      this.legs.push(hip);
    }
    this.thread = new THREE.Line(new THREE.BufferGeometry(), this.mat);
    this.threadPos = new THREE.BufferAttribute(new Float32Array(6), 3);
    this.thread.geometry.setAttribute('position', this.threadPos);
    this.thread.frustumCulled = false;
    this.group.add(this.spider, this.thread);
  }

  onEvent(e: MusicEvent) {
    if (e.type === 'drop') this.zip = 1;
  }

  update(dt: number, music: Music) {
    this.t += dt;
    // Webs catch the light: theme foreground, brighter on drops.
    this.mat.color.copy(this.p.fg);
    this.mat.opacity = (this.p.light ? 0.55 : 0.32) + 0.25 * music.dropPulse;

    // Down on the build, up on the drop, dangling otherwise.
    const want = this.zip > 0 ? 0.3 : music.section === Section.Build ? 1.2 + 4.2 * music.build : 0.9 + 1.2 * music.calm;
    this.drop = approach(this.drop, want, this.zip > 0 ? 6 : 0.9, dt);
    this.zip = Math.max(0, this.zip - dt / 2.5);
    const y = TRUSS_Y - 0.4 - this.drop;
    const swing = 0.12 * Math.sin(this.t * 1.3) * Math.min(1, this.drop / 2);
    this.spider.position.set(this.x + swing, y, this.z);
    this.spider.rotation.y = 0.4 * Math.sin(this.t * 0.4);
    this.spider.rotation.z = -swing * 0.5;
    const wig = music.hatPulse * music.presence;
    this.legs.forEach((l, i) => {
      l.rotation.x = 0.25 * Math.sin(this.t * 9 + i * 1.7) * (0.3 + wig + music.build);
    });
    const a = this.threadPos.array as Float32Array;
    a.set([this.x, TRUSS_Y - 0.35, this.z, this.x + swing, y + 0.3, this.z]);
    this.threadPos.needsUpdate = true;
  }
}
