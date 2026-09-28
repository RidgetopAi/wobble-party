// Motion strip: N consecutive frames at a given rate, tiled — for judging
// squash, tilt, arms and lip-sync across a beat or two.
//   node tools/strip.mjs <track> --start 60 --frames 16 --fps 15 --shot heroClose [--hero 0]
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const track = args[0];
const start = Number(opt('--start', '60'));
const frames = Number(opt('--frames', '16'));
const fps = Number(opt('--fps', '15'));
const shot = opt('--shot', 'heroClose');
const hero = opt('--hero', null);
const out = opt('--out', `${ROOT}/out/strip_${track}_${start}_${shot}.jpg`);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
await page.route('**/replay/**', (r) => r.fulfill({ path: `${ROOT}/out/${track}.jsonl`, contentType: 'text/plain' }));
await page.goto(`http://127.0.0.1:5188/?replay=replay/${track}.jsonl&t=${start}&capture&frozen`);
await page.waitForFunction(() => window.__wp?.ready, null, { timeout: 120000 });
await page.evaluate(([s, h]) => {
  window.__wp.shot(s, 0);
  if (h !== null) window.__wp.party.cam.current.hero = Number(h);
}, [shot, hero]);
const dir = `${ROOT}/out/strip`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const log = [];
for (let i = 0; i < frames; i++) {
  const info = await page.evaluate((dt) => {
    window.__wp.step(Math.round(60 * dt), 1 / 60);
    const m = window.__wp.party.music;
    return { beat: m.danceBeatPos.toFixed(2), mouth: m.mouth.toFixed(2), vocal: m.vocal.toFixed(2) };
  }, 1 / fps);
  log.push(info);
  await page.screenshot({ path: `${dir}/${String(i).padStart(3, '0')}.png` });
}
await browser.close();
const cols = Math.ceil(Math.sqrt(frames));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', `${dir}/%03d.png`, '-vf', `tile=${cols}x${Math.ceil(frames / cols)}:padding=3`, '-frames:v', '1', out]);
console.log('wrote', out);
log.forEach((l, i) => console.log(i, 'beat', l.beat, 'mouth', l.mouth, 'vocal', l.vocal));
