/**
 * A complete wobbler: body (deforming vinyl egg with SDF face/outfit),
 * noodle arms, accessories, blob shadow, the weeble physics rig and the
 * facial expression state. Choreography (dancer.ts) drives it through
 * `rig`, `arms` and `expr`; this class turns that into transforms/uniforms.
 *
 * Transform chain (rolling weeble):
 *   root        world position + rolling offset + hop height (+ roll radius)
 *   tilt        rotation about the bottom sphere's centre
 *   lower       -rollRadius (so the bottom touches the floor)
 *   spin        yaw about the body axis
 *   body/arms/anchors
 */

import * as THREE from 'three';
import { approach, clamp, Rng } from '../rng';
import { buildAccessories, type AccessoryContext, type AccessoryParts } from './accessories';
import type { SkinId } from '../skin';
import { BODY_H, Deform, FaceParams, bodyGeometry, bodyMaterial, conformMaterial, profileRadius, vinyl } from './body';
import type { Look } from './look';
import { Rig, Spring } from './rig';
import type { Palette } from '../theme';

export interface ArmPose {
  /** Outward raise: 0 = hanging, ~1.6 = horizontal, ~2.8 = straight up. */
  raise: number;
  /** Forward swing (radians). */
  fwd: number;
  /** Inward rotation (brings hands together in front). */
  inward: number;
  /** Elbow bend (radians). */
  elbow: number;
}

const ARM_SPEC = { hz: 3.6, zeta: 0.42 };

export class Arm {
  readonly shoulder = new THREE.Object3D();
  readonly elbowJ = new THREE.Object3D();
  readonly hand: THREE.Mesh;
  readonly raise = new Spring(0.5, ARM_SPEC);
  readonly fwd = new Spring(0.1, ARM_SPEC);
  readonly inward = new Spring(0, ARM_SPEC);
  readonly elbow = new Spring(0.35, { hz: 4.5, zeta: 0.38 });
  /** Extra per-frame offsets added after the springs (fast gestures). */
  readonly add: ArmPose = { raise: 0, fwd: 0, inward: 0, elbow: 0 };

  constructor(
    public side: 1 | -1,
    mat: THREE.Material,
    thick: number,
    quality: 'high' | 'low',
  ) {
    const seg = quality === 'high' ? 12 : 8;
    const upper = new THREE.Mesh(armGeo('upper', 0.058 * thick, 0.16, seg), mat);
    upper.position.y = -0.08;
    this.shoulder.add(upper);
    this.elbowJ.position.y = -0.16;
    this.shoulder.add(this.elbowJ);
    const fore = new THREE.Mesh(armGeo('fore', 0.052 * thick, 0.13, seg), mat);
    fore.position.y = -0.065;
    this.elbowJ.add(fore);
    this.hand = new THREE.Mesh(armGeo('hand', 0.075 * thick, 0, seg), mat);
    this.hand.scale.set(1, 1.1, 0.85);
    this.hand.position.y = -0.15;
    this.elbowJ.add(this.hand);
  }

  target(p: Partial<ArmPose>) {
    if (p.raise !== undefined) this.raise.target = p.raise;
    if (p.fwd !== undefined) this.fwd.target = p.fwd;
    if (p.inward !== undefined) this.inward.target = p.inward;
    if (p.elbow !== undefined) this.elbow.target = p.elbow;
  }

  update(dt: number) {
    for (const s of [this.raise, this.fwd, this.inward, this.elbow]) s.step(dt);
    const raise = this.raise.x + this.add.raise;
    const fwd = this.fwd.x + this.add.fwd;
    const inward = this.inward.x + this.add.inward;
    const elbow = this.elbow.x + this.add.elbow;
    // Rx(fwd) first, then Rz(raise), then Ry(inward) — see comments in pose().
    this.shoulder.rotation.set(-fwd, -this.side * inward, this.side * raise, 'YZX');
    this.elbowJ.rotation.set(-Math.max(0, elbow), 0, 0);
    this.add.raise = this.add.fwd = this.add.inward = this.add.elbow = 0;
  }
}

const armGeoCache = new Map<string, THREE.BufferGeometry>();
function armGeo(kind: string, r: number, len: number, seg: number) {
  const key = `${kind}:${r.toFixed(3)}:${len}:${seg}`;
  let g = armGeoCache.get(key);
  if (!g) {
    g = len > 0 ? new THREE.CapsuleGeometry(r, len, 4, seg) : new THREE.SphereGeometry(r, seg + 4, seg);
    armGeoCache.set(key, g);
  }
  return g;
}

