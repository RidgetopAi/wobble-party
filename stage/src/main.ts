/**
 * Wobble Party stage.
 *
 * Modes (query string):
 *   (default)          live: frames + theme from wobble-brain over /ws
 *   ?demo              built-in synthetic groove (no brain needed)
 *   ?replay=URL        pre-analysed frames (jsonl) on a virtual clock;
 *                      &t=SEC start time, &audio=URL play the song in sync
 *   ?lab               character lineup
 *   ?theme=NAME        preview an installed Omarchy theme
 *   ?quality=low|high  ?crowd=N
 *   ?capture&frozen    deterministic stepping for tools/*.mjs (window.__wp)
 */

import * as THREE from 'three';
import { DemoFeed, LiveFeed, ReplayFeed, type Feed, type ThemeMessage } from './feed';
import { Hud } from './hud';
import { startLab } from './lab';
import { Party } from './party';
import { paletteFrom } from './theme';
import type { ShotKind } from './director/camera';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
renderer.setPixelRatio(Math.min(devicePixelRatio, capture ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

if (params.has('lab')) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  startLab(renderer, params);
} else {
  void startParty();
}

async function startParty() {
  const quality = (params.get('quality') as 'high' | 'low') ?? 'high';
  const crowdN = Number(params.get('crowd') ?? (quality === 'high' ? 70 : 40));
  let currentTheme: ThemeMessage | null = null;
  let preview: string | null = params.get('theme');

  const party = new Party(renderer, paletteFrom({ name: 'default', colors: {} }), { quality, crowd: crowdN });
  const hud = new Hud(() => '#' + party.theme.p.lights[0].getHexString());

  const applyTheme = (msg: ThemeMessage, instant = false) => party.setPalette(paletteFrom(msg), instant);
  const loadNamed = async (name: string, instant = false) => {
    try {
      const r = await fetch(`themes/${encodeURIComponent(name)}`);
      if (r.ok) applyTheme((await r.json()) as ThemeMessage, instant);
    } catch {
      /* brain not reachable: keep the current palette */
    }
  };

  let feed: Feed;
  let clock = 0;
  let audio: HTMLAudioElement | null = null;
  const replayUrl = params.get('replay');
  if (replayUrl) {
    const rf = await ReplayFeed.load(replayUrl);
    feed = rf;
    clock = Number(params.get('t') ?? 0);
    const audioUrl = params.get('audio');
    if (audioUrl && !capture) {
      audio = new Audio(audioUrl);
      audio.currentTime = clock;
      addEventListener('click', () => void audio!.play(), { once: true });
      void audio.play().catch(() => hud.setStatus('click to start the music'));
    }
  } else if (params.has('demo')) {
    feed = new DemoFeed();
  } else {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    feed = new LiveFeed(
      `${proto}://${location.host}/ws`,
      (t) => {
        currentTheme = t;
        if (!preview) applyTheme(t, party.time < 0.5);
      },
      (t) => party.nowPlaying.onTrack(t),
    );
  }
  if (preview) await loadNamed(preview, true);
  // Replay/demo: `&title=..&artist=..` simulates a now-playing message.
  if (params.get('title')) {
    party.nowPlaying.onTrack({ type: 'track', playing: true, player: 'test', title: params.get('title')!, artist: params.get('artist') ?? '', art: params.get('art') });
  }

  // Debug: ?hide=lasers,haze,beams,spots,floor,wall,crowd isolates layers.
  const hide = new Set((params.get('hide') ?? '').split(',').filter(Boolean));
  party.debugHide(hide);

  // Replay/capture: fast-forward the simulation to the start time so the
  // springs, sections and camera are in a settled state.
  const simulate = (dt: number) => {
    if (audio && !audio.paused) clock = audio.currentTime;
    else clock += dt;
    feed.poll(clock, (f) => party.music.ingest(f));
    party.step(dt);
  };
  if (replayUrl && clock > 0) {
    const target = clock;
    clock = Math.max(0, target - 20);
    party.music.presence = 0;
    const until = target;
    while (clock < until) simulate(1 / 30);
  }

  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight);
    party.resize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);
  onResize();

  // Keyboard.
  const shotKeys: ShotKind[] = ['wide', 'djClose', 'djReverse', 'crowdDolly', 'heroClose', 'crane', 'overhead', 'orbit', 'stageSide'];
  let themeList: string[] = [];
  let themeIdx = -1;
  addEventListener('keydown', async (e) => {
    if (e.key === 'd') hud.toggleDebug();
    else if (e.key === 'h') hud.toggleHelp();
    else if (e.key === 'f') {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } else if (e.key === ' ') {
      party.cam.locked = null;
      party.cam.go(shotKeys[Math.floor(Math.random() * shotKeys.length)], 12, 0);
    } else if (e.key >= '1' && e.key <= '9') {
      const k = shotKeys[Number(e.key) - 1];
      party.cam.locked = k;
      party.cam.go(k, 1e6, 0.8);
    } else if (e.key === '0') {
      party.cam.locked = null;
    } else if (e.key === 't') {
      if (!themeList.length) themeList = (await (await fetch('themes')).json()) as string[];
      themeIdx = (themeIdx + 1) % themeList.length;
      preview = themeList[themeIdx];
      await loadNamed(preview);
      hud.setStatus(`theme preview: <b>${preview}</b> (T to return)`);
    } else if (e.key === 'T') {
      preview = null;
      if (currentTheme) applyTheme(currentTheme);
    } else if (e.key === 'q' || e.key === 'Escape') {
      window.close();
    }
  });

  // Test/capture API.
  const api = {
    ready: true,
    party,
    step(n: number, dt = 1 / 30) {
      for (let i = 0; i < n; i++) simulate(dt);
      party.render();
    },
    get clock() {
      return clock;
    },
    shot(kind: ShotKind, t = 0) {
      party.cam.locked = kind;
      party.cam.go(kind, 1e6, 0);
      party.cam.current.t = t;
    },
    info() {
      const m = party.music;
      return { clock, bpm: m.bpm, section: m.section, hype: m.hype, vocal: m.vocal, shot: party.cam.current.kind, theme: party.theme.p.name };
    },
  };
  (window as unknown as { __wp: typeof api }).__wp = api;

  // Keep the screen awake while the party is playing (Chromium maps the
  // Wake Lock API to Wayland idle-inhibit, which hypridle honours).
  let wake: WakeLockSentinel | null = null;
  const wantWake = () => !capture && party.music.playing && document.visibilityState === 'visible';
  setInterval(async () => {
    try {
      if (wantWake() && !wake) {
        wake = await navigator.wakeLock.request('screen');
        wake.addEventListener('release', () => (wake = null));
      } else if (!wantWake() && wake) {
        await wake.release();
        wake = null;
      }
    } catch {
      /* not allowed (e.g. hidden tab): try again later */
    }
  }, 2000);

  let last = performance.now();
  let fpsAcc = 0;
  let fpsN = 0;
  let fps = 0;
  renderer.setAnimationLoop(() => {
    if (params.has('frozen')) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    simulate(dt);
    party.render();
    fpsAcc += dt;
    fpsN++;
    if (fpsAcc > 1) {
      fps = fpsN / fpsAcc;
      fpsAcc = fpsN = 0;
    }
    if (feed instanceof LiveFeed) {
      hud.setStatus(
        feed.connected
          ? `♪ Wobble Party is listening — play something in <b>cliamp</b>, Spotify or anything else`
          : `waiting for the wobble brain…`,
      );
    }
    hud.update(dt, party.music, `${fps.toFixed(0)} fps · ${party.cam.current.kind} · ${party.theme.p.name}`);
  });
}
