/**
 * Who a wobbler is: shape, vinyl colours, outfit, accessories, personality.
 * Crowd looks are generated from a seed and pull colours from the theme
 * palette; the DJ and heroes are hand-designed (after the key art) and keep
 * their identity across themes.
 */

import * as THREE from 'three';
import { Rng } from '../rng';
import { Emblem, Pattern, type BodyShape, type OutfitStyle } from './body';

export type Accessory =
  | 'cap'
  | 'capBack'
  | 'headphones'
  | 'bow'
  | 'tuft'
  | 'mohawk'
  | 'beanie'
  | 'headband'
  | 'starGlasses'
  | 'roundGlasses'
  | 'antenna'
  | 'crown'
  | 'pompadour'
  | 'bun';

export interface Personality {
  /** Overall movement size 0.5..1.4 */
  energy: number;
  /** Timing offset in beats (humanise), small. */
  lag: number;
  /** Preferences, 0..1. */
  bounce: number;
  sway: number;
  arms: number;
  jumpy: number;
  shimmy: number;
  /** How much they sing along. */
  singer: number;
  /** Chance to do something spontaneous per bar. */
  showoff: number;
}

export interface Look {
  shape: BodyShape;
  /** Fixed colours (heroes/DJ) or palette indices (crowd). */
  body: THREE.Color | number;
  outA: THREE.Color | number;
  outB: THREE.Color | number;
  /** Lightness/hue jitter applied to palette colours. */
  jitter: number;
  outfit: OutfitStyle;
  accessories: Accessory[];
  accColor: THREE.Color | number;
  /** Detail colour: cap brims, headphone cups. */
  trim: THREE.Color | number;
  personality: Personality;
  scale: number;
}

const HAT_SETS: Accessory[][] = [
  ['cap'],
  ['capBack'],
  ['bow'],
  ['tuft'],
  ['mohawk'],
  ['beanie'],
  ['headband'],
  ['antenna'],
  ['pompadour'],
  ['bun'],
  ['crown'],
  [],
  [],
  ['tuft', 'roundGlasses'],
  ['headband', 'starGlasses'],
  ['cap', 'roundGlasses'],
  ['bow'],
  ['tuft'],
];

export function crowdLook(seed: number): Look {
  const r = new Rng(seed * 9973 + 17);
  const nPal = 10;
  const bodyIdx = r.int(nPal);
  const kind = r.weighted([
    [1, 3],
    [2, 2],
    [3, 2],
    [4, 1],
    [0, 1],
  ] as const);
  return {
    shape: {
      height: r.range(0.88, 1.12),
      width: r.range(0.92, 1.12),
      pear: r.range(0.18, 0.42),
      boxy: r.range(2.0, 2.5),
    },
    body: bodyIdx,
    outA: (bodyIdx + 1 + r.int(nPal - 1)) % nPal,
    outB: 10 + r.int(nPal),
    jitter: r.range(-1, 1),
    outfit: {
      kind,
      pattern: r.weighted([
        [Pattern.Solid, 4],
        [Pattern.Stripes, 2],
        [Pattern.Dots, 1.5],
        [Pattern.Checker, 1],
        [Pattern.Zigzag, 1],
      ] as const),
      emblem: r.weighted([
        [Emblem.None, 3],
        [Emblem.Heart, 1.2],
        [Emblem.Star, 1.2],
        [Emblem.Bolt, 1.2],
        [Emblem.Note, 1.2],
        [Emblem.W, 0.8],
        [Emblem.Skull, 0.8],
        [Emblem.Ring, 0.6],
      ] as const),
      beltY: r.range(0.28, 0.34),
    },
    accessories: r.pick(HAT_SETS),
    accColor: r.chance(0.5) ? (bodyIdx + 3) % nPal : 10 + r.int(nPal),
    trim: 10 + r.int(nPal),
    personality: personality(r),
    scale: r.range(0.9, 1.08),
  };
}

function personality(r: Rng): Personality {
  return {
    energy: r.range(0.65, 1.3),
    lag: r.range(-0.04, 0.06),
    bounce: r.range(0.3, 1),
    sway: r.range(0.2, 1),
    arms: r.range(0.2, 1),
    jumpy: r.range(0.1, 1),
    shimmy: r.range(0, 1),
    singer: r.range(0.3, 1),
    showoff: r.range(0.05, 0.4),
  };
}

const c = (hex: string) => new THREE.Color(hex);