export interface Expression {
  mouth: number;
  smile: number;
  /** ^^ eyes */
  happy: boolean;
  star: boolean;
  blush: number;
  /** Where the eyes look (-1..1). */
  lookX: number;
  lookY: number;
  /** Close eyes (content singing). */
  closed: boolean;
  wink: 0 | 1 | -1;
  glowBelt: number;
  glowEmblem: number;
}

let shadowTex: THREE.Texture | null = null;
function blobShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.5)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

export class Wobbler {
  readonly root = new THREE.Group();
  readonly tilt = new THREE.Group();
  readonly lower = new THREE.Group();
  readonly spin = new THREE.Group();
  /** Surface anchors for rigid accessories (updated every frame while their outfit shows). */
  private anchors: { obj: THREE.Object3D; u: number; ang: number; out: number; dress: THREE.Group }[] = [];
  /** Accessories per skin: built on first use, shown one at a time. */
  private dress: Partial<Record<SkinId, { group: THREE.Group; parts: AccessoryParts }>> = {};
  skinId: SkinId = 'classic';
  /** Set by the dancer each frame: dance-beat phase and how hard (for wings, tails, lanterns). */
  beatPhase = 0;
  dancing = 0;
  /** Costume glow (lantern light, glowing bones/eyes), set by the dancer. */
  costumeGlow = 0.4;
  private clock = 0;
  private palette: Palette | null = null;
  private accCtx: Omit<AccessoryContext, 'addShell' | 'anchor'>;
  readonly shadow: THREE.Mesh;
  readonly body: THREE.Mesh;
  readonly rig: Rig;
  readonly deform: Deform;
  readonly faceParams = new FaceParams();
  readonly arms: [Arm, Arm];
  readonly expr: Expression = {
    mouth: 0,
    smile: 0.6,
    happy: false,
    star: false,
    blush: 0.55,
    lookX: 0,
    lookY: 0,
    closed: false,
    wink: 0,
    glowBelt: 0,
    glowEmblem: 0,
  };
  readonly colBody = new THREE.Color();
  readonly colOutA = new THREE.Color();
  readonly colOutB = new THREE.Color();
  readonly colAcc = new THREE.Color();
  readonly colTrim = new THREE.Color();
  readonly colGlow = new THREE.Color();
  get glowMats(): THREE.MeshStandardMaterial[] {
    return this.dress[this.skinId]?.parts.glowMats ?? [];
  }
  /** Home position on the floor (world). */
  readonly home = new THREE.Vector3();
  /** Current floor offset from home (shuffles). */
  readonly offset = new THREE.Vector2();
  readonly height: number;
  readonly rollR: number;
  readonly rng: Rng;

  private blinkT = 0;
  private blinkDur = 0;
  private nextBlink: number;
  private eyeL = 1;
  private eyeR = 1;
  private mouth = 0;
  private shoulderRest: THREE.Vector3[];
  private tmp = new THREE.Vector3();
  private faceY: number;
  private faceR: number;
  private qa = new THREE.Quaternion();
  private qb = new THREE.Quaternion();
  private eul = new THREE.Euler();

