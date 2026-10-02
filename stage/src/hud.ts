/**
 * Minimal overlay: a status line that fades away once music plays, a help
 * card (h), and a signal debugger (d) that shows what the party is hearing.
 */

import type { Activity } from './crowd';
import type { Music } from './music';
import { SECTION_NAMES } from './music';

export class Hud {
  private status: HTMLDivElement;
  private toastEl: HTMLDivElement;
  private toastTimer = 0;
  private help: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  debug = false;
  private hist: { v: number; vocal: number; kick: number; beat: number }[] = [];
  private statusText = '';
  private statusAlpha = 1;

  constructor(private accent: () => string) {
    const style = document.createElement('style');
    style.textContent = `
      .wp-status { position: fixed; left: 28px; bottom: 24px; font: 500 14px/1.4 ui-sans-serif, system-ui, sans-serif;
        color: #fff; letter-spacing: .02em; text-shadow: 0 1px 8px rgba(0,0,0,.7); pointer-events: none; transition: opacity .6s; }
      .wp-status b { font-weight: 700; }
      .wp-help { position: fixed; right: 28px; bottom: 24px; padding: 14px 18px; border-radius: 12px;
        background: rgba(10,10,14,.72); backdrop-filter: blur(8px); color: #eee; font: 13px/1.7 ui-monospace, monospace;
        display: none; border: 1px solid rgba(255,255,255,.12); }
      .wp-help kbd { display: inline-block; min-width: 1.6em; text-align: center; padding: 0 .3em; margin-right: .6em;
        border-radius: 4px; background: rgba(255,255,255,.14); }
      .wp-toast { position: fixed; left: 50%; top: 28px; transform: translateX(-50%); padding: 8px 18px; border-radius: 999px;
        background: rgba(10,10,14,.72); backdrop-filter: blur(8px); color: #fff; font: 500 15px/1.4 ui-sans-serif, system-ui, sans-serif;
        border: 1px solid rgba(255,255,255,.14); pointer-events: none; opacity: 0; transition: opacity .4s; }
      .wp-toast b { font-weight: 700; }
      .wp-debug { position: fixed; left: 16px; top: 16px; pointer-events: none; display: none; }
    `;
    document.head.appendChild(style);
    this.status = document.createElement('div');
    this.status.className = 'wp-status';
    this.help = document.createElement('div');
    this.help.className = 'wp-help';
    for (const [k, v] of [
      ['space', 'next camera shot'],
      ['1–9', 'hold a shot · 0 auto'],
      ['t', 'preview next theme · T current'],
      ['s', 'skin: auto · classic · spooky'],
      ['d', 'signal debugger + crowd activity'],
      ['k', 'tuning dials'],
      ['f', 'fullscreen'],
      ['h', 'this help'],
      ['q', 'quit'],
    ]) {
      const row = document.createElement('div');
      const kbd = document.createElement('kbd');
      kbd.textContent = k;
      row.append(kbd, v);
      this.help.append(row);
    }
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'wp-debug';
    this.canvas.width = 460;
    this.canvas.height = 340;
    this.ctx = this.canvas.getContext('2d')!;
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'wp-toast';
    document.body.append(this.status, this.help, this.canvas, this.toastEl);
  }

  toggleHelp() {
    this.help.style.display = this.help.style.display === 'block' ? 'none' : 'block';
  }

  toggleDebug() {
    this.debug = !this.debug;
    this.canvas.style.display = this.debug ? 'block' : 'none';
  }

