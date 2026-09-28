/**
 * Accessories. Two kinds:
 *  - conforming shells (cap dome, beanie, headband, hair cap): lathe shells
 *    built from the body's own profile and deformed by the body's shader,
 *    so they hug the head and squash with it;
 *  - rigid parts (brims, bows, tufts, headphone cups, glasses...) hung on
 *    surface anchors that follow the deforming body.
 * Units: body height ~1, radius ~0.38.
 */

import * as THREE from 'three';
import type { Accessory } from './look';
import { profileRadius, type BodyShape } from './body';

export interface AccessoryContext {
  shape: BodyShape;
  color: THREE.Material;
  dark: THREE.Material;
  trim: THREE.Material;
  quality: 'high' | 'low';
  /** Patch a material so it deforms like the body. */
  conform(m: THREE.Material): THREE.Material;
  /** Add a conforming mesh (body space, undeformed coordinates). */
  addShell(m: THREE.Mesh): void;
  /** A surface anchor at normalised height u and angle (0 = front, +x = +pi/2), pushed out by `out`. */
  anchor(u: number, angle: number, out?: number): THREE.Object3D;
}

export interface AccessoryParts {
  glowMats: THREE.MeshStandardMaterial[];
}

const cache = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry) {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

/** Lathe shell following the body profile between u0 and u1 (closed if u1 = 1). */
export function shellGeometry(shape: BodyShape, u0: number, u1: number, grow: number, segments = 48): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const n = 24;
  const H = shape.height;
  // Outer surface bottom -> top, then inner edge back down for a lip.
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = u0 + (u1 - u0) * (u1 >= 1 ? Math.sin((t * Math.PI) / 2) : t);
    const r = u >= 0.999 ? 0 : profileRadius(shape, u) + grow;
    const y = u * H + (u >= 0.999 ? grow : grow * 0.6 * t);
    pts.push(new THREE.Vector2(r, y));
  }
  if (u1 < 1) {
    // Close the band with an inner face so it reads as a solid ring.
    for (let i = n; i >= 0; i -= n) {
      const t = i / n;
      const u = u0 + (u1 - u0) * t;
      pts.push(new THREE.Vector2(profileRadius(shape, u) - 0.004, u * H));
    }
  } else {
    pts.unshift(new THREE.Vector2(profileRadius(shape, u0) - 0.004, u0 * H));
  }
  const g = new THREE.LatheGeometry(pts, segments, Math.PI, Math.PI * 2);
  g.computeVertexNormals();
  return g;
}

