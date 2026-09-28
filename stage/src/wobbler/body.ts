/**
 * Wobbler body: weighted-egg lathe geometry + a physical "vinyl toy" material
 * whose shaders add
 *   - deformation (volume-preserving squash/stretch, jelly bend, twist), and
 *   - a procedural face and outfit drawn with SDFs (crisp at any distance).
 *
 * `deformPoint` mirrors the vertex deformation on the CPU so rigid parts
 * (arms, hats, glasses) stay glued to the deforming surface.
 */

import * as THREE from 'three';

export const BODY_H = 1.0;

export interface BodyShape {
  height: number;
  width: number;
  /** Bottom-heaviness: 0 = symmetric, 0.5 = very pear shaped. */
  pear: number;
  /** Superellipse exponent; >2 = boxier sides. */
  boxy: number;
}

/** Radius of the body profile at normalised height u (0 bottom .. 1 top). */
export function profileRadius(shape: BodyShape, u: number): number {
  const x = Math.abs(2 * u - 1);
  const base = Math.pow(Math.max(0, 1 - Math.pow(x, shape.boxy)), 1 / shape.boxy);
  return shape.width * 0.385 * base * (1 + shape.pear * (0.5 - u));
}

export function bodyGeometry(shape: BodyShape, segments = 56): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    // Denser sampling near the poles keeps the silhouette smooth.
    const t = i / n;
    const u = 0.5 - 0.5 * Math.cos(Math.PI * t);
    pts.push(new THREE.Vector2(i === 0 || i === n ? 0 : profileRadius(shape, u), u * shape.height));
  }
  const g = new THREE.LatheGeometry(pts, segments, Math.PI, Math.PI * 2);
  g.computeVertexNormals();
  return g;
}

/** Shared deformation state for one wobbler (uniform value object). */
export class Deform {
  /** x: stretch (y scale), y: bendX, z: bendZ, w: twist (radians at top). */
  readonly v = new THREE.Vector4(1, 0, 0, 0);
  constructor(public height: number) {}

  apply(p: THREE.Vector3, out = p): THREE.Vector3 {
    const { x: s, y: bx, z: bz, w: twist } = this.v;
    const u = Math.min(1, Math.max(0, p.y / this.height));
    const xz = 1 / Math.sqrt(Math.max(s, 0.2));
    const k = 1 + (xz - 1) * smooth(0, 0.35, u);
    let x = p.x * k;
    let z = p.z * k;
    const a = twist * u;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const rx = c * x - sn * z;
    const rz = sn * x + c * z;
    x = rx + bx * u * u * this.height;
    z = rz + bz * u * u * this.height;
    return out.set(x, p.y * s, z);
  }

