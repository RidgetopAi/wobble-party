/**
 * Halloween costumes (the spooky skin). A costume can repaint the body
 * (pumpkin, skeleton, ghost, mummy, Frankenstein, vampire: fixed colours,
 * they are the costume) or keep the wearer's theme vinyl and add props
 * (witch, devil, cat, bat: so the Omarchy theme still colours the crowd).
 *
 * Costumes are drawn by the body shader (uSkin.x = CostumeKind) plus
 * accessories; every wobbler keeps its classic look for the classic skin.
 */

import * as THREE from 'three';
import { Rng } from '../rng';
import { Emblem, Pattern, type OutfitStyle } from './body';
import type { Accessory, Look } from './look';

export const enum CostumeKind {
  None = 0,
  Pumpkin = 1,
  Skeleton = 2,
  Ghost = 3,
  Mummy = 4,
  Frank = 5,
  Vampire = 6,
  Cat = 7,
  Witch = 8,
  Devil = 9,
  Bat = 10,
}

export interface Costume {
  kind: CostumeKind;
  accessories: Accessory[];
  /** Overrides; anything left out keeps the classic look (theme colours). */
  body?: THREE.Color | number;
  outA?: THREE.Color | number;
  outB?: THREE.Color | number;
  acc?: THREE.Color | number;
  trim?: THREE.Color | number;
  outfit?: OutfitStyle;
}

const c = (hex: string) => new THREE.Color(hex);
const bare: OutfitStyle = { kind: 0, pattern: Pattern.Solid, emblem: Emblem.None, beltY: 0.3 };

const PUMPKINS = ['#ff7b1c', '#ff8a2a', '#f26a10', '#ff9933'];

/** A crowd member's costume, from their seed (stable across reloads). */
export function crowdCostume(seed: number, look: Look): Costume {
  const r = new Rng(seed * 7919 + 1031);
  const kind = r.weighted([
    [CostumeKind.Pumpkin, 2.2],
    [CostumeKind.Witch, 2],
    [CostumeKind.Skeleton, 1.6],
    [CostumeKind.Ghost, 1.5],
    [CostumeKind.Devil, 1.5],
    [CostumeKind.Cat, 1.5],
    [CostumeKind.Vampire, 1.3],
    [CostumeKind.Bat, 1.3],
    [CostumeKind.Mummy, 1],
    [CostumeKind.Frank, 1],
  ] as const);
  // Theme-coloured costumes swap the chest emblem for a spooky one.
  const spookyOutfit = (): OutfitStyle => ({
    ...look.outfit,
    emblem: r.weighted([
      [Emblem.Bat, 2],
      [Emblem.Skull, 1],
      [Emblem.Pumpkin, 1.5],
      [Emblem.None, 1.5],
    ] as const),
  });
  switch (kind) {
    case CostumeKind.Pumpkin:
      return { kind, accessories: ['stem'], body: c(r.pick(PUMPKINS)), acc: c('#4f6b25'), trim: c('#3f8a3a'), outfit: bare };
    case CostumeKind.Skeleton:
      return { kind, accessories: [], body: c('#1d1925'), acc: c('#ece4d0'), outfit: bare };
    case CostumeKind.Ghost:
      return { kind, accessories: ['ghostHem'], body: c('#f2f1fb'), acc: c('#f2f1fb'), outfit: bare };
    case CostumeKind.Mummy:
      return { kind, accessories: [], body: c('#e5d8b8'), outfit: bare };
    case CostumeKind.Frank:
      return {
        kind,
        accessories: ['flatTop', 'neckBolts'],
        body: c('#86b86a'),
        outA: c('#3b3447'),
        outB: c('#23202b'),
        acc: c('#16141c'),
        trim: c('#9aa1ab'),
        outfit: { kind: 2, pattern: Pattern.Solid, emblem: Emblem.None, beltY: 0.3 },
      };
    case CostumeKind.Vampire:
      return {
        kind,
        accessories: ['capeCollar', 'cape'],
        body: c('#ebe4f2'),
        outA: c('#16121d'),
        outB: c('#b3122e'),
        acc: c('#16121d'),
        trim: c('#b3122e'),
        outfit: { kind: 2, pattern: Pattern.Solid, emblem: r.chance(0.5) ? Emblem.Bat : Emblem.None, beltY: 0.3 },
      };
    case CostumeKind.Cat:
      return { kind, accessories: r.chance(0.4) ? ['catEars', 'bow'] : ['catEars'], acc: look.body, trim: c('#ff8fb1'), outfit: spookyOutfit() };
    case CostumeKind.Witch:
      return { kind, accessories: ['witchHat'], acc: c('#1e1629'), trim: typeof look.accColor === 'number' ? look.accColor : 3, outfit: spookyOutfit() };
    case CostumeKind.Devil:
      return { kind, accessories: ['horns', 'devilTail'], acc: c('#d42033'), outfit: spookyOutfit() };
    case CostumeKind.Bat:
    default:
      return { kind: CostumeKind.Bat, accessories: ['batEars', 'batWings'], acc: c('#241c2e'), trim: c('#ff8fb1'), outfit: spookyOutfit() };
  }
}

/** The DJ goes as a vampire, headphones on. */
export function djCostume(): Costume {
  return {
    kind: CostumeKind.Vampire,
    accessories: ['headphones', 'capeCollar', 'cape'],
    body: c('#efe6f0'),
    outA: c('#18121f'),
    outB: c('#c0162f'),
    acc: c('#16121d'),
    trim: c('#c0162f'),
    outfit: { kind: 2, pattern: Pattern.Solid, emblem: Emblem.Bat, beltY: 0.3 },
  };
}

/** The front row, in heroLooks() order: each costume keeps a nod to the hero. */
export function heroCostumes(): Costume[] {
  return [
    // Pink bow girl: a pink cat, bow and all.
    { kind: CostumeKind.Cat, accessories: ['catEars', 'bow'], acc: c('#ff4f86'), trim: c('#ffd0de') },
    // Teal pompadour: Frankenstein's monster (the quiff goes flat).
    {
      kind: CostumeKind.Frank,
      accessories: ['flatTop', 'neckBolts'],
      body: c('#7fc28a'),
      outA: c('#1f6f8b'),
      outB: c('#ffcf3f'),
      acc: c('#16141c'),
      trim: c('#9aa1ab'),
      outfit: { kind: 2, pattern: Pattern.Solid, emblem: Emblem.Bolt, beltY: 0.3 },
    },
    // Yellow star-glasses: a jack-o'-lantern that kept its star glasses.
    { kind: CostumeKind.Pumpkin, accessories: ['stem', 'starGlasses'], body: c('#ff8a1f'), acc: c('#4f6b25'), trim: c('#3f8a3a'), outfit: bare },
    // Purple skull tee: the whole skeleton.
    { kind: CostumeKind.Skeleton, accessories: [], body: c('#211a2e'), acc: c('#ece4d0'), outfit: bare },
    // Mint headband: the bandages took over.
    { kind: CostumeKind.Mummy, accessories: [], body: c('#e8dcbd'), outfit: bare },
  ];
}