function starShape(r: number, inner: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function buildAccessories(list: Accessory[], ctx: AccessoryContext): AccessoryParts {
  const glowMats: THREE.MeshStandardMaterial[] = [];
  const { shape, color, dark, trim } = ctx;
  const H = shape.height;
  const seg = ctx.quality === 'high' ? 48 : 24;
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => new THREE.Mesh(g, m);
  const shell = (u0: number, u1: number, grow: number, m: THREE.Material) => {
    const s = mesh(shellGeometry(shape, u0, u1, grow, seg), ctx.conform(m));
    s.frustumCulled = false;
    ctx.addShell(s);
    return s;
  };
  const rTop = (u: number) => profileRadius(shape, u);

  for (const a of list) {
    switch (a) {
      case 'cap':
      case 'capBack': {
        shell(0.74, 1, 0.022, color);
        // Brim: a flattened half-disc on the front (or back) of the head.
        const ang = a === 'cap' ? 0 : Math.PI;
        const anchor = ctx.anchor(0.75, ang, 0.01);
        const brim = mesh(geo('capBrim', () => new THREE.CylinderGeometry(1, 1, 1, 40, 1, false, -Math.PI / 2, Math.PI)), trim);
        brim.scale.set(rTop(0.75) * 0.95, 0.024, 0.2);
        brim.rotation.x = 0.12;
        brim.position.set(0, 0, 0.02);
        anchor.add(brim);
        const top = ctx.anchor(1, 0, 0.02);
        const btn = mesh(geo('btn', () => new THREE.SphereGeometry(1, 12, 8)), dark);
        btn.scale.set(0.04, 0.025, 0.04);
        top.add(btn);
        break;
      }
      case 'headphones': {
        // Band arcs over the head (anchored at the top), cups on the sides.
        const top = ctx.anchor(1, 0, 0);
        const cupU = 0.7;
        const side = rTop(cupU) + 0.05;
        const drop = (1 - cupU) * H;
        const band = mesh(geo('hpBand', () => new THREE.TorusGeometry(1, 0.045, 10, 48, Math.PI)), dark);
        band.scale.set(side, drop + 0.05, 1.0);
        band.position.y = -drop;
        top.add(band);
        for (const sx of [-1, 1]) {
          const cupA = ctx.anchor(cupU, sx * Math.PI / 2, 0.035);
          const cup = mesh(geo('hpCup', () => new THREE.CylinderGeometry(1, 1, 1, 28)), dark);
          cup.scale.set(0.13, 0.08, 0.13);
          cup.rotation.x = Math.PI / 2;
          cupA.add(cup);
          const led = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 });
          glowMats.push(led);
          const ring = mesh(geo('hpRing', () => new THREE.TorusGeometry(1, 0.16, 8, 28)), led);
          ring.scale.setScalar(0.1);
          ring.position.z = 0.042;
          cupA.add(ring);
        }
        break;
      }
      case 'bow': {
        const anchor = ctx.anchor(0.9, 0.55, 0.02);
        for (const sx of [-1, 1]) {
          const lobe = mesh(geo('bowLobe', () => new THREE.SphereGeometry(1, 20, 14)), color);
          lobe.scale.set(0.12, 0.085, 0.055);
          lobe.position.set(sx * 0.1, 0, 0);
          lobe.rotation.z = sx * 0.4;
          anchor.add(lobe);
        }
        const knot = mesh(geo('bowKnot', () => new THREE.SphereGeometry(1, 14, 10)), color);
        knot.scale.set(0.05, 0.055, 0.045);
        anchor.add(knot);
        anchor.children.forEach((c) => (c.rotation.x -= 0.3));
        break;
      }
      case 'tuft': {
        const top = ctx.anchor(1, 0, -0.01);
        for (let i = 0; i < 3; i++) {
          const spike = mesh(geo('tuft', () => new THREE.ConeGeometry(1, 1, 12)), color);
          spike.scale.set(0.045, 0.17, 0.045);
          spike.position.set((i - 1) * 0.04, 0.07, 0);
          spike.rotation.z = (1 - i) * 0.5;
          spike.rotation.x = -0.2;
          top.add(spike);
        }
        break;
      }
      case 'mohawk': {
        for (let i = 0; i < 5; i++) {
          const t = i / 4;
          // Along the head centre line, from the forehead over the top to the back.
          const ang = t < 0.5 ? 0 : Math.PI;
          const u = t < 0.5 ? 0.86 + t * 0.28 : 1 - (t - 0.5) * 0.28;
          const an = ctx.anchor(u, ang, -0.01);
          const spike = mesh(geo('mohawk', () => new THREE.ConeGeometry(1, 1, 10)), color);
          spike.scale.set(0.035, 0.15 - Math.abs(t - 0.5) * 0.08, 0.06);
          spike.position.y = 0.05;
          an.add(spike);
        }
        break;
      }
      case 'beanie': {
        shell(0.7, 1, 0.03, color);
        shell(0.68, 0.76, 0.045, color);
        const top = ctx.anchor(1, 0, 0.03);
        const pom = mesh(geo('pom', () => new THREE.IcosahedronGeometry(1, 2)), dark);
        pom.scale.setScalar(0.075);
        pom.position.y = 0.05;
        top.add(pom);
        break;
      }
      case 'headband': {
        shell(0.8, 0.86, 0.022, color);
        break;
      }
      case 'antenna': {
        const top = ctx.anchor(1, 0, 0);
        const stalk = mesh(geo('stalk', () => new THREE.CylinderGeometry(0.012, 0.016, 0.22, 8)), dark);
        stalk.position.y = 0.1;
        const ball = mesh(geo('ball', () => new THREE.SphereGeometry(1, 16, 12)), color);
        ball.scale.setScalar(0.05);
        ball.position.y = 0.22;
        top.add(stalk, ball);
        break;
      }
      case 'crown': {
        const top = ctx.anchor(1, 0, 0);
        const gold = new THREE.MeshPhysicalMaterial({ color: 0xffc83d, metalness: 1, roughness: 0.25, emissive: 0x3a2400 });
        const ring = mesh(geo('crownRing', () => new THREE.CylinderGeometry(1, 1, 1, 24, 1, true)), gold);
        const r = rTop(0.95) * 0.9;
        ring.scale.set(r, 0.06, r);
        ring.position.y = -0.02;
        top.add(ring);
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const spike = mesh(geo('crownSpike', () => new THREE.ConeGeometry(1, 1, 8)), gold);
          spike.scale.set(0.035, 0.09, 0.035);
          spike.position.set(Math.sin(ang) * r, 0.05, Math.cos(ang) * r);
          top.add(spike);
        }
        top.rotation.z = 0.12;
        break;
      }
      case 'pompadour': {
        shell(0.82, 1, 0.025, color);
        // The quiff: a big forward swoop over the forehead.
        const front = ctx.anchor(0.9, 0, 0.0);
        const quiff = mesh(geo('quiff', () => new THREE.SphereGeometry(1, 28, 18)), color);
        quiff.scale.set(rTop(0.88) * 0.95, 0.13, 0.2);
        quiff.position.set(0, 0.1, 0.04);
        quiff.rotation.x = -0.75;
        front.add(quiff);
        const curl = mesh(geo('quiff', () => new THREE.SphereGeometry(1, 28, 18)), color);
        curl.scale.set(rTop(0.88) * 0.7, 0.09, 0.14);
        curl.position.set(0, 0.17, -0.02);
        curl.rotation.x = -0.25;
        front.add(curl);
        break;
      }
      case 'bun': {
        const top = ctx.anchor(1, 0, -0.02);
        const bun = mesh(geo('bun', () => new THREE.SphereGeometry(1, 20, 14)), color);
        bun.scale.set(0.11, 0.1, 0.11);
        bun.position.y = 0.06;
        top.add(bun);
        break;
      }
      case 'starGlasses':
      case 'roundGlasses': {
        const face = ctx.anchor(0.64, 0, 0.03);
        const frame = a === 'starGlasses' ? color : dark;
        const lens = new THREE.MeshPhysicalMaterial({
          color: a === 'starGlasses' ? 0x2a3cc0 : 0x111122,
          roughness: 0.05,
          clearcoat: 1,
          transparent: true,
          opacity: 0.88,
        });
        const eyeX = 0.123;
        for (const sx of [-1, 1]) {
          if (a === 'starGlasses') {
            const star = mesh(
              geo('starFrame', () => new THREE.ExtrudeGeometry(starShape(0.13, 0.5), { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2 })),
              frame,
            );
            star.position.set(sx * eyeX, 0, -0.01);
            star.rotation.y = sx * 0.28;
            const inner = mesh(geo('starLens', () => new THREE.ShapeGeometry(starShape(0.095, 0.5))), lens);
            inner.position.set(sx * eyeX, 0, 0.024);
            inner.rotation.y = sx * 0.28;
            face.add(star, inner);
          } else {
            const rim = mesh(geo('rim', () => new THREE.TorusGeometry(0.085, 0.013, 8, 28)), frame);
            rim.position.set(sx * eyeX, 0, 0);
            rim.rotation.y = sx * 0.28;
            const l = mesh(geo('rimLens', () => new THREE.CircleGeometry(0.082, 28)), lens);
            l.position.set(sx * eyeX, 0, 0.002);
            l.rotation.y = sx * 0.28;
            face.add(rim, l);
          }
        }
        const bridge = mesh(geo('bridge', () => new THREE.CylinderGeometry(0.01, 0.01, 0.07, 6)), frame);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, 0.015, 0.012);
        face.add(bridge);
        break;
      }
    }
  }
  return { glowMats };
}
