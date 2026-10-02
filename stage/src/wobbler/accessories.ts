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
  /** Moving parts (bat wings, devil tails): called every frame with the dance
   *  beat phase (0..1) and how hard the wearer is dancing (0..1). */
  animate: ((phase: number, energy: number) => void)[];
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

/** Like shellGeometry, but only part of the way round (phi from the front, +x = +pi/2). */
function partialShell(shape: BodyShape, u0: number, u1: number, grow: number, phi0: number, phiLen: number, segments: number) {
  const pts: THREE.Vector2[] = [];
  const n = 20;
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    // Flares out toward the hem, like cloth hanging off the shoulders.
    const flare = grow * (1 + 1.6 * (1 - i / n));
    pts.push(new THREE.Vector2(profileRadius(shape, u) + flare, u * shape.height));
  }
  const g = new THREE.LatheGeometry(pts, segments, phi0, phiLen);
  g.computeVertexNormals();
  return g;
}

/** A ghost's sheet hem: a skirt round the widest part with a wavy bottom edge. */
function hemGeometry(shape: BodyShape, segments: number) {
  const u0 = 0.32;
  const r0 = profileRadius(shape, u0) + 0.012;
  const g = new THREE.CylinderGeometry(r0, r0 + 0.07, u0 * shape.height + 0.02, segments, 3, true);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const top = (u0 * shape.height + 0.02) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const t = (top - y) / (2 * top); // 0 at the top, 1 at the hem
    pos.setY(i, y + top - 0.02 + Math.sin(Math.atan2(x, z) * 7) * 0.035 * t * t);
  }
  g.computeVertexNormals();
  return g;
}

function batWingShape() {
  // One wing, root at the origin, spreading toward +x.
  const s = new THREE.Shape();
  s.moveTo(0, 0.1);
  s.quadraticCurveTo(0.18, 0.22, 0.42, 0.2);
  s.lineTo(0.5, 0.26);
  s.quadraticCurveTo(0.5, 0.05, 0.44, -0.06);
  s.quadraticCurveTo(0.38, 0.0, 0.32, -0.02);
  s.quadraticCurveTo(0.25, -0.1, 0.2, -0.08);
  s.quadraticCurveTo(0.14, -0.02, 0.08, -0.06);
  s.quadraticCurveTo(0.04, -0.02, 0, -0.06);
  s.closePath();
  return s;
}

function earShape(w: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.quadraticCurveTo(-w * 0.3, h * 0.6, 0, h);
  s.quadraticCurveTo(w * 0.3, h * 0.6, w / 2, 0);
  s.closePath();
  return s;
}