/** The DJ: cream vinyl, black cap with teal brim, headphones, purple tee. */
export function djLook(): Look {
  return {
    shape: { height: 1.05, width: 1.08, pear: 0.28, boxy: 2.3 },
    body: c('#f3cf8e'),
    outA: c('#4b2a8c'),
    outB: c('#18152a'),
    jitter: 0,
    outfit: { kind: 2, pattern: Pattern.Solid, emblem: Emblem.W, beltY: 0.3 },
    accessories: ['cap', 'headphones'],
    accColor: c('#1b1830'),
    trim: c('#2ec4c6'),
    personality: { energy: 1.1, lag: 0, bounce: 0.9, sway: 0.5, arms: 1, jumpy: 0.4, shimmy: 0.5, singer: 0.8, showoff: 0.3 },
    scale: 1.55,
  };
}

/** Front-row heroes, after the key art. */
export function heroLooks(): Look[] {
  return [
    {
      // Pink bow girl with the heart
      shape: { height: 1.0, width: 1.05, pear: 0.34, boxy: 2.2 },
      body: c('#ff4f86'),
      outA: c('#e0336b'),
      outB: c('#ffd166'),
      jitter: 0,
      outfit: { kind: 3, pattern: Pattern.Solid, emblem: Emblem.Heart, beltY: 0.36 },
      accessories: ['bow'],
      accColor: c('#ff2d6f'),
      trim: c('#ffffff'),
      personality: { energy: 1.15, lag: 0.02, bounce: 1, sway: 0.8, arms: 0.9, jumpy: 0.6, shimmy: 0.8, singer: 1, showoff: 0.35 },
      scale: 1.12,
    },
    {
      // Teal lightning jacket with the purple pompadour
      shape: { height: 1.08, width: 1.0, pear: 0.26, boxy: 2.4 },
      body: c('#2ec4c6'),
      outA: c('#1f6f8b'),
      outB: c('#ffcf3f'),
      jitter: 0,
      outfit: { kind: 2, pattern: Pattern.Solid, emblem: Emblem.Bolt, beltY: 0.3 },
      accessories: ['pompadour'],
      accColor: c('#7b4dff'),
      trim: c('#ffffff'),
      personality: { energy: 1.3, lag: -0.01, bounce: 0.9, sway: 0.5, arms: 1, jumpy: 1, shimmy: 0.6, singer: 0.9, showoff: 0.45 },
      scale: 1.15,
    },
    {
      // Yellow star-glasses party animal
      shape: { height: 0.98, width: 1.1, pear: 0.3, boxy: 2.2 },
      body: c('#ffc93c'),
      outA: c('#ff8a3d'),
      outB: c('#ffe8a3'),
      jitter: 0,
      outfit: { kind: 3, pattern: Pattern.Solid, emblem: Emblem.Star, beltY: 0.38 },
      accessories: ['starGlasses'],
      accColor: c('#1b2d8f'),
      trim: c('#ffffff'),
      personality: { energy: 1.25, lag: 0.03, bounce: 1, sway: 0.7, arms: 1, jumpy: 0.8, shimmy: 1, singer: 0.8, showoff: 0.5 },
      scale: 1.1,
    },
    {
      // Purple skull tee with a tuft
      shape: { height: 1.04, width: 1.02, pear: 0.3, boxy: 2.3 },
      body: c('#9b6bff'),
      outA: c('#7a4fe0'),
      outB: c('#f2f2f2'),
      jitter: 0,
      outfit: { kind: 2, pattern: Pattern.Solid, emblem: Emblem.Skull, beltY: 0.3 },
      accessories: ['tuft'],
      accColor: c('#5b2fc9'),
      trim: c('#ffffff'),
      personality: { energy: 1.0, lag: 0.0, bounce: 0.8, sway: 0.9, arms: 0.8, jumpy: 0.5, shimmy: 0.4, singer: 0.9, showoff: 0.3 },
      scale: 1.08,
    },
    {
      // Mint green headband, striped pants
      shape: { height: 0.96, width: 1.08, pear: 0.36, boxy: 2.1 },
      body: c('#b8f2e6'),
      outA: c('#3a86ff'),
      outB: c('#effff9'),
      jitter: 0,
      outfit: { kind: 1, pattern: Pattern.Stripes, emblem: Emblem.None, beltY: 0.33 },
      accessories: ['headband'],
      accColor: c('#52d273'),
      trim: c('#ffffff'),
      personality: { energy: 1.0, lag: 0.02, bounce: 0.9, sway: 0.8, arms: 0.7, jumpy: 0.5, shimmy: 0.5, singer: 0.7, showoff: 0.25 },
      scale: 1.05,
    },
  ];
}