  constructor(
    public look: Look,
    seed: number,
    quality: 'high' | 'low',
  ) {
    this.rng = new Rng(seed);
    const shape = look.shape;
    this.height = shape.height * BODY_H;
    this.deform = new Deform(this.height);
    this.rollR = profileRadius(shape, 0.3) * 0.95;
    this.rig = new Rig(this.rollR * look.scale, 0.9 + 0.3 * look.personality.energy);
    this.nextBlink = this.rng.range(0.5, 4);

    this.faceY = 0.64;
    this.faceR = profileRadius(shape, this.faceY);

    const mat = bodyMaterial({
      base: this.colBody,
      outA: this.colOutA,
      outB: this.colOutB,
      glow: this.colGlow,
      style: look.outfit,
      deform: this.deform,
      face: this.faceParams,
      faceY: this.faceY,
      faceR: this.faceR,
      quality,
    });
    this.body = new THREE.Mesh(bodyGeometry(shape, quality === 'high' ? 56 : 32), mat);
    this.body.frustumCulled = false; // deformed in the shader

    const limbMat = vinyl(this.colBody, quality);
    limbMat.color = this.colBody;
    this.arms = [new Arm(-1, limbMat, shape.width, quality), new Arm(1, limbMat, shape.width, quality)];
    const shoulderU = 0.5;
    const rs = profileRadius(shape, shoulderU);
    const a = 1.32;
    this.shoulderRest = [-1, 1].map((sx) => new THREE.Vector3(sx * rs * Math.sin(a) * 0.96, shoulderU * this.height, rs * Math.cos(a)));

    const accMat = vinyl(this.colAcc, quality, 0.3);
    accMat.color = this.colAcc;
    const dark = vinyl(new THREE.Color(0x17151f), quality, 0.35);
    const trim = vinyl(this.colTrim, quality, 0.3);
    trim.color = this.colTrim;
    this.spin.add(this.body, ...this.arms.map((a) => a.shoulder));
    this.accCtx = {
      shape: { ...shape, height: this.height },
      color: accMat,
      dark,
      trim,
      quality,
      conform: (m) => conformMaterial(m as THREE.MeshPhysicalMaterial, this.deform, quality),
    };
    this.setStyle();
    this.wear('classic');

    this.lower.add(this.spin);
    this.tilt.add(this.lower);
    this.root.add(this.tilt);
    this.lower.position.y = -this.rollR;
    this.root.scale.setScalar(look.scale);

    this.shadow = new THREE.Mesh(
      shadowGeo(),
      new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false, opacity: 0.8 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 1;
  }

  /** Build (once) and show the accessories for a skin. */
  private wear(id: SkinId) {
    if (!this.dress[id]) {
      const group = new THREE.Group();
      const list = id === 'spooky' && this.look.costume ? this.look.costume.accessories : this.look.accessories;
      const parts = buildAccessories(list, {
        ...this.accCtx,
        addShell: (m) => group.add(m),
        anchor: (u, ang, out = 0) => {
          const obj = new THREE.Group();
          this.anchors.push({ obj, u, ang, out, dress: group });
          group.add(obj);
          return obj;
        },
      });
      this.dress[id] = { group, parts };
      this.spin.add(group);
    }
    for (const [k, d] of Object.entries(this.dress)) d.group.visible = k === id;
  }

  /** Change outfit (classic look or the spooky costume). */
  setSkin(id: SkinId) {
    if (id === this.skinId) return;
    this.skinId = id;
    this.wear(id);
    this.setStyle();
    if (this.palette) this.applyPalette(this.palette);
  }

  private get costume() {
    return this.skinId === 'spooky' ? this.look.costume : undefined;
  }

  private setStyle() {
    const o = this.costume?.outfit ?? this.look.outfit;
    this.faceParams.style.set(o.kind, o.pattern, o.emblem, o.beltY);
    this.faceParams.skin.set(this.costume?.kind ?? 0, 0, 0, this.rng.range(0, 6.28));
  }

  /** Recompute this wobbler's colours from the live palette. */
  applyPalette(p: Palette) {
    this.palette = p;
    const cos = this.costume;
    const pick = (v: THREE.Color | number, out: THREE.Color) => {
      if (typeof v !== 'number') return out.copy(v);
      const src = v < 10 ? p.crowd[v] : p.outfit[v - 10];
      out.copy(src);
      if (this.look.jitter) out.offsetHSL(this.look.jitter * 0.02, 0, this.look.jitter * 0.05);
      return out;
    };
    pick(cos?.body ?? this.look.body, this.colBody);
    pick(cos?.outA ?? this.look.outA, this.colOutA);
    pick(cos?.outB ?? this.look.outB, this.colOutB);
    pick(cos?.acc ?? this.look.accColor, this.colAcc);
    pick(cos?.trim ?? this.look.trim, this.colTrim);
    this.colGlow.copy(p.lights[Math.abs(Math.floor(this.look.jitter * 97)) % p.lights.length]);
  }

  placeAt(x: number, z: number, facing: number) {
    this.home.set(x, 0, z);
    this.rig.yaw.x = this.rig.yaw.target = facing;
  }

  update(dt: number) {
    const rig = this.rig;
    rig.step(dt);

    // Rolling: tilt about the bottom sphere centre moves the contact point.
    const R = this.rollR * this.look.scale;
    const rx = -R * rig.tiltZ.x;
    const rz = R * rig.tiltX.x;
    this.root.position.set(this.home.x + this.offset.x + rx, this.home.y + R + rig.y, this.home.z + this.offset.y + rz);
    this.tilt.rotation.set(rig.tiltX.x, 0, rig.tiltZ.x);
    this.spin.rotation.y = rig.yaw.x;

    // Bend is simulated in the tilt frame; rotate into the spun body frame.
    const c = Math.cos(-rig.yaw.x);
    const s = Math.sin(-rig.yaw.x);
    const bx = rig.bendX.x;
    const bz = rig.bendZ.x;
    this.deform.v.set(rig.stretch.x, c * bx - s * bz, s * bx + c * bz, rig.twist.x);

    // Anchors follow the deformed surface.
    const kxz = 1 / Math.sqrt(Math.max(rig.stretch.x, 0.2));
    for (const a of this.anchors) {
      if (!a.dress.visible) continue;
      const top = a.u >= 0.995;
      const r = top ? 0 : profileRadius(this.look.shape, a.u) + a.out;
      this.tmp.set(Math.sin(a.ang) * r, a.u * this.height + (top ? a.out : 0), Math.cos(a.ang) * r);
      this.deform.apply(this.tmp, a.obj.position);
      const sl = this.deform.slope(Math.min(a.u, 1));
      this.qa.setFromEuler(this.eul.set(sl.ax, 0, sl.az));
      this.qb.setFromAxisAngle(Y_AXIS, a.ang + rig.twist.x * a.u);
      a.obj.quaternion.multiplyQuaternions(this.qa, this.qb);
      a.obj.scale.set(kxz, rig.stretch.x, kxz);
    }
    this.arms.forEach((arm, i) => {
      this.deform.apply(this.shoulderRest[i], arm.shoulder.position);
      arm.update(dt);
    });

    // Shadow: shrinks and fades as the wobbler leaves the floor.
    const hop = rig.y;
    const sh = (0.95 * this.look.shape.width * this.look.scale) / (1 + hop * 1.2);
    this.shadow.position.set(this.root.position.x, this.home.y + 0.012, this.root.position.z);
    this.shadow.scale.set(sh, sh, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.75 / (1 + hop * 2.5);

    for (const fn of this.dress[this.skinId]!.parts.animate) fn(this.beatPhase, this.dancing);
    this.updateFace(dt);
  }

  private updateFace(dt: number) {
    const e = this.expr;
    // Blinks.
    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && this.blinkT <= 0) {
      this.blinkDur = this.rng.range(0.1, 0.16);
      this.blinkT = this.blinkDur;
      this.nextBlink = this.rng.range(1.8, 5.5);
    }
    let blink = 1;
    if (this.blinkT > 0) {
      this.blinkT -= dt;
      const t = 1 - this.blinkT / this.blinkDur;
      blink = Math.abs(Math.cos(Math.PI * t));
    }
    const closed = e.closed ? 0 : 1;
    const targetL = Math.min(blink, closed, e.wink === -1 ? 0 : 1);
    const targetR = Math.min(blink, closed, e.wink === 1 ? 0 : 1);
    this.eyeL = approach(this.eyeL, targetL, 30, dt);
    this.eyeR = approach(this.eyeR, targetR, 30, dt);
    this.mouth = approach(this.mouth, e.mouth, e.mouth > this.mouth ? 40 : 22, dt);

    const f = this.faceParams;
    f.face.set(this.eyeL, this.eyeR, clamp(this.mouth), e.smile);
    f.face2.set(e.happy ? 1 : 0, e.star ? 1 : 0, e.blush, e.lookX);
    f.face3.set(e.lookY, e.glowBelt, e.glowEmblem, 1);
    // Candle flicker on top of the music.
    this.clock += dt;
    const t = this.clock + f.skin.w;
    f.skin.z = this.costumeGlow * (0.88 + 0.12 * Math.sin(t * 23) * Math.sin(t * 7.3 + 1));
  }

  dispose() {
    this.body.geometry.dispose();
  }
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

let _shadowGeo: THREE.PlaneGeometry | null = null;
function shadowGeo() {
  return (_shadowGeo ??= new THREE.PlaneGeometry(1, 1));
}
