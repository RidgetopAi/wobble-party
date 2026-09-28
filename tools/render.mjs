// Motion feedback loop: render a song section frame-by-frame on the
// deterministic clock, then mux with the audio.
//
//   node tools/render.mjs <track> --start 60 --dur 20 [--fps 30] [--size 1280x720]
//        [--shot kind] [--sheet N] [--theme name] [--query "&x=y"]
//
// <track> is a name under music/cc (mp3) with analysis in out/<track>.jsonl
// (made by `wobble-brain analyze`). Writes out/render/<track>_<start>.mp4 and,
// with --sheet N, a contact sheet of N evenly spaced frames.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const track = args[0];
const start = Number(opt('--start', '60'));
const dur = Number(opt('--dur', '15'));
const fps = Number(opt('--fps', '30'));
const [w, h] = opt('--size', '1280x720').split('x').map(Number);
const sheet = Number(opt('--sheet', '0'));
const shot = opt('--shot', null);
const theme = opt('--theme', null);
const extra = opt('--query', '');
const base = opt('--base', 'http://127.0.0.1:5188/');
const audioPath = fs.existsSync(`${ROOT}/music/cc/${track}.mp3`) ? `${ROOT}/music/cc/${track}.mp3` : opt('--audio', null);
const jsonl = `${ROOT}/out/${track}.jsonl`;
const outDir = `${ROOT}/out/render/${track}_${start}`;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium',
  headless: true,
  args: ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: w, height: h } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route('**/replay/**', (route) => route.fulfill({ path: jsonl, contentType: 'text/plain' }));
let q = `?replay=replay/${track}.jsonl&t=${start}&capture&frozen${extra}`;
if (theme) q += `&theme=${encodeURIComponent(theme)}`;
await page.goto(base + q);
await page.waitForFunction(() => window.__wp?.ready, null, { timeout: 120000 });
if (shot) await page.evaluate((s) => window.__wp.shot(s, 0), shot);
const n = Math.round(dur * fps);
const t0 = Date.now();
const infos = [];
for (let i = 0; i < n; i++) {
  const info = await page.evaluate((dt) => {
    window.__wp.step(1, dt);
    return window.__wp.info();
  }, 1 / fps);
  infos.push(info);
  await page.screenshot({ path: `${outDir}/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
}
await browser.close();
const secs = (Date.now() - t0) / 1000;
console.log(`rendered ${n} frames in ${secs.toFixed(0)}s (${(n / secs).toFixed(1)} fps)`);
fs.writeFileSync(`${outDir}/info.json`, JSON.stringify(infos));

const mp4 = `${ROOT}/out/render/${track}_${start}${shot ? '_' + shot : ''}${theme ? '_' + theme : ''}.mp4`;
const ff = ['-v', 'error', '-y', '-framerate', String(fps), '-i', `${outDir}/%05d.jpg`];
if (audioPath) ff.push('-ss', String(start), '-t', String(dur), '-i', audioPath);
ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'fast');
if (audioPath) ff.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
ff.push(mp4);
execFileSync('ffmpeg', ff);
console.log('wrote', mp4);

if (sheet > 0) {
  const pick = Array.from({ length: sheet }, (_, k) => Math.floor((k * (n - 1)) / Math.max(1, sheet - 1)));
  const cols = Math.ceil(Math.sqrt(sheet));
  const listFile = `${outDir}/sheet.txt`;
  const tile = pick.map((i) => `${outDir}/${String(i).padStart(5, '0')}.jpg`);
  fs.writeFileSync(listFile, tile.map((f) => `file '${f}'`).join('\n'));
  const sheetPath = mp4.replace('.mp4', '_sheet.jpg');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', `scale=480:-1,tile=${cols}x${Math.ceil(sheet / cols)}:padding=4`, '-frames:v', '1', sheetPath]);
  console.log('wrote', sheetPath, 'frames', pick.map((i) => (start + i / fps).toFixed(2)).join(' '));
}
