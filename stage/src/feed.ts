/**
 * Frame sources for the stage:
 *  - LiveFeed: WebSocket to wobble-brain (desktop audio), auto-reconnects.
 *  - ReplayFeed: pre-analysed frames played against a virtual clock
 *    (deterministic renders and tests).
 *  - DemoFeed: a synthetic groove when no brain is reachable.
 */

import type { Frame } from './music';

export interface ThemeMessage {
  type: 'theme';
  name: string;
  colors: Record<string, string>;
  background: string | null;
}

export interface TrackMessage {
  type: 'track';
  playing: boolean;
  player: string | null;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  art: string | null;
}

export interface Feed {
  /** Deliver frames up to `now` (seconds on the feed's own clock). */
  poll(now: number, sink: (f: Frame) => void): void;
  connected: boolean;
}

export class LiveFeed implements Feed {
  connected = false;
  private queue: Frame[] = [];
  private ws: WebSocket | null = null;

  /** Send a small JSON message to the brain (stats). */
  send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
  private retry = 0;

  constructor(
    private url: string,
    private onTheme: (t: ThemeMessage) => void,
    private onTrack: (t: TrackMessage) => void = () => {},
  ) {
    this.open();
  }

  private open() {
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.connected = true;
      this.retry = 0;
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string);
      if (msg.type === 'theme') this.onTheme(msg as ThemeMessage);
      else if (msg.type === 'track') this.onTrack(msg as TrackMessage);
      else this.queue.push(msg as Frame);
    };
    ws.onclose = () => {
      this.connected = false;
      const delay = Math.min(4000, 250 * 2 ** this.retry++);
      setTimeout(() => this.open(), delay);
    };
  }

  poll(_now: number, sink: (f: Frame) => void) {
    // Frames are applied as they arrive; the render loop smooths them.
    if (this.queue.length > 400) this.queue.splice(0, this.queue.length - 400);
    for (const f of this.queue) sink(f);
    this.queue.length = 0;
  }
}

export class ReplayFeed implements Feed {
  connected = true;
  private i = 0;
  constructor(private frames: Frame[]) {}

  get duration() {
    return this.frames.length ? this.frames[this.frames.length - 1].t : 0;
  }

  poll(now: number, sink: (f: Frame) => void) {
    if (this.i > 0 && this.frames[this.i - 1].t > now + 0.5) this.i = 0; // rewound
    while (this.i < this.frames.length && this.frames[this.i].t <= now) {
      sink(this.frames[this.i++]);
    }
  }

  static async load(url: string): Promise<ReplayFeed> {
    const text = await (await fetch(url)).text();
    const frames = text
      .split('\n')
      .filter((l) => l.length > 2)
      .map((l) => JSON.parse(l) as Frame);
    return new ReplayFeed(frames);
  }
}

/** A friendly synthetic 122 BPM groove with a build and drop every 32 bars. */
export class DemoFeed implements Feed {
  connected = true;
  private t = 0;
  private beat = 0;
  private phase = 0;
  private phraseOn = false;

  poll(now: number, sink: (f: Frame) => void) {
    const hop = 512 / 48000;
    const bpm = 122;
    while (this.t + hop <= now) {
      this.t += hop;
      this.phase += (hop * bpm) / 60;
      let hit = false;
      if (this.phase >= 1) {
        this.phase -= 1;
        this.beat++;
        hit = true;
      }
      const bar = Math.floor(this.beat / 4) % 32;
      const building = bar >= 24 && bar < 28;
      const dropBar = bar === 28 && this.beat % 4 === 0 && hit;
      const breakdown = bar >= 20 && bar < 24;
      const energy = breakdown ? 0.35 : building ? 0.5 + (bar - 24) * 0.1 : bar >= 28 ? 0.95 : 0.7;
      const kick = hit && !breakdown && !building ? 0.9 : 0;
      const snare = hit && this.beat % 2 === 1 && !breakdown ? 0.7 : 0;
      const t8 = (this.phase * 2) % 1;
      const hat = t8 < hop * 4 ? 0.5 : 0;
      const sing = Math.sin(this.t * 0.35) > -0.2 && !building;
      let phrase = 0;
      if (sing !== this.phraseOn) {
        phrase = sing ? 1 : 2;
        this.phraseOn = sing;
      }
      const syl = sing && Math.sin(this.t * 2 * Math.PI * 3.1) > 0.97 ? 0.7 : 0;
      const vocalEnv = sing ? 0.35 + 0.35 * Math.max(0, Math.sin(this.t * 2 * Math.PI * 3.1)) : 0;
      const pump = Math.exp(-this.phase * 6);
      sink({
        t: this.t,
        silent: false,
        level: energy * (0.8 + 0.2 * pump),
        db: -14,
        bands: [
          breakdown ? 0.2 : 0.4 + 0.5 * pump,
          breakdown ? 0.25 : 0.5 + 0.45 * pump,
          0.5,
          0.55,
          0.5 + (building ? 0.3 : 0),
          0.4 + 0.3 * (1 - t8),
        ],
        brightness: 0.5 + (building ? 0.3 : 0),
        flux: kick ? 0.9 : snare ? 0.6 : 0.2,
        onset: kick || snare,
        kick,
        snare,
        hat,
        bpm,
        beatConf: 0.8,
        beatPhase: this.phase,
        beat: this.beat,
        barBeat: this.beat % 4,
        beatHit: hit,
        energy,
        energyLong: 0.65,
        build: building ? (bar - 24) / 4 : 0,
        drop: dropBar ? 1 : 0,
        calm: breakdown ? 0.6 : 0,
        density: 0.5,
        section: breakdown ? 0 : building ? 2 : bar >= 28 ? 3 : 1,
        vocal: sing ? 0.9 : 0.05,
        vocalEnv,
        syllable: syl,
        pitch: sing ? 0.4 * Math.sin(this.t * 0.9) : 0,
        pitchHz: sing ? 300 : 0,
        phrase,
      });
    }
  }
}
