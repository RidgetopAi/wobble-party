// Live-path check: connect to a running brain and summarise what it hears.
//   node tools/probe.mjs [seconds] [ws://127.0.0.1:7477/ws]
const secs = Number(process.argv[2] ?? 10);
const url = process.argv[3] ?? 'ws://127.0.0.1:7477/ws';
const ws = new WebSocket(url);
let theme = null;
let track = null;
const frames = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.type === 'theme') theme = m;
  else if (m.type === 'track') track = m;
  else if (!m.type) frames.push(m);
};
ws.onerror = (e) => console.log('ws error', e.message ?? e);
await new Promise((r) => setTimeout(r, secs * 1000));
ws.close();
const n = frames.length;
const avg = (k) => frames.reduce((s, f) => s + f[k], 0) / Math.max(1, n);
const count = (k) => frames.filter((f) => f[k] > 0).length;
const last = frames[n - 1] ?? {};
console.log(`theme: ${theme?.name} (${Object.keys(theme?.colors ?? {}).length} colours)`);
console.log(`now playing: ${track ? `${track.title} — ${track.artist} via ${track.player} (${track.playing ? 'playing' : 'paused'})` : 'nothing'}`);
console.log(`frames: ${n} in ${secs}s (${(n / secs).toFixed(1)}/s), silent ${frames.filter((f) => f.silent).length}`);
console.log(`avg level ${avg('level').toFixed(2)} vocal ${avg('vocal').toFixed(2)}  kicks ${count('kick')} snares ${count('snare')} beats ${frames.filter((f) => f.beatHit).length}`);
console.log(`last: bpm ${last.bpm?.toFixed(1)} conf ${last.beatConf?.toFixed(2)} section ${last.section} db ${last.db?.toFixed(1)}`);
