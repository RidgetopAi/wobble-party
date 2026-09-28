/**
 * Omarchy theme -> party palette.
 *
 * The theme drives the world: light rig, lasers, LED walls, floor, haze and
 * the crowd's vinyl colours. The DJ and hero wobblers keep their own identity.
 * Monochrome themes (e.g. vantablack) become a black/silver club; light themes
 * lift the venue. Theme changes cross-fade: every consumer holds references
 * to the Color objects below, which are lerped in place.
 */

import * as THREE from 'three';
import type { ThemeMessage } from './feed';

export const N_LIGHTS = 6;
export const N_CROWD = 10;

export interface Palette {
  name: string;
  light: boolean; // light-mode theme
  mono: boolean; // theme has (almost) no saturated colours
  bg: THREE.Color;
  bgDeep: THREE.Color;
  fg: THREE.Color;
  accent: THREE.Color;
  neon: THREE.Color;
  neon2: THREE.Color;
  metal: THREE.Color;
  floor: THREE.Color;
  haze: THREE.Color;
  lights: THREE.Color[];
  crowd: THREE.Color[];
  outfit: THREE.Color[];
}

const hsl = { h: 0, s: 0, l: 0 };

function parse(hex: string | undefined, fallback: string): THREE.Color {
  const c = new THREE.Color();
  try {
    c.setStyle(hex && /^#?[0-9a-f]{6}$/i.test(hex.replace('#', '')) ? (hex.startsWith('#') ? hex : '#' + hex) : fallback);
  } catch {
    c.setStyle(fallback);
  }
  return c;
}

function sat(c: THREE.Color) {
  c.getHSL(hsl);
  return hsl.s * (1 - Math.abs(hsl.l - 0.5) * 1.6);
}

function withHSL(c: THREE.Color, f: (h: number, s: number, l: number) => [number, number, number]) {
  c.getHSL(hsl);
  const [h, s, l] = f(hsl.h, hsl.s, hsl.l);
  return new THREE.Color().setHSL(h, s, l);
}

/** Default palette used before the brain reports a theme (Omarchy-ish tokyo night). */
const FALLBACK: Record<string, string> = {
  background: '#1a1b26',
  foreground: '#a9b1d6',
  accent: '#7aa2f7',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  orange: '#ff9e64',
};

export function paletteFrom(msg: Pick<ThemeMessage, 'name' | 'colors'>): Palette {
  const col = { ...FALLBACK, ...msg.colors };
  const bg = parse(col.background, '#101014');
  const fg = parse(col.foreground, '#e0e0e0');
  const accent = parse(col.accent ?? col.blue, '#7aa2f7');
  bg.getHSL(hsl);
  const light = (col.mode ?? '').toLowerCase() === 'light' || hsl.l > 0.6;

  const names = ['accent', 'magenta', 'blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'bright_magenta', 'bright_blue', 'bright_cyan', 'bright_green', 'bright_yellow', 'bright_red'];
  const cands = names.filter((n) => col[n]).map((n) => parse(col[n], '#888'));
  const vivid = cands.filter((c) => sat(c) > 0.12);
  const mono = vivid.length < 3;

  // Light rig: distinct hues, pushed bright and saturated (they glow).
  const lights: THREE.Color[] = [];
  if (mono) {
    const base = [fg, accent, parse(col.bright_foreground ?? col.foreground, '#fff'), parse(col.light_foreground ?? col.foreground, '#ddd')];
    for (let i = 0; i < N_LIGHTS; i++) {
      lights.push(withHSL(base[i % base.length], (h, s) => [h, s * 0.3, 0.42 + 0.26 * ((i * 0.37) % 1)]));
    }
  } else {
    const sorted = [...vivid].sort((a, b) => sat(b) - sat(a));
    const hues: number[] = [];
    for (const c of sorted) {
      c.getHSL(hsl);
      if (hues.every((h) => Math.min(Math.abs(h - hsl.h), 1 - Math.abs(h - hsl.h)) > 0.07)) {
        hues.push(hsl.h);
        lights.push(withHSL(c, (h, s, l) => [h, Math.min(1, Math.max(s, 0.75)), Math.min(0.68, Math.max(l, 0.55))]));
      }
      if (lights.length >= N_LIGHTS) break;
    }
    // Put the theme accent first so the signature colour leads the show.
    const acc = withHSL(accent, (h, s, l) => [h, Math.min(1, Math.max(s, 0.7)), Math.min(0.68, Math.max(l, 0.55))]);
    lights.unshift(acc);
    lights.length = Math.min(lights.length, N_LIGHTS);
    while (lights.length < N_LIGHTS) lights.push(lights[lights.length % Math.max(1, lights.length - 1)].clone());
  }

  // Crowd vinyl: theme hues at toy-like lightness; greys for mono themes.
  const crowd: THREE.Color[] = [];
  for (let i = 0; i < N_CROWD; i++) {
    if (mono) {
      const l = [0.1, 0.78, 0.46, 0.22, 0.64, 0.36, 0.86, 0.16, 0.55, 0.3][i];
      crowd.push(new THREE.Color().setHSL(0, 0, l));
    } else {
      const src = (vivid.length ? vivid : cands)[i % Math.max(1, vivid.length || cands.length)];
      const shade = [0.55, 0.62, 0.48, 0.66, 0.52][i % 5];
      crowd.push(withHSL(src, (h, s) => [(h + (i >= vivid.length ? 0.03 : 0)) % 1, Math.min(0.85, Math.max(0.45, s)), shade]));
    }
  }
  const outfit = crowd.map((c, i) =>
    mono ? new THREE.Color().setHSL(0, 0, i % 2 ? 0.08 : 0.95) : withHSL(c, (h, s, l) => [(h + 0.5) % 1, s * 0.8, l > 0.5 ? l - 0.3 : l + 0.3]),
  );

  const bgDeep = withHSL(bg, (h, s, l) => [h, s, light ? l * 0.9 : Math.max(0.012, l * 0.45)]);
  const metal = withHSL(bg, (h, s, l) => [h, s * 0.5, light ? l * 0.55 : Math.min(0.2, l + 0.1)]);
  const floor = withHSL(bg, (h, s, l) => [h, s * 0.8, light ? l * 0.75 : Math.max(0.02, l * 0.7)]);
  const haze = withHSL(lights[0], (h, s, l) => [h, s * 0.6, light ? 0.8 : l * 0.35]);
  const neon = lights[1 % lights.length].clone();
  const neon2 = lights[0].clone();

  return { name: msg.name, light, mono, bg, bgDeep, fg, accent, neon, neon2, metal, floor, haze, lights, crowd, outfit };
}

/** Holds the live palette and cross-fades it toward new themes. */
export class ThemeState {
  readonly p: Palette;
  private target: Palette;
  private listeners: ((p: Palette) => void)[] = [];
  /** Mode flags flip halfway through the fade. */
  private fade = 1;

  constructor(initial: Palette) {
    this.p = initial;
    this.target = initial;
  }

  onChange(fn: (p: Palette) => void) {
    this.listeners.push(fn);
  }

  set(next: Palette, instant = false) {
    this.target = next;
    this.fade = instant ? 1 : 0;
    if (instant) this.update(1e3);
  }

  update(dt: number) {
    if (this.fade >= 1 && this.target === this.p) return;
    const k = 1 - Math.exp(-dt * 2.2);
    this.fade = Math.min(1, this.fade + dt / 1.6);
    const p = this.p;
    const t = this.target;
    const lerp = (a: THREE.Color, b: THREE.Color) => a.lerp(b, this.fade >= 1 ? 1 : k);
    for (const key of ['bg', 'bgDeep', 'fg', 'accent', 'neon', 'neon2', 'metal', 'floor', 'haze'] as const) lerp(p[key], t[key]);
    p.lights.forEach((c, i) => lerp(c, t.lights[i]));
    p.crowd.forEach((c, i) => lerp(c, t.crowd[i]));
    p.outfit.forEach((c, i) => lerp(c, t.outfit[i]));
    if (this.fade > 0.5) {
      p.name = t.name;
      p.light = t.light;
      p.mono = t.mono;
    }
    if (this.fade >= 1) this.target = p;
    for (const l of this.listeners) l(p);
  }
}
