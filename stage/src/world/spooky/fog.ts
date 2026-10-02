/**
 * Ground fog: a few drifting layers just above the dance floor. Thickens on
 * builds, billows on drops, and the kick pushes rings through it from the
 * booth. The fog parts around everyone standing in it: a low-res clearance
 * map (rebuilt each frame from their positions) thins every layer near a
 * body, so where a layer passes through a wobbler there is a soft gradient
 * instead of a hard line.
 */

import * as THREE from 'three';
import type { Music } from '../../music';
import type { Palette } from '../../theme';
import { SHOW_GLSL, type ShowUniforms } from '../showUniforms';

const FOG_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/** Clearance map over the floor (world x, z), 0.4 m cells. */
const MASK = { x0: -28, z0: -5, w: 56, d: 34, cell: 0.4 };
const MW = Math.round(MASK.w / MASK.cell);
const MD = Math.round(MASK.d / MASK.cell);
/** How far beyond a body's radius the fog takes to close back in (m). */
const PART = 0.7;
/** Fog left right at a body (a trace reads as haze, not as an edge). */
const FLOOR = 0.05;

/** Something standing in the fog: centre (x, z read live) and body radius. */
export interface FogOccupant {
  pos: THREE.Vector3;
  r: number;
}

const FOG_FRAG = /* glsl */ `
${SHOW_GLSL}
const vec2 MASK_MIN = vec2(${MASK.x0.toFixed(1)}, ${MASK.z0.toFixed(1)});
const vec2 MASK_SIZE = vec2(${MASK.w.toFixed(1)}, ${MASK.d.toFixed(1)});
uniform vec3 uColor;
uniform float uDensity;
uniform float uLayer;
uniform sampler2D uMask;
varying vec3 vW;
float fbm(vec2 p) {
  float a = 0.0, w = 0.5;
  for (int i = 0; i < 4; i++) { a += w * noise2(p); p = p * 2.03 + 17.1; w *= 0.5; }
  return a;
}
void main() {
  vec2 p = vW.xz;
  vec2 drift = vec2(uTime * 0.05, uTime * 0.018) * (1.0 + uLayer * 0.6);
  float n = fbm(p * 0.22 + drift + uLayer * 3.7);
  n *= 0.75 + 0.5 * fbm(p * 0.5 - drift * 1.7);
  // Kick rings pushed out from the booth.
  float d = length(p - vec2(0.0, -4.0));
  float ring = 0.0;
  for (int i = 0; i < 4; i++) {
    float t = uKicks[i];
    ring += smoothstep(1.6, 0.0, abs(d - t * 9.0)) * exp(-t * 1.8);
  }
  float a = smoothstep(0.25, 0.7, n + 0.3 * ring * uPresence) * uDensity;
  // Thin out far away and at the stage front (keeps the deck clean).
  a *= smoothstep(30.0, 14.0, d) * smoothstep(-3.2, -1.5, vW.z);
  // Parted around bodies.
  a *= texture2D(uMask, (p - MASK_MIN) / MASK_SIZE).r;
  vec3 col = uColor * (0.75 + 0.5 * n) + lightAt(p.x * 0.03 + uTime * 0.02) * 0.12 * (0.4 + uHype);
  gl_FragColor = vec4(col, a);
}
`;

export class GroundFog {
  readonly group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];
  private density = 0.4;
  private color = new THREE.Color();
  private mask = new Uint8Array(MW * MD);
  private maskTex = new THREE.DataTexture(this.mask, MW, MD, THREE.RedFormat, THREE.UnsignedByteType);
  /** Who parts the fog (crowd, floor lanterns). */
  readonly occupants: FogOccupant[] = [];

  constructor(
    u: ShowUniforms,
    private p: Palette,
    quality: 'high' | 'low',
  ) {
    this.maskTex.magFilter = this.maskTex.minFilter = THREE.LinearFilter;
    this.maskTex.wrapS = this.maskTex.wrapT = THREE.ClampToEdgeWrapping;
    const geo = new THREE.PlaneGeometry(56, 34, 1, 1);
    geo.rotateX(-Math.PI / 2);
    // Low quality: two layers (each is a big transparent fill).
    (quality === 'high' ? [0.08, 0.22, 0.38, 0.55] : [0.1, 0.32]).forEach((y, i) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...u, uColor: { value: this.color }, uDensity: { value: 0 }, uLayer: { value: i }, uMask: { value: this.maskTex } },
        vertexShader: FOG_VERT,
        fragmentShader: FOG_FRAG,
        transparent: true,
        depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(0, y, 12);
      m.renderOrder = 2;
      this.group.add(m);
      this.mats.push(mat);
    });
  }

  /** Rebuild the clearance map: 1 in open fog, falling to 0 at a body. */
  private updateMask() {
    const m = this.mask;
    m.fill(255);
    const c = MASK.cell;
    for (const o of this.occupants) {
      const reach = o.r + PART;
      const cx = (o.pos.x - MASK.x0) / c;
      const cz = (o.pos.z - MASK.z0) / c;
      const n = Math.ceil(reach / c);
      const i0 = Math.max(0, Math.floor(cx) - n);
      const i1 = Math.min(MW - 1, Math.floor(cx) + n);
      const j0 = Math.max(0, Math.floor(cz) - n);
      const j1 = Math.min(MD - 1, Math.floor(cz) + n);
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          // Texel centres sit at (i + 0.5) cells.
          const d = Math.hypot((i + 0.5 - cx) * c, (j + 0.5 - cz) * c);
          const t = Math.min(1, Math.max(0, (d - o.r * 0.6) / (reach - o.r * 0.6)));
          const v = Math.round(255 * (FLOOR + (1 - FLOOR) * t * t * (3 - 2 * t)));
          const k = j * MW + i;
          if (v < m[k]) m[k] = v;
        }
      }
    }
    this.maskTex.needsUpdate = true;
  }

  update(dt: number, music: Music) {
    this.updateMask();
    const want = 0.58 + 0.4 * music.build + 0.3 * music.calm + 0.8 * music.dropPulse;
    this.density += (want - this.density) * (1 - Math.exp(-dt * (music.dropPulse > 0.3 ? 4 : 0.7)));
    // Pale and cool in the dark; in light themes a soft grey that still reads.
    if (this.p.light) this.color.setRGB(0.55, 0.57, 0.62);
    else this.color.copy(this.p.haze).lerp(new THREE.Color(0.55, 0.6, 0.72), 0.6).multiplyScalar(0.55);
    this.mats.forEach((m, i) => {
      // Upper layers thinner: the fog hugs the floor.
      m.uniforms.uDensity.value = this.density * (this.mats.length > 2 ? [0.6, 0.5, 0.38, 0.26][i] : [0.8, 0.55][i]) * (this.p.light ? 0.6 : 1);
    });
  }
}