  /** A short message at the top that shows over the music, then fades. */
  toast(...parts: (string | { b: string })[]) {
    this.toastEl.replaceChildren(...parts.map((p) => (typeof p === 'string' ? p : Object.assign(document.createElement('b'), { textContent: p.b }))));
    this.toastEl.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (this.toastEl.style.opacity = '0'), 2200);
  }

  /** Status line; `{ b: text }` parts are bold. Always text, never markup
   *  (theme names come from folder names). */
  setStatus(...parts: (string | { b: string })[]) {
    const key = JSON.stringify(parts);
    if (key === this.statusText) return;
    this.statusText = key;
    this.status.replaceChildren(
      ...parts.map((p) => {
        if (typeof p === 'string') return p;
        const b = document.createElement('b');
        b.textContent = p.b;
        return b;
      }),
    );
  }

  update(dt: number, m: Music, extra: string, act?: Activity) {
    const target = m.playing ? 0 : 1;
    this.statusAlpha += (target - this.statusAlpha) * (1 - Math.exp(-dt * 2));
    this.status.style.opacity = String(this.statusAlpha);
    if (!this.debug) return;
    this.hist.push({ v: m.level, vocal: m.vocal, kick: m.kickPulse, beat: m.beatPulse });
    if (this.hist.length > 220) this.hist.shift();
    const g = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(8,8,12,.78)';
    g.fillRect(0, 0, W, H);
    g.font = '12px ui-monospace, monospace';
    g.fillStyle = '#fff';
    g.fillText(`${m.bpm.toFixed(1)} bpm (dance ${m.danceBpm.toFixed(0)})  conf ${m.beatConf.toFixed(2)}  ${SECTION_NAMES[m.section]}  ${extra}`, 10, 18);
    const bars: [string, number, string][] = [
      ['level', m.level, '#9aa'],
      ['energy', m.energy, '#9cf'],
      ['hype', m.hype, this.accent()],
      ['bass', m.bass, '#f96'],
      ['mid', m.mid, '#fc6'],
      ['high', m.high, '#6cf'],
      ['vocal', m.vocal, '#f6c'],
      ['mouth', m.mouth, '#f9d'],
      ['build', m.build, '#fd4'],
      ['calm', m.calm, '#8f8'],
    ];
    bars.forEach(([name, v, c], i) => {
      const y = 32 + i * 13;
      g.fillStyle = '#aaa';
      g.fillText(name, 10, y + 9);
      g.fillStyle = c;
      g.fillRect(70, y, 150 * Math.max(0, Math.min(1, v)), 9);
    });
    // Beat dots.
    for (let i = 0; i < 4; i++) {
      g.fillStyle = Math.floor(m.barPos) === i ? this.accent() : 'rgba(255,255,255,.2)';
      g.beginPath();
      g.arc(250 + i * 22, 40, 7 + (Math.floor(m.barPos) === i ? 3 * m.beatPulse : 0), 0, Math.PI * 2);
      g.fill();
    }
    // Scope of level / vocal.
    const x0 = 240;
    const w = W - x0 - 10;
    const plot = (key: 'v' | 'vocal' | 'kick', color: string, y0: number, hgt: number) => {
      g.strokeStyle = color;
      g.beginPath();
      this.hist.forEach((h, i) => {
        const x = x0 + (i / 220) * w;
        const y = y0 + hgt - h[key] * hgt;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      });
      g.stroke();
    };
    plot('v', '#9cf', 70, 50);
    plot('vocal', '#f6c', 130, 50);
    plot('kick', '#f96', 190, 50);
    if (act) this.drawActivity(act, 256);
  }

  /** Crowd vs heroes vs the yellow reference dancer: is the crowd too polite? */
  private drawActivity(act: Activity, y0: number) {
    const g = this.ctx;
    const cols: [string, keyof Activity][] = [
      ['crowd', 'crowd'],
      ['heroes', 'heroes'],
      ['yellow', 'yellow'],
    ];
    const rows: [string, (a: Activity[keyof Activity]) => string][] = [
      ['hops/beat', (a) => a.hops.toFixed(2)],
      ['twitch/beat', (a) => a.twitch.toFixed(2)],
      ['motion', (a) => a.motion.toFixed(2)],
      ['swirling', (a) => `${Math.round(a.swirling * 100)}%`],
    ];
    g.fillStyle = '#fff';
    g.fillText('activity (4 s)', 10, y0);
    cols.forEach(([name], i) => {
      g.fillStyle = '#aaa';
      g.fillText(name, 130 + i * 80, y0);
    });
    rows.forEach(([label, fmt], r) => {
      const y = y0 + 15 + r * 15;
      g.fillStyle = '#aaa';
      g.fillText(label, 10, y);
      cols.forEach(([, key], i) => {
        g.fillStyle = key === 'crowd' ? this.accent() : '#eee';
        g.fillText(fmt(act[key]), 130 + i * 80, y);
      });
    });
    // Crowd motion as a share of the yellow hero's, the "feels right" reference.
    const ratio = act.yellow.motion > 1e-3 ? act.crowd.motion / act.yellow.motion : 0;
    g.fillStyle = '#aaa';
    g.fillText('crowd÷yel', 250 + 120, y0);
    g.fillStyle = this.accent();
    g.fillText(`${Math.round(ratio * 100)}% motion`, 250 + 120, y0 + 15);
  }
}
