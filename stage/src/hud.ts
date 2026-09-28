/**
 * Minimal overlay: a status line that fades away once music plays, a help
 * card (h), and a signal debugger (d) that shows what the party is hearing.
 */

import type { Music } from './music';
import { SECTION_NAMES } from './music';

export class Hud {
  private status: HTMLDivElement;
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
      .wp-debug { position: fixed; left: 16px; top: 16px; pointer-events: none; display: none; }
    `;
    document.head.appendChild(style);
    this.status = document.createElement('div');
    this.status.className = 'wp-status';
    this.help = document.createElement('div');
    this.help.className = 'wp-help';
    this.help.innerHTML = [
      ['space', 'next camera shot'],
      ['1–9', 'hold a shot · 0 auto'],
      ['t', 'preview next theme · T current'],
      ['d', 'signal debugger'],
      ['f', 'fullscreen'],
      ['h', 'this help'],
      ['q', 'quit'],
    ]
      .map(([k, v]) => `<div><kbd>${k}</kbd>${v}</div>`)
      .join('');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'wp-debug';
    this.canvas.width = 460;
    this.canvas.height = 250;
    this.ctx = this.canvas.getContext('2d')!;
    document.body.append(this.status, this.help, this.canvas);
  }

  toggleHelp() {
    this.help.style.display = this.help.style.display === 'block' ? 'none' : 'block';
  }

  toggleDebug() {
    this.debug = !this.debug;
    this.canvas.style.display = this.debug ? 'block' : 'none';
  }

  setStatus(text: string) {
    if (text !== this.statusText) {
      this.statusText = text;
      this.status.innerHTML = text;
    }
  }

  update(dt: number, m: Music, extra: string) {
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
  }
}
