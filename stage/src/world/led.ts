/**
 * LED surfaces: the big wall behind the DJ, the booth front panel and the
 * light columns. One shader, several programmes chosen by the show
 * (uMode): 0 EQ bars, 1 beat tunnel, 2 waveform, 3 calm plasma, 4 checker,
 * and for the spooky skin 5 moonlit graveyard, 6 eyes in the dark (the
 * checker turns to skulls and lightning can strike the wall).
 */

import * as THREE from 'three';
import { SHOW_GLSL, type ShowUniforms } from './showUniforms';

export const LED_MODES = { eq: 0, tunnel: 1, wave: 2, plasma: 3, checker: 4, moon: 5, eyes: 6 } as const;

const LED_FRAG = /* glsl */ `
${SHOW_GLSL}
uniform vec2 uRes;       // LED pixel grid
uniform float uGain;
uniform float uSeed;
uniform float uLogoHost; // 1 on the surface that shows logos
varying vec2 vUv;

float segD(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

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
  } else if (mode < 4.5) {
    // Checker slam on each beat (skulls in the spooky skin).
    vec2 g = floor(uv * vec2(8.0, 4.0));
    float on = mod(g.x + g.y + floor(uBeatPos), 2.0);
    vec3 colr = uLights[int(mod(g.x + floor(uBeatPos), 6.0))];
    if (uSkin > 0.5) {
      vec2 f = fract(uv * vec2(8.0, 4.0)) - 0.5;
      float skull = min(length(f - vec2(0.0, 0.08)) - 0.3, max(abs(f.x) - 0.16, abs(f.y + 0.22) - 0.12));
      float holes = min(length(vec2(abs(f.x) - 0.12, f.y - 0.05)) - 0.09, max(abs(f.x) - 0.03, abs(f.y + 0.1) - 0.04));
      on *= step(skull, 0.0) * step(0.0, holes);
    }
    return colr * on * (0.3 + 0.9 * exp(-uBeat * 4.0));
  } else if (mode < 5.5) {
    // Moonlit graveyard: big moon, drifting clouds, bats, tombstones.
    float asp = uRes.x / uRes.y;
    vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
    vec3 sky = mix(uLights[2] * 0.04, uLights[0] * 0.14, uv.y);
    vec2 mp = p - vec2(asp * 0.2, 0.1);
    float md = length(mp);
    vec3 moonCol = mix(vec3(1.0, 0.95, 0.8), uLights[1] * 0.4 + 0.6, 0.25) * (0.8 + 0.2 * noise2(mp * 9.0 + 3.0)) * (0.95 + 0.2 * uKick);
    float moon = smoothstep(0.25, 0.235, md);
    vec3 col = sky + moonCol * moon * 0.9 + moonCol * 0.3 * exp(-max(md - 0.24, 0.0) * 8.0) * (1.0 - moon) * (0.6 + 0.6 * uVocal);
    float cl = noise2(vec2(p.x * 2.0 - uTime * 0.05, p.y * 5.0)) * noise2(vec2(p.x * 3.5 - uTime * 0.08, p.y * 7.0 + 2.0));
    col = mix(col, sky * 1.5 + 0.03, smoothstep(0.16, 0.4, cl) * smoothstep(-0.15, 0.25, p.y) * 0.85);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float t = fract(uTime * (0.03 + 0.01 * fi) + fi * 0.37);
      vec2 bp = (p - vec2((t - 0.5) * asp * 1.3, 0.05 + 0.18 * sin(t * 6.28 + fi * 2.0))) / 0.09;
      bp.y -= abs(bp.x) * 0.6 * sin(uTime * 12.0 + fi * 3.0);
      float b = min(max(abs(bp.x) - 1.0, abs(bp.y) - 0.3 + 0.2 * abs(bp.x)), length(bp) - 0.35);
      col = mix(col, vec3(0.0), step(b, 0.0));
    }
    float ground = -0.34 + 0.04 * sin(p.x * 2.3 + 1.0) + 0.02 * sin(p.x * 5.1);
    float cell = p.x / 0.36;
    float h = hash12(vec2(floor(cell), 3.0));
    vec2 sp = vec2((fract(cell) - 0.5) * 0.36, p.y - ground);
    float sh = 0.1 + 0.07 * h;
    float stone = h > 0.3 ? min(max(abs(sp.x) - 0.06, sp.y - sh), length(sp - vec2(0.0, sh)) - 0.06) : 1.0;
    if (h > 0.82) stone = min(max(abs(sp.x) - 0.018, abs(sp.y - 0.12) - 0.13), max(abs(sp.x) - 0.07, abs(sp.y - 0.17) - 0.018));
    float sil = max(step(p.y, ground), step(stone, 0.0));
    col = mix(col, vec3(0.006), sil);
    col += uLights[3] * 0.12 * smoothstep(0.1, 0.0, abs(p.y - ground - 0.04)) * (0.6 + 0.4 * uBands[1]);
    return col;
  } else {
    // Eyes in the dark: pairs open, glance with the beat, blink, close.
    float asp = uRes.x / uRes.y;
    vec2 g = vec2(uv.x * asp, uv.y) * 2.2;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash12(id + 7.0);
    float h2 = hash12(id + 19.0);
    float life = fract(uBeatPos / 16.0 + h * 7.0);
    float on = step(0.35, h) * smoothstep(0.0, 0.06, life) * smoothstep(0.75, 0.6, life);
    float blink = step(0.06, abs(fract(uBeatPos * 0.125 + h2) - 0.5));
    f -= vec2(h - 0.5, h2 - 0.5) * 0.35;
    f.x -= sin(uBeatPos * 0.785 + h * 6.0) * 0.03;
    float open = (0.25 + 0.75 * on) * blink;
    float eye = 1e3;
    for (int i = 0; i < 2; i++) {
      vec2 e = f - vec2(i == 0 ? -0.14 : 0.14, 0.0);
      eye = min(eye, length(e / vec2(0.1, max(0.005, 0.06 * open))) - 1.0);
    }
    vec3 colr = lightAt(h * 0.9 + 0.1) * (0.7 + 0.8 * uKick + 0.4 * uHype);
    return colr * step(eye, 0.0) * on;
  }
}

void main() {
  vec2 cell = fract(vUv * uRes);
  vec2 uv = (floor(vUv * uRes) + 0.5) / uRes;
  float dotMask = smoothstep(0.5, 0.32, length(cell - 0.5));
  vec3 a = programme(uMode, uv);
  vec3 b = programme(uModePrev, uv);
  vec3 col = mix(b, a, smoothstep(0.0, 1.0, uModeMix));
  // Lightning: a jagged bolt down the wall and the sky lighting up behind it.
  if (uLightning > 0.001) {
    float asp = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * asp, uv.y);
    vec2 a = vec2((0.2 + 0.6 * hash12(vec2(uLightSeed, 0.5))) * asp, 1.05);
    float d = 1e3;
    for (int i = 0; i < 7; i++) {
      vec2 b = a + vec2((hash12(vec2(uLightSeed, float(i) + 1.0)) - 0.5) * 0.35, -0.16);
      d = min(d, segD(p, a, b));
      a = b;
    }
    float bolt = smoothstep(0.035, 0.0, d);
    col = col * (1.0 - 0.5 * uLightning) + vec3(0.25, 0.3, 0.45) * uLightning * 0.7 + vec3(0.9, 0.95, 1.2) * bolt * uLightning * 2.0;
  }
  // Cover art, square and centred, as LED pixels.
  if (uArtMix > 0.001) {
    float wa = uRes.x / uRes.y;
    vec2 au = vec2((uv.x - 0.5) * wa + 0.5, uv.y);
    float inside = step(0.0, au.x) * step(au.x, 1.0);
    vec3 art = texture2D(uArt, au).rgb;
    col = mix(col, art * (0.9 + 0.3 * uKick), uArtMix * inside);
  }
  // Logo, fitted and sat a little high (clear of the DJ's head), lit in the
  // palette. Four taps per LED so thin strokes don't flicker between pixels.
  if (uLogoMix > 0.001 && uLogoHost > 0.5) {
    float wa = uRes.x / uRes.y;
    float lw = min(0.88, 0.76 * uLogoAspect / wa);
    float lh = lw * wa / uLogoAspect;
    vec2 lu = (uv - vec2(0.5, 0.56)) / vec2(lw, lh) + 0.5;
    vec2 d = 0.25 / (uRes * vec2(lw, lh));
    float a = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 q = lu + d * vec2(i == 0 || i == 2 ? -1.0 : 1.0, i < 2 ? -1.0 : 1.0);
      float inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
      a += texture2D(uLogo, q).a * inside * 0.25;
    }
    a = smoothstep(0.2, 0.7, a);
    vec3 lc = (lightAt(uv.x * 0.6 + uv.y * 0.25 - uTime * 0.06) * 1.3 + 0.3) * (0.85 + 0.4 * uKick);
    col = mix(col * (1.0 - 0.8 * uLogoMix), lc, a * uLogoMix);
  }
  // Now-playing marquee across the middle band.
  if (uMarqueeMix > 0.001) {
    float band = 0.42;
    float tv = (uv.y - (0.5 - band / 2.0)) / band;
    if (tv > 0.0 && tv < 1.0) {
      float wa = uRes.x / uRes.y;
      float tu = uv.x * wa / (band * uMarqueeAspect) + uMarqueeScroll;
      float a = texture2D(uMarquee, vec2(fract(tu), tv)).a;
      vec3 tc = lightAt(uv.x * 0.5 + uTime * 0.05) * 1.3 + 0.25;
      col = mix(col * (1.0 - 0.75 * uMarqueeMix), tc, a * uMarqueeMix);
    } else {
      col *= 1.0 - 0.6 * uMarqueeMix;
    }
  }
  col += uLights[1] * 0.05 * uDrop;
  vec3 base = uBg * 0.6 + 0.012;
  vec3 lit = (base + col * uGain) * (0.25 + 0.75 * dotMask);
  // Ink mode: e-paper LEDs — dark dots on a pale panel.
  float lum = smoothstep(0.015, 0.14, dot(col * uGain, vec3(0.3, 0.59, 0.11)));
  vec3 paper = mix(vec3(0.86), vec3(0.04), lum * dotMask);
  gl_FragColor = vec4(mix(lit, paper, uInk), 1.0);
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

export function ledMaterial(u: ShowUniforms, res: [number, number], gain = 2.2, seed = 0, logos = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...u,
      uRes: { value: new THREE.Vector2(...res) },
      uGain: { value: gain },
      uSeed: { value: seed },
      uLogoHost: { value: logos ? 1 : 0 },
    },
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
          // Ink mode draws the pattern by darkening tiles instead of lighting them.
          totalEmissiveRadiance += tc * glow * tile * 0.7 * (1.0 - uInk);
          totalEmissiveRadiance += uLights[0] * gap * 0.05 * (0.4 + uHype) * (1.0 - uInk);
          diffuseColor.rgb *= 1.0 - uInk * clamp(glow * 1.6 * tile + gap * 0.5, 0.0, 0.85);
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'wobble-floor';
  return mat;
}