export function buildAccessories(list: Accessory[], ctx: AccessoryContext): AccessoryParts {
  const glowMats: THREE.MeshStandardMaterial[] = [];
  const animate: AccessoryParts['animate'] = [];
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
      case 'witchHat': {
        const top = ctx.anchor(1, 0, 0);
        const hat = new THREE.Group();
        hat.position.y = -0.07;
        hat.rotation.set(-0.08, 0, 0.1);
        top.add(hat);
        const rb = rTop(0.85);
        const brim = mesh(geo('witchBrim', () => new THREE.CylinderGeometry(1, 1, 1, 40)), color);
        brim.scale.set(rb * 2.05, 0.02, rb * 2.05);
        hat.add(brim);
        // A cone that bends over at the tip: three stacked, tilted frusta.
        const segs: [number, number, number, number][] = [
          [0.27, 0.17, 0.2, 0.0],
          [0.17, 0.09, 0.17, -0.35],
          [0.09, 0.012, 0.16, -0.75],
        ];
        let parent: THREE.Object3D = hat;
        for (const [r0, r1, h, tilt] of segs) {
          const piece = new THREE.Group();
          piece.rotation.x = tilt;
          parent.add(piece);
          const m = mesh(new THREE.CylinderGeometry(r1, r0, h, 24), color);
          m.position.y = h / 2;
          piece.add(m);
          const next = new THREE.Group();
          next.position.y = h;
          piece.add(next);
          // Each segment tilts relative to the one below.
          parent = next;
        }
        const band = mesh(geo('witchBand', () => new THREE.CylinderGeometry(1, 1, 1, 24, 1, true)), trim);
        band.scale.set(0.258, 0.06, 0.258);
        band.position.y = 0.04;
        hat.add(band);
        const buckle = mesh(geo('witchBuckle', () => new THREE.TorusGeometry(1, 0.25, 6, 4)), new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 1, roughness: 0.3 }));
        buckle.scale.setScalar(0.035);
        buckle.rotation.z = Math.PI / 4;
        buckle.position.set(0, 0.04, 0.262);
        hat.add(buckle);
        break;
      }
      case 'horns': {
        for (const sx of [-1, 1]) {
          const an = ctx.anchor(0.93, sx * 0.55, -0.02);
          const base = mesh(geo('hornBase', () => new THREE.ConeGeometry(1, 1, 14)), color);
          base.scale.set(0.05, 0.12, 0.05);
          base.position.set(sx * 0.02, 0.05, 0);
          base.rotation.z = -sx * 0.45;
          an.add(base);
          const tip = mesh(geo('hornBase', () => new THREE.ConeGeometry(1, 1, 14)), color);
          tip.scale.set(0.03, 0.08, 0.03);
          tip.position.set(sx * 0.06, 0.14, 0);
          tip.rotation.z = sx * 0.25;
          an.add(tip);
        }
        break;
      }
      case 'devilTail': {
        const an = ctx.anchor(0.2, Math.PI, 0.0);
        const sway = new THREE.Group();
        an.add(sway);
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, -0.05, 0.12),
          new THREE.Vector3(0.05, 0.05, 0.24),
          new THREE.Vector3(0.02, 0.2, 0.3),
          new THREE.Vector3(-0.04, 0.3, 0.27),
        ]);
        sway.add(mesh(geo('tail', () => new THREE.TubeGeometry(curve, 24, 0.017, 6)), color));
        const spade = mesh(geo('spade', () => new THREE.ConeGeometry(1, 1, 4)), color);
        spade.scale.set(0.06, 0.09, 0.02);
        spade.position.set(-0.05, 0.34, 0.26);
        spade.rotation.z = 0.3;
        sway.add(spade);
        animate.push((ph, e) => {
          sway.rotation.y = 0.35 * Math.sin(ph * Math.PI * 2) * (0.4 + e);
          sway.rotation.x = 0.1 * Math.sin(ph * Math.PI * 4);
        });
        break;
      }
      case 'catEars':
      case 'batEars': {
        const bat = a === 'batEars';
        const [w, h] = bat ? [0.15, 0.24] : [0.17, 0.17];
        for (const sx of [-1, 1]) {
          const an = ctx.anchor(0.9, sx * 0.6, -0.01);
          const ear = mesh(geo(`ear${a}`, () => new THREE.ExtrudeGeometry(earShape(w, h), { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2 })), color);
          ear.position.z = -0.015;
          ear.rotation.z = -sx * 0.15;
          an.add(ear);
          const inner = mesh(geo(`earIn${a}`, () => new THREE.ShapeGeometry(earShape(w * 0.55, h * 0.7))), trim);
          inner.position.set(0, 0.015, 0.03);
          inner.rotation.z = -sx * 0.15;
          an.add(inner);
        }
        break;
      }
      case 'batWings': {
        const an = ctx.anchor(0.52, Math.PI, 0.0);
        const wingMat = (color as THREE.MeshPhysicalMaterial).clone();
        wingMat.side = THREE.DoubleSide;
        wingMat.color = (color as THREE.MeshPhysicalMaterial).color;
        const wings: THREE.Object3D[] = [];
        for (const sx of [-1, 1]) {
          const pivot = new THREE.Group();
          pivot.position.x = sx * 0.04;
          an.add(pivot);
          const w = mesh(geo('batWing', () => new THREE.ShapeGeometry(batWingShape(), 6)), wingMat);
          w.scale.set(sx * 1.25, 1.25, 1);
          pivot.add(w);
          wings.push(pivot);
        }
        animate.push((ph, e) => {
          // Two flaps per beat when dancing hard, a lazy fold otherwise.
          const f = Math.sin(ph * Math.PI * (e > 0.5 ? 4 : 2));
          const open = 0.55 + (0.2 + 0.35 * e) * f;
          wings[0].rotation.y = open;
          wings[1].rotation.y = -open;
        });
        break;
      }
      case 'ghostHem': {
        const hem = mesh(hemGeometry(shape, seg), ctx.conform(color));
        (hem.material as THREE.Material).side = THREE.DoubleSide;
        hem.frustumCulled = false;
        ctx.addShell(hem);
        break;
      }
      case 'stem': {
        const top = ctx.anchor(1, 0, -0.02);
        const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, 0.07, 0), new THREE.Vector3(0.05, 0.12, 0.01), new THREE.Vector3(0.09, 0.13, 0.02)]);
        top.add(mesh(geo('stem', () => new THREE.TubeGeometry(curve, 12, 0.032, 8)), color));
        const leaf = mesh(geo('leaf', () => new THREE.SphereGeometry(1, 12, 8)), trim);
        leaf.scale.set(0.09, 0.012, 0.055);
        leaf.position.set(-0.07, 0.04, 0.02);
        leaf.rotation.z = 0.35;
        top.add(leaf);
        break;
      }
      case 'flatTop': {
        shell(0.83, 1, 0.025, color);
        const top = ctx.anchor(1, 0, 0.0);
        const w = rTop(0.9) * 2;
        const slab = mesh(geo('flatTop', () => new THREE.BoxGeometry(1, 1, 1)), color);
        slab.scale.set(w * 0.72, 0.1, w * 0.66);
        slab.position.y = -0.035;
        top.add(slab);
        break;
      }
      case 'neckBolts': {
        for (const sx of [-1, 1]) {
          const an = ctx.anchor(0.47, sx * Math.PI / 2, 0.0);
          const bolt = mesh(geo('bolt', () => new THREE.CylinderGeometry(0.022, 0.022, 0.09, 10)), trim);
          bolt.rotation.x = Math.PI / 2;
          bolt.position.z = 0.03;
          const nut = mesh(geo('nut', () => new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6)), trim);
          nut.rotation.x = Math.PI / 2;
          nut.position.z = 0.075;
          an.add(bolt, nut);
        }
        break;
      }
      case 'capeCollar': {
        // A tall, flared collar standing up behind the head (red lining in front).
        const an = ctx.anchor(0.47, 0, -rTop(0.47));
        const r = rTop(0.47) + 0.035;
        const outer = mesh(geo(`collar${r.toFixed(3)}`, () => new THREE.CylinderGeometry(r * 1.45, r, 0.34, 32, 1, true, Math.PI - 0.62 * Math.PI, 1.24 * Math.PI)), color);
        outer.position.y = 0.17;
        const lining = (trim as THREE.MeshPhysicalMaterial).clone();
        lining.color = (trim as THREE.MeshPhysicalMaterial).color;
        lining.side = THREE.BackSide;
        const inner = new THREE.Mesh(outer.geometry, lining);
        inner.position.copy(outer.position);
        inner.scale.setScalar(0.985);
        an.add(outer, inner);
        break;
      }
      case 'cape': {
        // Hangs off the shoulders round the back; conforms so it sways with the body.
        const g = partialShell(shape, 0.05, 0.5, 0.03, Math.PI - 0.58 * Math.PI, 1.16 * Math.PI, seg);
        const outer = mesh(g, ctx.conform(color));
        const lin = ctx.conform(trim) as THREE.MeshPhysicalMaterial;
        lin.side = THREE.BackSide;
        const inner = mesh(g, lin);
        for (const m of [outer, inner]) {
          m.frustumCulled = false;
          ctx.addShell(m);
        }
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
  return { glowMats, animate };
}
