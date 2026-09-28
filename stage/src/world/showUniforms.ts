/**
 * Uniforms shared by every music-reactive surface (LED wall, booth panel,
 * floor, beams). Updated once per frame by the show.
 */

import * as THREE from 'three';
import type { Music } from '../music';
import type { Palette } from '../theme';

export interface ShowUniforms {
  uTime: { value: number };
  uBands: { value: number[] };
  uBeat: { value: number }; // beat phase 0..1
  uBeatPos: { value: number }; // continuous beats
  uKick: { value: number }; // pulse
  uSnare: { value: number };
  uHat: { value: number };
  uHype: { value: number };
  uBuild: { value: number };
  uDrop: { value: number };
  uVocal: { value: number };
  uPresence: { value: number };
  /** Seconds since each of the last 4 kicks (for floor ripples). */
  uKicks: { value: THREE.Vector4 };
  uLights: { value: THREE.Color[] };
  uBg: { value: THREE.Color };
  uLightMode: { value: number }; // 0 dark theme, 1 light theme
  uInk: { value: number }; // 1 = ink mode (mono light theme)
  /** LED wall programme: current + previous, crossfade. */
  uMode: { value: number };
  uModePrev: { value: number };
  uModeMix: { value: number };
  /** Now-playing marquee: text texture, visibility, text aspect, scroll. */
  uMarquee: { value: THREE.Texture | null };
  uMarqueeMix: { value: number };
  uMarqueeAspect: { value: number };
  uMarqueeScroll: { value: number };
  /** Cover art shown as LED pixels. */
  uArt: { value: THREE.Texture | null };
  uArtMix: { value: number };
  /** Logo (alpha mask) shown now and then on the big wall; aspect w/h. */
  uLogo: { value: THREE.Texture | null };
  uLogoMix: { value: number };
  uLogoAspect: { value: number };
}

export function createShowUniforms(p: Palette): ShowUniforms {
  return {
    uTime: { value: 0 },
    uBands: { value: [0, 0, 0, 0, 0, 0] },
    uBeat: { value: 0 },
    uBeatPos: { value: 0 },
    uKick: { value: 0 },
    uSnare: { value: 0 },
    uHat: { value: 0 },
    uHype: { value: 0 },
    uBuild: { value: 0 },
    uDrop: { value: 0 },
    uVocal: { value: 0 },
    uPresence: { value: 0 },
    uKicks: { value: new THREE.Vector4(99, 99, 99, 99) },
    uLights: { value: p.lights },
    uBg: { value: p.bgDeep },
    uLightMode: { value: 0 },
    uInk: { value: 0 },
    uMode: { value: 0 },
    uModePrev: { value: 0 },
    uModeMix: { value: 1 },
    uMarquee: { value: null },
    uMarqueeMix: { value: 0 },
    uMarqueeAspect: { value: 8 },
    uMarqueeScroll: { value: 0 },
    uArt: { value: null },
    uArtMix: { value: 0 },
    uLogo: { value: null },
    uLogoMix: { value: 0 },
    uLogoAspect: { value: 4 },
  };
}

export function updateShowUniforms(u: ShowUniforms, m: Music, p: Palette, time: number, dt: number) {
  u.uTime.value = time;
  const b = u.uBands.value;
  b[0] = m.sub;
  b[1] = m.bass;
  b[2] = m.lowMid;
  b[3] = m.mid;
  b[4] = m.highMid;
  b[5] = m.high;
  u.uBeat.value = m.beatPhase;
  u.uBeatPos.value = m.beatPos;
  u.uKick.value = m.kickPulse * m.presence;
  u.uSnare.value = m.snarePulse * m.presence;
  u.uHat.value = m.hatPulse * m.presence;
  u.uHype.value = m.hype;
  u.uBuild.value = m.build;
  u.uDrop.value = m.dropPulse;
  u.uVocal.value = m.vocal;
  u.uPresence.value = m.presence;
  const k = u.uKicks.value;
  k.set(k.x + dt, k.y + dt, k.z + dt, k.w + dt);
  u.uLightMode.value = p.light ? 1 : 0;
  u.uInk.value += ((p.ink ? 1 : 0) - u.uInk.value) * Math.min(1, dt * 3);
  u.uModeMix.value = Math.min(1, u.uModeMix.value + dt / 0.8);
}

/** Register a kick for the floor ripple. */
export function pushKick(u: ShowUniforms) {
  const k = u.uKicks.value;
  k.set(0, k.x, k.y, k.z);
}

export function setLedMode(u: ShowUniforms, mode: number) {
  if (mode === u.uMode.value) return;
  u.uModePrev.value = u.uMode.value;
  u.uMode.value = mode;
  u.uModeMix.value = 0;
}

export const SHOW_GLSL = /* glsl */ `
uniform float uTime;
uniform float uBands[6];
uniform float uBeat;
uniform float uBeatPos;
uniform float uKick;
uniform float uSnare;
uniform float uHat;
uniform float uHype;
uniform float uBuild;
uniform float uDrop;
uniform float uVocal;
uniform float uPresence;
uniform vec4 uKicks;
uniform vec3 uLights[6];
uniform vec3 uBg;
uniform float uLightMode;
uniform float uInk;
uniform float uMode;
uniform float uModePrev;
uniform float uModeMix;
uniform sampler2D uMarquee;
uniform float uMarqueeMix;
uniform float uMarqueeAspect;
uniform float uMarqueeScroll;
uniform sampler2D uArt;
uniform float uArtMix;
uniform sampler2D uLogo;
uniform float uLogoMix;
uniform float uLogoAspect;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
vec3 lightAt(float t) {
  // Smoothly cycle through the 6 theme light colours.
  float x = fract(t) * 6.0;
  int i = int(floor(x));
  float f = smoothstep(0.0, 1.0, fract(x));
  vec3 a = uLights[0], b = uLights[1];
  for (int k = 0; k < 6; k++) {
    if (k == i) { a = uLights[k]; b = uLights[(k + 1) - 6 * ((k + 1) / 6)]; }
  }
  return mix(a, b, f);
}
float band(float x) {
  // Interpolate the 6 bands across 0..1.
  float p = clamp(x, 0.0, 1.0) * 5.0;
  int i = int(floor(p));
  float f = fract(p);
  float a = uBands[0], b = uBands[1];
  for (int k = 0; k < 6; k++) {
    if (k == i) { a = uBands[k]; b = uBands[min(k + 1, 5)]; }
  }
  return mix(a, b, f);
}
`;
