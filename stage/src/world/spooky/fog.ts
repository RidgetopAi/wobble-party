/**
 * Ground fog: a few drifting layers just above the dance floor. Thickens on
 * builds, billows on drops, and the kick pushes rings through it from the
 * booth. Several thin layers rather than one thick one, so where a layer
 * cuts through a wobbler the line is faint.
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

const FOG_FRAG = /* glsl */ `
${SHOW_GLSL}
uniform vec3 uColor;
uniform float uDensity;
uniform float uLayer;
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
  vec3 col = uColor * (0.75 + 0.5 * n) + lightAt(p.x * 0.03 + uTime * 0.02) * 0.12 * (0.4 + uHype);
  gl_FragColor = vec4(col, a);
}
`;

export class GroundFog {
  readonly group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];
  private density = 0.4;
  private color = new THREE.Color();

  constructor(
    u: ShowUniforms,
    private p: Palette,
    quality: 'high' | 'low',
  ) {
    const geo = new THREE.PlaneGeometry(56, 34, 1, 1);
    geo.rotateX(-Math.PI / 2);
    // Low quality: two layers (each is a big transparent fill).
    (quality === 'high' ? [0.08, 0.26, 0.48, 0.74] : [0.12, 0.4]).forEach((y, i) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...u, uColor: { value: this.color }, uDensity: { value: 0 }, uLayer: { value: i } },
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

  update(dt: number, music: Music) {
    const want = 0.48 + 0.4 * music.build + 0.3 * music.calm + 0.8 * music.dropPulse;
    this.density += (want - this.density) * (1 - Math.exp(-dt * (music.dropPulse > 0.3 ? 4 : 0.7)));
    // Pale and cool in the dark; in light themes a soft grey that still reads.
    if (this.p.light) this.color.setRGB(0.55, 0.57, 0.62);
    else this.color.copy(this.p.haze).lerp(new THREE.Color(0.55, 0.6, 0.72), 0.6).multiplyScalar(0.55);
    this.mats.forEach((m, i) => {
      // Upper layers thinner: the fog hugs the floor.
      m.uniforms.uDensity.value = this.density * (this.mats.length > 2 ? [0.55, 0.45, 0.32, 0.2][i] : [0.75, 0.5][i]) * (this.p.light ? 0.6 : 1);
    });
  }
}
