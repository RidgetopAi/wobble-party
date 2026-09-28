/**
 * Logos on the big LED wall: every minute or two of music, Omarchy or
 * RidgetopAi comes up on a bar line, holds for a few bars and fades back
 * into the show. Never over the now-playing marquee or the cover art.
 */

import * as THREE from 'three';
import { Section, type Music } from './music';
import { Rng } from './rng';
import type { ShowUniforms } from './world/showUniforms';

const LOGOS = ['logos/omarchy.png', 'logos/ridgetopai.png'];

interface Logo {
  tex: THREE.Texture;
  aspect: number;
}

export class Logos {
  /** Slots in LOGOS order; null until loaded. */
  private logos: (Logo | null)[] = LOGOS.map(() => null);
  private rng = new Rng(2718);
  private idx = this.rng.int(LOGOS.length);
  /** Seconds of music until the next one is due. */
  private wait = this.rng.range(35, 60);
  /** Seconds into the current showing, or -1. */
  private t = -1;
  private hold = 0;
  private lastBar = -1;
  /** Debug (?logos): one every few seconds. */
  demo = false;

  constructor(private u: ShowUniforms) {
    LOGOS.forEach((url, i) => {
      new THREE.TextureLoader().load(new URL(url, document.baseURI).href, (tex) => {
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        const img = tex.image as HTMLImageElement;
        this.logos[i] = { tex, aspect: img.width / img.height };
      });
    });
  }

  update(dt: number, music: Music) {
    const u = this.u;
    const bar = Math.floor(music.danceBeatPos / 4);
    const onBar = bar !== this.lastBar;
    this.lastBar = bar;
    const busy = u.uMarqueeMix.value > 0.02 || u.uArtMix.value > 0.05;

    if (this.t < 0) {
      if (this.demo) this.wait = Math.min(this.wait, 3);
      if (music.playing && music.presence > 0.6) this.wait -= dt;
      u.uLogoMix.value *= Math.exp(-dt * 3);
      // Wait for a bar line, and not in the middle of a build.
      const logo = this.logos[this.idx % LOGOS.length];
      if (this.wait <= 0 && onBar && !busy && logo && music.section !== Section.Build) {
        this.idx++;
        u.uLogo.value = logo.tex;
        u.uLogoAspect.value = logo.aspect;
        const barDur = (4 * 60) / Math.max(60, music.danceBpm);
        this.hold = Math.min(10, Math.max(5, 3 * barDur));
        this.t = 0;
      }
      return;
    }

    this.t += dt;
    const fadeIn = 0.5;
    const fadeOut = 1.2;
    let mix = Math.min(1, this.t / fadeIn) * Math.min(1, Math.max(0, (this.hold - this.t) / fadeOut));
    // Get out of the way if a new track's title starts scrolling.
    if (busy) this.t = Math.max(this.t, this.hold - fadeOut * mix);
    mix *= 0.95;
    u.uLogoMix.value = mix;
    if (this.t >= this.hold) {
      this.t = -1;
      u.uLogoMix.value = 0;
      this.wait = this.demo ? 3 : this.rng.range(60, 120);
    }
  }
}
