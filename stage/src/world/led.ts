/**
 * LED surfaces: the big wall behind the DJ, the booth front panel and the
 * light columns. One shader, several programmes chosen by the show
 * (uMode): 0 EQ bars, 1 beat tunnel, 2 waveform, 3 calm plasma, 4 checker.
 */

import * as THREE from 'three';
import { SHOW_GLSL, type ShowUniforms } from './showUniforms';

export const LED_MODES = { eq: 0, tunnel: 1, wave: 2, plasma: 3, checker: 4 } as const;

const LED_FRAG = /* glsl */ `
${SHOW_GLSL}
uniform vec2 uRes;       // LED pixel grid
uniform float uGain;
uniform float uSeed;
varying vec2 vUv;

vec3 programme(float mode, vec2 uv) {
  vec2 c = uv - 0.5;
  if (mode < 0.5) {
    // Mirrored EQ bars with peak caps.
    float x = abs(c.x) * 2.0;
    float cols = uRes.x * 0.5;
    float col = floor(x * cols) / cols;
    float h = band(1.0 - col) * (0.35 + 0.65 * uPresence);
    h = h * (0.8 + 0.4 * uKick);
    float bar = step(uv.y, h);
    float cap = step(abs(uv.y - h - 0.03), 0.012);
    vec3 colr = mix(uLights[0], uLights[2], uv.y);
    return colr * bar * (0.35 + 0.65 * uv.y) + vec3(1.0) * cap * 0.8;
  } else if (mode < 1.5) {
    // Tunnel: rings flying outward on the beat.
    float r = length(c * vec2(uRes.x / uRes.y, 1.0));
    float a = atan(c.y, c.x);
    float rings = fract(r * 5.0 - uBeatPos * 0.5);
    float ring = smoothstep(0.35, 0.0, abs(rings - 0.5) - 0.12);
    float spokes = 0.5 + 0.5 * cos(a * 8.0 + uTime * 0.6);
    vec3 colr = lightAt(r * 0.8 - uBeatPos * 0.125);
    return colr * ring * (0.4 + 0.6 * spokes) * (0.5 + 0.8 * uKick + 0.3 * uHype);
  } else if (mode < 2.5) {
    // Waveform ribbons, amplitude from the bands.
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float amp = (0.08 + 0.3 * uBands[i * 2 + 1]) * (0.5 + 0.5 * uPresence);
      float y = 0.5 + amp * sin(uv.x * (6.0 + fi * 5.0) + uTime * (1.5 + fi) + fi * 2.0) * sin(uv.x * 3.14159);
      float d = abs(uv.y - y);
      acc += uLights[i * 2] * smoothstep(0.035, 0.0, d);
    }
    return acc * (0.8 + 0.5 * uSnare);
  } else if (mode < 3.5) {
    // Calm plasma in the palette.
    float n = noise2(uv * vec2(3.0, 2.0) + vec2(uTime * 0.05, -uTime * 0.04));
    float n2 = noise2(uv * vec2(5.0, 3.0) - vec2(uTime * 0.07, uTime * 0.02));
    vec3 colr = lightAt(n * 0.6 + n2 * 0.4 + uTime * 0.01);
    return colr * (0.18 + 0.35 * n2) * (0.6 + 0.6 * uVocal);
  } else {
    // Checker slam on each beat.
    vec2 g = floor(uv * vec2(8.0, 4.0));
    float on = mod(g.x + g.y + floor(uBeatPos), 2.0);
    vec3 colr = uLights[int(mod(g.x + floor(uBeatPos), 6.0))];
    return colr * on * (0.3 + 0.9 * exp(-uBeat * 4.0));
  }
}

void main() {
  vec2 cell = fract(vUv * uRes);
  vec2 uv = (floor(vUv * uRes) + 0.5) / uRes;
  float dotMask = smoothstep(0.5, 0.32, length(cell - 0.5));
  vec3 a = programme(uMode, uv);
  vec3 b = programme(uModePrev, uv);
  vec3 col = mix(b, a, smoothstep(0.0, 1.0, uModeMix));
  col += uLights[1] * 0.05 * uDrop;
  vec3 base = uBg * 0.6 + 0.012;
  gl_FragColor = vec4((base + col * uGain) * (0.25 + 0.75 * dotMask), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const LED_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function ledMaterial(u: ShowUniforms, res: [number, number], gain = 2.2, seed = 0): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { ...u, uRes: { value: new THREE.Vector2(...res) }, uGain: { value: gain }, uSeed: { value: seed } },
    vertexShader: LED_VERT,
    fragmentShader: LED_FRAG,
    toneMapped: true,
  });
}

/** The dance floor: glossy tiles whose emission is patterned by the music. */
export function floorMaterial(u: ShowUniforms, base: THREE.Color): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.3, metalness: 0.2 });
  mat.color = base;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${SHOW_GLSL}\nvarying vec3 vWorldP;`)
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
        {
          vec2 p = vWorldP.xz;
          vec2 id = floor(p / 1.2);
          vec2 f = fract(p / 1.2);
          float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
          float tile = smoothstep(0.02, 0.06, edge);
          float gap = 1.0 - smoothstep(0.0, 0.03, edge);
          float h = hash12(id);
          vec3 tc = uLights[int(mod(h * 6.0 + floor(uBeatPos / 4.0), 6.0))];
          // Kick ripples from the booth.
          float d = length(p - vec2(0.0, -4.0));
          float ripple = 0.0;
          for (int i = 0; i < 4; i++) {
            float t = uKicks[i];
            float r = t * 11.0;
            ripple += smoothstep(1.4, 0.0, abs(d - r)) * exp(-t * 2.2);
          }
          float sparkle = step(0.965, hash12(id + floor(uTime * 7.0))) * uHat;
          float checker = mod(id.x + id.y + floor(uBeatPos), 2.0) * smoothstep(0.75, 1.0, uHype) * (0.2 + 0.8 * exp(-uBeat * 5.0));
          float glow = (ripple * 0.9 + sparkle * 1.0 + checker * 0.35) * uPresence + 0.015;
          glow *= smoothstep(26.0, 6.0, d);
          totalEmissiveRadiance += tc * glow * tile * 0.7;
          totalEmissiveRadiance += uLights[0] * gap * 0.05 * (0.4 + uHype);
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'wobble-floor';
  return mat;
}
