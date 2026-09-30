/**
 * Tuning panel (k): a slider per dial, applied live. Every change is written
 * back to the URL, so a reload keeps it and the address bar is a shareable
 * preset. "copy" puts the dial query on the clipboard for --query / a note.
 */

import { DEFAULTS, DIALS, dialQuery, dials, onDials, resetDials, setDial, writeDialsToUrl } from './dials';

export class TunePanel {
  private root: HTMLDivElement;
  private inputs = new Map<string, { input: HTMLInputElement; value: HTMLSpanElement }>();
  private query: HTMLDivElement;

  constructor() {
    const style = document.createElement('style');
    style.textContent = `
      .wp-tune { position: fixed; right: 16px; top: 16px; width: 330px; padding: 12px 14px; border-radius: 12px;
        background: rgba(10,10,14,.8); backdrop-filter: blur(8px); color: #eee; font: 12px/1.5 ui-monospace, monospace;
        border: 1px solid rgba(255,255,255,.12); display: none; }
      .wp-tune .row { display: grid; grid-template-columns: 128px 1fr 44px; gap: 6px; align-items: center; }
      .wp-tune .row.changed span:first-child { color: #ffd166; }
      .wp-tune input[type=range] { width: 100%; }
      .wp-tune .num { text-align: right; }
      .wp-tune .q { margin-top: 8px; word-break: break-all; color: #aaa; min-height: 1.5em; }
      .wp-tune button { margin-top: 8px; margin-right: 6px; font: inherit; color: #eee; background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.2); border-radius: 6px; padding: 2px 10px; cursor: pointer; }
    `;
    document.head.appendChild(style);
    this.root = document.createElement('div');
    this.root.className = 'wp-tune';
    const title = document.createElement('div');
    title.textContent = 'tuning dials (k to hide)';
    title.style.marginBottom = '6px';
    this.root.append(title);
    for (const d of DIALS) {
      const row = document.createElement('label');
      row.className = 'row';
      row.title = d.help;
      const name = document.createElement('span');
      name.textContent = d.label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(d.min);
      input.max = String(d.max);
      input.step = String(d.step);
      const value = document.createElement('span');
      value.className = 'num';
      input.addEventListener('input', () => setDial(d.key, Number(input.value)));
      // Keep the party's keyboard shortcuts from firing while a slider has focus.
      input.addEventListener('keydown', (e) => e.stopPropagation());
      row.append(name, input, value);
      this.root.append(row);
      this.inputs.set(d.key, { input, value });
    }
    this.query = document.createElement('div');
    this.query.className = 'q';
    const reset = document.createElement('button');
    reset.textContent = 'reset';
    reset.addEventListener('click', () => resetDials());
    const copy = document.createElement('button');
    copy.textContent = 'copy';
    copy.addEventListener('click', () => void navigator.clipboard?.writeText(dialQuery()).catch(() => {}));
    this.root.append(this.query, reset, copy);
    document.body.append(this.root);
    onDials(() => {
      this.sync();
      writeDialsToUrl();
    });
    this.sync();
  }

  toggle() {
    this.root.style.display = this.root.style.display === 'block' ? 'none' : 'block';
  }

  private sync() {
    for (const d of DIALS) {
      const { input, value } = this.inputs.get(d.key)!;
      input.value = String(dials[d.key]);
      value.textContent = String(+dials[d.key].toFixed(2));
      input.parentElement!.classList.toggle('changed', dials[d.key] !== DEFAULTS[d.key]);
    }
    this.query.textContent = dialQuery() || '(defaults)';
  }
}
