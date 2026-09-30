/**
 * Tuning dials for how hard the party dances. The defaults are Brian's
 * 2026-09-29 dial-in on house/club tracks (v0.1.0 shipped energy..showoff 0,
 * hop 0.5, hopDown 0.35, twitchGate 0.6, twitchHype 0.5, bob 1, swirl 1,
 * hype 1). The URL overrides them (`?energy=0.2&hop=0.4`) and the
 * tuning panel (k) changes them live, writing back to the URL so a reload or
 * a copied link keeps the setting. tools/activity.mjs and tools/render.mjs
 * take the same keys via `--query`.
 */

export interface Dial {
  key: keyof Dials;
  label: string;
  min: number;
  max: number;
  step: number;
  help: string;
}

export interface Dials {
  /** Added to every generated crowd member's trait (heroes and DJ untouched). */
  energy: number;
  bounce: number;
  jumpy: number;
  shimmy: number;
  showoff: number;
  /** hype × energy × jumpy above this hops on every beat. */
  hop: number;
  /** ...above this hops every other beat. */
  hopDown: number;
  /** Minimum shimmy for the hi-hat twitch. */
  twitchGate: number;
  /** Minimum hype for the hi-hat twitch. */
  twitchHype: number;
  /** Groove bob size multiplier. */
  bob: number;
  /** Swirl chance multiplier (spontaneous, after drops, crowd ripples). */
  swirl: number;
  /** Hype multiplier. Global: lights and camera read hype too. */
  hype: number;
}

export const DEFAULTS: Readonly<Dials> = {
  energy: 0.35,
  bounce: 0.25,
  jumpy: 0.15,
  shimmy: 0.45,
  showoff: 0.35,
  hop: 0.5,
  hopDown: 0.2,
  twitchGate: 0.6,
  twitchHype: 0.55,
  bob: 1.4,
  swirl: 4,
  hype: 1.05,
};

export const DIALS: Dial[] = [
  { key: 'energy', label: 'crowd energy', min: -0.3, max: 0.6, step: 0.05, help: '+ to every crowd member (0.65..1.3)' },
  { key: 'bounce', label: 'crowd bounce', min: -0.3, max: 0.7, step: 0.05, help: '+ bob size trait (0.3..1)' },
  { key: 'jumpy', label: 'crowd jumpy', min: -0.2, max: 0.8, step: 0.05, help: '+ hop trait (0.1..1)' },
  { key: 'shimmy', label: 'crowd shimmy', min: -0.3, max: 1, step: 0.05, help: '+ hi-hat twitch trait (0..1)' },
  { key: 'showoff', label: 'crowd showoff', min: 0, max: 0.6, step: 0.05, help: '+ solo swirl trait (0.05..0.4)' },
  { key: 'hop', label: 'hop every beat at', min: 0.1, max: 1, step: 0.05, help: 'hype·energy·jumpy above this' },
  { key: 'hopDown', label: 'hop every 2nd at', min: 0.05, max: 1, step: 0.05, help: 'hype·energy·jumpy above this' },
  { key: 'twitchGate', label: 'twitch: shimmy >', min: 0, max: 1, step: 0.05, help: 'hi-hat twitch gate' },
  { key: 'twitchHype', label: 'twitch: hype >', min: 0, max: 1, step: 0.05, help: 'hi-hat twitch needs this much hype' },
  { key: 'bob', label: 'bob size', min: 0.5, max: 2.5, step: 0.05, help: 'groove squash multiplier' },
  { key: 'swirl', label: 'swirl chance', min: 0, max: 5, step: 0.25, help: 'x solo + ripple odds' },
  { key: 'hype', label: 'hype', min: 0.5, max: 1.6, step: 0.05, help: 'x global (lights, camera too)' },
];

/** The live dials. Mutated in place, so readers always see current values. */
export const dials: Dials = { ...DEFAULTS };

const listeners: (() => void)[] = [];

/** Called after any change (crowd re-derives its personalities). */
export function onDials(fn: () => void) {
  listeners.push(fn);
}

export function setDial(key: keyof Dials, v: number) {
  const d = DIALS.find((x) => x.key === key)!;
  dials[key] = Math.min(d.max, Math.max(d.min, v));
  for (const fn of listeners) fn();
}

export function resetDials() {
  Object.assign(dials, DEFAULTS);
  for (const fn of listeners) fn();
}

export function readDials(params: URLSearchParams) {
  for (const d of DIALS) {
    const raw = params.get(d.key);
    if (raw === null) continue;
    const v = Number(raw);
    if (Number.isFinite(v)) dials[d.key] = Math.min(d.max, Math.max(d.min, v));
  }
}

/** Only the dials that differ from the defaults, as `k=v&k=v`. */
export function dialQuery() {
  return DIALS.filter((d) => dials[d.key] !== DEFAULTS[d.key])
    .map((d) => `${d.key}=${+dials[d.key].toFixed(3)}`)
    .join('&');
}

/** Rewrite the page URL's dial keys, leaving every other parameter alone. */
export function writeDialsToUrl() {
  const p = new URLSearchParams(location.search);
  for (const d of DIALS) {
    if (dials[d.key] === DEFAULTS[d.key]) p.delete(d.key);
    else p.set(d.key, String(+dials[d.key].toFixed(3)));
  }
  const q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
}