  /** Surface tilt (radians about z and x) of the bent body at height u. */
  slope(u: number): { ax: number; az: number } {
    const { y: bx, z: bz, x: s } = this.v;
    return { az: -Math.atan((2 * u * bx) / s), ax: Math.atan((2 * u * bz) / s) };
  }
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export const enum Emblem {
  None = 0,
  Heart = 1,
  Star = 2,
  Bolt = 3,
  Note = 4,
  W = 5,
  Skull = 6,
  Ring = 7,
}

export const enum Pattern {
  Solid = 0,
  Stripes = 1,
  Dots = 2,
  Checker = 3,
  Zigzag = 4,
}

export interface OutfitStyle {
  /** 0 none, 1 pants+belt, 2 pants+belt+top band, 3 belt only, 4 overalls */
  kind: number;
  pattern: Pattern;
  emblem: Emblem;
  beltY: number;
}

/** Per-wobbler uniforms for the face and outfit. */
export class FaceParams {
  /** x: eye open L, y: eye open R, z: mouth open, w: smile */
  readonly face = new THREE.Vector4(1, 1, 0, 0.6);
  /** x: happy eyes (^^), y: star eyes, z: blush, w: look x */
  readonly face2 = new THREE.Vector4(0, 0, 0.6, 0);
  /** x: look y, y: belt glow, z: emblem glow, w: eye shine */
  readonly face3 = new THREE.Vector4(0, 0, 0, 1);
}

const GLSL_COMMON = /* glsl */ `
uniform vec4 uDeform;
uniform float uBodyH;
varying vec3 vObj;
`;

const GLSL_DEFORM = /* glsl */ `
vec3 wpDeform(vec3 p) {
  float u = clamp(p.y / uBodyH, 0.0, 1.0);
  float s = uDeform.x;
  float xz = inversesqrt(max(s, 0.2));
  p.xz *= mix(1.0, xz, smoothstep(0.0, 0.35, u));
  float a = uDeform.w * u;
  float c = cos(a), sn = sin(a);
  p.xz = vec2(c * p.x - sn * p.z, sn * p.x + c * p.z);
  p.y *= s;
  p.xz += uDeform.yz * u * u * uBodyH;
  return p;
}
vec3 wpDeformNormal(vec3 n, vec3 p) {
  float u = clamp(p.y / uBodyH, 0.0, 1.0);
  float s = uDeform.x;
  float xz = mix(1.0, inversesqrt(max(s, 0.2)), smoothstep(0.0, 0.35, u));
  n = vec3(n.x / xz, n.y / s, n.z / xz);
  float a = uDeform.w * u;
  float c = cos(a), sn = sin(a);
  n.xz = vec2(c * n.x - sn * n.z, sn * n.x + c * n.z);
  n.y -= dot(n.xz, uDeform.yz) * 2.0 * u / s;
  return normalize(n);
}
`;

const GLSL_FACE = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uOutA;
uniform vec3 uOutB;
uniform vec3 uGlowCol;
uniform vec4 uStyle;   // kind, pattern, emblem, beltY
uniform vec4 uFace;    // eyeL, eyeR, mouthOpen, smile
uniform vec4 uFace2;   // happy, star, blush, lookX
uniform vec4 uFace3;   // lookY, beltGlow, emblemGlow, shine
uniform float uFaceY;  // eye height (normalised)
uniform float uFaceR;  // body radius at the eyes

float sdEllipse(vec2 p, vec2 r) {
  // Cheap ellipse distance (good near the boundary).
  float k = length(p / r);
  return (k - 1.0) * min(r.x, r.y);
}
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float sdHeart(vec2 p, float s) {
  p /= s;
  p.x = abs(p.x);
  p.y += 0.6;
  float d;
  if (p.y + p.x > 1.0) d = sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  else d = sqrt(min(dot(p - vec2(0.0, 1.0), p - vec2(0.0, 1.0)), dot(p - 0.5 * max(p.x + p.y, 0.0), p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
  return d * s;
}
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdBolt(vec2 p, float s) {
  p /= s;
  float d = sdSeg(p, vec2(0.25, 0.9), vec2(-0.2, 0.05));
  d = min(d, sdSeg(p, vec2(-0.2, 0.05), vec2(0.2, 0.05)));
  d = min(d, sdSeg(p, vec2(0.2, 0.05), vec2(-0.25, -0.9)));
  return (d - 0.14) * s;
}
float sdNote(vec2 p, float s) {
  p /= s;
  float d = sdEllipse(p - vec2(-0.25, -0.55), vec2(0.32, 0.24));
  d = min(d, sdBox(p - vec2(0.02, 0.1), vec2(0.07, 0.65)));
  d = min(d, sdSeg(p, vec2(0.02, 0.72), vec2(0.45, 0.35)) - 0.09);
  return d * s;
}
float sdW(vec2 p, float s) {
  p /= s;
  p.x = abs(p.x);
  float d = sdSeg(p, vec2(0.7, 0.6), vec2(0.42, -0.6));
  d = min(d, sdSeg(p, vec2(0.42, -0.6), vec2(0.0, 0.25)));
  return (d - 0.14) * s;
}
float sdSkull(vec2 p, float s) {
  p /= s;
  float d = sdCircle(p - vec2(0.0, 0.12), 0.62);
  d = min(d, sdBox(p - vec2(0.0, -0.45), vec2(0.34, 0.2)));
  float holes = min(sdCircle(vec2(abs(p.x), p.y) - vec2(0.25, 0.1), 0.17), sdBox(p - vec2(0.0, -0.18), vec2(0.06, 0.08)));
  return max(d, -holes) * s;
}
float fill(float d, float aa) { return 1.0 - smoothstep(-aa, aa, d); }

vec3 wobbleSurface(vec3 base, out float rough, out vec3 glow) {
  rough = 0.0;
  glow = vec3(0.0);
  float H = uBodyH;
  float u = vObj.y / H;
  float r = length(vObj.xz);
  float ang = atan(vObj.x, vObj.z);
  vec2 q = vec2(ang * r, vObj.y);           // surface coords, world units
  float aa = max(fwidth(q.x), fwidth(q.y)) * 0.9 + 1e-4;
  vec3 col = base;

  // ---------------- outfit
  float kind = uStyle.x;
  float beltY = uStyle.w * H;
  float belt = 0.035 * H;
  if (kind > 0.5 && kind < 3.5 && kind != 3.0) {
    if (vObj.y < beltY - belt) {
      vec3 pc = uOutA;
      float pat = uStyle.y;
      vec2 pq = q / H;
      if (pat > 0.5 && pat < 1.5) pc = mix(pc, uOutB, step(0.5, fract(pq.y * 9.0)));
      else if (pat > 1.5 && pat < 2.5) pc = mix(pc, uOutB, fill(length(fract(pq * 9.0) - 0.5) - 0.22, 0.06));
      else if (pat > 2.5 && pat < 3.5) pc = mix(pc, uOutB, step(0.5, fract(floor(pq.x * 8.0) * 0.5 + floor(pq.y * 8.0) * 0.5)));
      else if (pat > 3.5) pc = mix(pc, uOutB, step(abs(fract(pq.y * 7.0 + abs(fract(pq.x * 6.0) - 0.5)) - 0.5), 0.16));
      col = pc;
    }
  }
  if (kind > 1.5 && kind < 2.5) {
    float topEnd = beltY + 0.16 * H;
    if (vObj.y > beltY && vObj.y < topEnd) col = mix(uOutA, base, 0.25);
    // collar line
    col = mix(col, uOutB, fill(abs(vObj.y - topEnd) - 0.012 * H, aa));
  }
  if (kind > 3.5) {
    // overalls: bib in front, straps
    float bib = sdBox(q - vec2(0.0, beltY + 0.1 * H), vec2(0.13, 0.1) * H);
    if (vObj.y < beltY || bib < 0.0) col = uOutA;
    float strap = min(abs(abs(q.x) - 0.1 * H) - 0.018 * H, 1.0);
    if (vObj.y > beltY && vObj.y < beltY + 0.3 * H && abs(ang) < 1.4) col = mix(col, uOutA, fill(strap, aa));
  }
  if (kind > 0.5) {
    float b = abs(vObj.y - beltY) - belt * 0.5;
    float bm = fill(b, aa);
    col = mix(col, uOutB, bm);
    glow += uGlowCol * bm * uFace3.y;
    // buckle
    float buckle = sdBox(q - vec2(0.0, beltY), vec2(0.045, 0.028) * H);
    float bk = fill(abs(buckle) - 0.006 * H, aa) * step(0.0, cos(ang));
    col = mix(col, vec3(0.95, 0.85, 0.45), bk);
    glow += uGlowCol * bk * uFace3.y * 0.5;
  }

  // ---------------- emblem (chest)
  float em = uStyle.z;
  if (em > 0.5 && cos(ang) > 0.0) {
    // Shirts carry the emblem on the chest; otherwise it sits on the belly.
    bool chest = kind > 1.5 && kind < 2.5;
    vec2 ep = q - vec2(0.0, (chest ? uStyle.w + 0.075 : uStyle.w - 0.12) * H);
    float s = (chest ? 0.058 : 0.07) * H;
    float d = 1e3;
    if (em < 1.5) d = sdHeart(ep, s * 1.2);
    else if (em < 2.5) d = sdStar5(ep, s * 1.1, 0.45);
    else if (em < 3.5) d = sdBolt(ep, s);
    else if (em < 4.5) d = sdNote(ep, s);
    else if (em < 5.5) d = sdW(ep, s);
    else if (em < 6.5) d = sdSkull(ep, s * 0.9);
    else d = abs(sdCircle(ep, s * 0.8)) - s * 0.18;
    float m = fill(d, aa);
    vec3 ec = kind > 0.5 ? uOutB : uOutA;
    float lc = dot(col, vec3(0.3, 0.59, 0.11));
    if (abs(dot(ec, vec3(0.3, 0.59, 0.11)) - lc) < 0.18) ec = lc > 0.35 ? vec3(0.04, 0.03, 0.06) : vec3(1.0, 0.97, 0.9);
    col = mix(col, ec, m);
    glow += ec * m * uFace3.z;
  }

  // ---------------- face
  if (cos(ang) > 0.1) {
    float R = uFaceR;
    vec2 f = (q - vec2(0.0, uFaceY * H)) / R;
    vec2 look = vec2(uFace2.w, uFace3.x) * 0.05;
    // blush
    for (int i = 0; i < 2; i++) {
      float sx = i == 0 ? -1.0 : 1.0;
      float bl = sdEllipse(f - vec2(sx * 0.56, -0.2), vec2(0.16, 0.095));
      float bm = (1.0 - smoothstep(-0.03, 0.05, bl)) * uFace2.z;
      col = mix(col, vec3(1.0, 0.36, 0.48), bm * 0.6);
    }
    // eyes
    for (int i = 0; i < 2; i++) {
      float sx = i == 0 ? -1.0 : 1.0;
      float open = i == 0 ? uFace.x : uFace.y;
      vec2 e = f - vec2(sx * 0.32, 0.0);
      float eyeInk = 0.0;
      float shine = 0.0;
      if (uFace2.y > 0.5) {
        // star eyes
        float st = sdStar5(e * vec2(1.0, -1.0) - look, 0.2, 0.5);
        eyeInk = fill(st, aa / R);
        col = mix(col, vec3(1.0, 0.86, 0.3), eyeInk);
        glow += vec3(1.0, 0.8, 0.3) * eyeInk * 0.6;
        eyeInk = 0.0;
      } else if (uFace2.x > 0.5 || open < 0.2) {
        // happy ^^ (or closed-content arcs when blinking)
        float up = uFace2.x > 0.5 ? 1.0 : -1.0;
        vec2 a = e - vec2(0.0, -0.02 * up);
        float arc = abs(length(a - vec2(0.0, -0.11 * up)) - 0.125) - 0.03;
        arc = max(arc, -a.y * up - 0.0);
        eyeInk = fill(arc, aa / R);
      } else {
        vec2 ep = e - look;
        float d = sdEllipse(ep, vec2(0.145, 0.21 * open));
        eyeInk = fill(d, aa / R);
        shine = fill(sdCircle(ep - vec2(0.05, 0.085 * open), 0.058), aa / R) + fill(sdCircle(ep - vec2(-0.045, -0.08 * open), 0.026), aa / R);
        shine *= step(0.45, open) * uFace3.w;
      }
      col = mix(col, vec3(0.02, 0.015, 0.03), eyeInk);
      col = mix(col, vec3(1.0), clamp(shine, 0.0, 1.0));
      rough = max(rough, eyeInk);
    }
    // mouth
    vec2 m = f - vec2(0.0, -0.33);
    float open = uFace.z;
    float smile = uFace.w;
    m.y -= smile * 1.6 * m.x * m.x; // corners up = smile
    if (open < 0.06) {
      float w = 0.15;
      float arc = sdSeg(m, vec2(-w, 0.0), vec2(w, 0.0)) - 0.026;
      col = mix(col, vec3(0.08, 0.02, 0.04), fill(arc, aa / R));
    } else {
      vec2 mr = vec2(0.14 + 0.04 * open, 0.025 + 0.2 * open);
      vec2 mc = m + vec2(0.0, mr.y * 0.55);
      float d = sdEllipse(mc, mr);
      d = max(d, m.y - 0.012);                  // flat-ish top lip
      float mm = fill(d, aa / R);
      float tongue = fill(sdCircle(mc - vec2(0.0, -mr.y * 0.95), mr.x * 0.75), aa / R) * mm;
      col = mix(col, vec3(0.28, 0.03, 0.07), mm);
      col = mix(col, vec3(0.95, 0.38, 0.45), tongue);
      rough = max(rough, mm * 0.5);
    }
  }
  return col;
}
`;

export interface BodyMaterialOptions {
  base: THREE.Color;
  outA: THREE.Color;
  outB: THREE.Color;
  glow: THREE.Color;
  style: OutfitStyle;
  deform: Deform;
  face: FaceParams;
  faceY: number;
  faceR: number;
  quality: 'high' | 'low';
}

export function bodyMaterial(o: BodyMaterialOptions): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.0,
    clearcoat: o.quality === 'high' ? 1.0 : 0.0,
    clearcoatRoughness: 0.14,
    sheen: 0.0,
  });
  const uniforms = {
    uDeform: { value: o.deform.v },
    uBodyH: { value: o.deform.height },
    uBase: { value: o.base },
    uOutA: { value: o.outA },
    uOutB: { value: o.outB },
    uGlowCol: { value: o.glow },
    uStyle: { value: new THREE.Vector4(o.style.kind, o.style.pattern, o.style.emblem, o.style.beltY) },
    uFace: { value: o.face.face },
    uFace2: { value: o.face.face2 },
    uFace3: { value: o.face.face3 },
    uFaceY: { value: o.faceY },
    uFaceR: { value: o.faceR },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${GLSL_COMMON}\n${GLSL_DEFORM}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\nobjectNormal = wpDeformNormal(objectNormal, position);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;\ntransformed = wpDeform(position);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_COMMON}\n${GLSL_FACE}\nfloat wpRough; vec3 wpGlow;`)
      .replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.rgb = wobbleSurface(uBase, wpRough, wpGlow);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.08, wpRough);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += wpGlow;`);
  };
  // All wobblers share one program; uniforms differ per material instance.
  mat.customProgramCacheKey = () => 'wobbler-body-' + o.quality;
  return mat;
}

/** A copy of `src` that deforms with the body (for conforming accessory shells). */
export function conformMaterial(src: THREE.MeshPhysicalMaterial, deform: Deform, quality: 'high' | 'low'): THREE.MeshPhysicalMaterial {
  const m = src.clone();
  m.color = src.color; // share the live colour
  const uniforms = { uDeform: { value: deform.v }, uBodyH: { value: deform.height } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${GLSL_COMMON}\n${GLSL_DEFORM}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\nobjectNormal = wpDeformNormal(objectNormal, position);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;\ntransformed = wpDeform(position);`);
  };
  m.customProgramCacheKey = () => 'wobbler-conform-' + quality;
  return m;
}

/** Plain vinyl for arms/hands/accessories in the body colour. */
export function vinyl(color: THREE.Color, quality: 'high' | 'low', rough = 0.32): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    clearcoat: quality === 'high' ? 1 : 0,
    clearcoatRoughness: 0.15,
  });
}
