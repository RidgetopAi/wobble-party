/**
 * Now playing on the LED wall: when a new track starts in cliamp, Spotify or
 * a browser tab, its title scrolls across the wall in the sign's lettering;
 * in calm passages (and while paused) the wall shows the cover art as LED
 * pixels.
 */

import * as THREE from 'three';
import type { TrackMessage } from './feed';
import { Section, type Music } from './music';
import type { ShowUniforms } from './world/showUniforms';

const MARQUEE_SECONDS = 14;

export class NowPlaying {
  private canvas = document.createElement('canvas');
  private tex: THREE.CanvasTexture;
  private font: Promise<void>;
  private key = '';
  private marqueeT = -1;
  private artUrl: string | null = null;
  private artReady = false;
  track: TrackMessage | null = null;

  constructor(private u: ShowUniforms) {
    this.canvas.width = 1024;
    this.canvas.height = 128;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.wrapS = THREE.RepeatWrapping;
    this.tex.colorSpace = THREE.SRGBColorSpace;
    u.uMarquee.value = this.tex;
    const face = new FontFace('Titan One', `url(${new URL('fonts/TitanOne-Regular.ttf', document.baseURI).href})`);
    this.font = face.load().then((f) => void document.fonts.add(f)).catch(() => undefined);
  }

  onTrack(t: TrackMessage) {
    this.track = t;
    const key = `${t.title}\u0000${t.artist}`;
    if (t.playing && t.title && key !== this.key) {
      this.key = key;
      void this.drawText(t);
    }
    if (t.art !== this.artUrl) {
      this.artUrl = t.art;
      this.artReady = false;
      if (t.art) {
        new THREE.TextureLoader().load(t.art, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          this.u.uArt.value?.dispose();
          this.u.uArt.value = tex;
          this.artReady = true;
        });
      }
    }
  }

  private async drawText(t: TrackMessage) {
    await this.font;
    const text = `♪  ${t.title.toUpperCase()}${t.artist ? '  ·  ' + t.artist.toUpperCase() : ''}`;
    const g = this.canvas.getContext('2d')!;
    const H = 128;
    g.font = `92px "Titan One", sans-serif`;
    const w = Math.ceil(g.measureText(text).width);
    const note = H * 0.9;
    // One copy of the text plus a gap, so the wrap repeats cleanly.
    this.canvas.width = Math.min(8192, w + note + H * 3);
    this.canvas.height = H;
    g.font = `92px "Titan One", sans-serif`;
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.clearRect(0, 0, this.canvas.width, H);
    drawNote(g, H * 1.5, H);
    g.fillText(text, H * 1.5 + note, H * 0.54);
    this.tex.dispose();
    this.tex.needsUpdate = true;
    this.u.uMarqueeAspect.value = this.canvas.width / H;
    this.u.uMarqueeScroll.value = -0.35;
    this.marqueeT = 0;
  }

  update(dt: number, music: Music) {
    const u = this.u;
    if (this.marqueeT >= 0) {
      this.marqueeT += dt;
      const t = this.marqueeT;
      u.uMarqueeMix.value = Math.min(1, t / 0.6) * Math.min(1, Math.max(0, (MARQUEE_SECONDS - t) / 1.2));
      // Cross the wall roughly every six seconds whatever the title length.
      u.uMarqueeScroll.value += (dt / 6) * (8 / Math.max(4, u.uMarqueeAspect.value)) * 2.2;
      if (t > MARQUEE_SECONDS) this.marqueeT = -1;
    } else {
      u.uMarqueeMix.value = 0;
    }
    const paused = this.track && !this.track.playing && !music.playing;
    const wantArt = this.artReady && (music.section === Section.Calm || paused) ? 0.85 : 0;
    u.uArtMix.value += (wantArt - u.uArtMix.value) * (1 - Math.exp(-dt * 1.5));
  }
}

/** An eighth note, drawn with paths (height H, left edge x). */
function drawNote(g: CanvasRenderingContext2D, x: number, H: number) {
  g.save();
  g.translate(x, 0);
  g.beginPath();
  g.ellipse(H * 0.24, H * 0.7, H * 0.17, H * 0.13, -0.4, 0, Math.PI * 2);
  g.fill();
  g.fillRect(H * 0.36, H * 0.16, H * 0.07, H * 0.54);
  g.beginPath();
  g.moveTo(H * 0.36, H * 0.14);
  g.quadraticCurveTo(H * 0.62, H * 0.24, H * 0.6, H * 0.5);
  g.quadraticCurveTo(H * 0.52, H * 0.34, H * 0.43, H * 0.32);
  g.closePath();
  g.fill();
  g.restore();
}
