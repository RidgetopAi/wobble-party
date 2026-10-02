/**
 * Skins: dress-up layers for the party, independent of the Omarchy theme.
 * The theme decides colours (lights, LEDs, crowd vinyl); a skin decides what
 * everyone wears, what decorates the venue and which special moments the show
 * can play. Classic is the plain party; spooky is Halloween.
 *
 * Choice: `?skin=` (this page only), else the saved choice (s cycles and saves
 * it), else `auto`, which picks a seasonal skin from the date.
 */

export type SkinId = 'classic' | 'spooky';
export type SkinChoice = SkinId | 'auto';

export const SKIN_CHOICES: SkinChoice[] = ['auto', 'classic', 'spooky'];
const STORE_KEY = 'wobble-party.skin';

/** The seasonal skin for a date: spooky from 1 October to 2 November. */
export function seasonalSkin(d = new Date()): SkinId {
  const m = d.getMonth();
  if (m === 9 || (m === 10 && d.getDate() <= 2)) return 'spooky';
  return 'classic';
}

function isChoice(v: string | null): v is SkinChoice {
  return v !== null && (SKIN_CHOICES as string[]).includes(v);
}

class SkinState {
  choice: SkinChoice = 'auto';
  /** The skin actually showing. */
  id: SkinId = 'classic';
  private listeners: ((id: SkinId) => void)[] = [];
  private fromUrl = false;

  /** Before the party is built, so everything starts in the right clothes. */
  init(params: URLSearchParams) {
    const q = params.get('skin');
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORE_KEY);
    } catch {
      /* storage blocked: use auto */
    }
    this.fromUrl = isChoice(q);
    this.choice = isChoice(q) ? q : isChoice(saved) ? saved : 'auto';
    this.id = this.resolve();
  }

  private resolve(): SkinId {
    return this.choice === 'auto' ? seasonalSkin() : this.choice;
  }

  onChange(fn: (id: SkinId) => void) {
    this.listeners.push(fn);
  }

  set(choice: SkinChoice) {
    this.choice = choice;
    if (!this.fromUrl) {
      try {
        localStorage.setItem(STORE_KEY, choice);
      } catch {
        /* not saved; still applies to this session */
      }
    }
    const id = this.resolve();
    if (id === this.id) return;
    this.id = id;
    for (const fn of this.listeners) fn(id);
  }

  cycle() {
    this.set(SKIN_CHOICES[(SKIN_CHOICES.indexOf(this.choice) + 1) % SKIN_CHOICES.length]);
  }

  /** For the status line: "auto (spooky)". */
  label() {
    return this.choice === 'auto' ? `auto (${this.id})` : this.id;
  }
}

export const skin = new SkinState();
