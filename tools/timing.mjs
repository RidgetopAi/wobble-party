// Motion timing check: run a song section headlessly and measure where the
// crowd's landings fall relative to the dance beat. Target: tight cluster at
// phase 0 (on the beat), error in milliseconds.
//   node tools/timing.mjs <track> --start 30 --dur 40
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const track = args[0];
const start = Number(opt('--start', '30'));
const dur = Number(opt('--dur', '40'));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
await page.route('**/replay/**', (r) => r.fulfill({ path: `${ROOT}/out/${track}.jsonl`, contentType: 'text/plain' }));
await page.goto(`http://127.0.0.1:5188/?replay=replay/${track}.jsonl&t=${start}&capture&frozen&quality=low`);
await page.waitForFunction(() => window.__wp?.ready, null, { timeout: 120000 });
const res = await page.evaluate((n) => {
  const p = window.__wp.party;
  p.landings.length = 0;
  for (let i = 0; i < n; i++) window.__wp.step(1, 1 / 60);
  return p.landings.filter((l) => l.speed > 0.8);
}, Math.round(dur * 60));
await browser.close();
const errs = res.map((l) => {
  let ph = l.beat - Math.floor(l.beat);
  if (ph > 0.5) ph -= 1;
  return { ph, ms: (ph * 60000) / l.bpm };
});
errs.sort((a, b) => a.ms - b.ms);
const q = (p) => errs[Math.floor(p * (errs.length - 1))]?.ms ?? NaN;
const within = (ms) => errs.filter((e) => Math.abs(e.ms) <= ms).length / Math.max(1, errs.length);
console.log(`${track} @${start}s +${dur}s: ${errs.length} landings`);
console.log(`  error ms  p10 ${q(0.1).toFixed(0)}  p25 ${q(0.25).toFixed(0)}  median ${q(0.5).toFixed(0)}  p75 ${q(0.75).toFixed(0)}  p90 ${q(0.9).toFixed(0)}`);
console.log(`  within ±30ms ${(within(30) * 100).toFixed(0)}%   within ±60ms ${(within(60) * 100).toFixed(0)}%`);
const hist = new Array(10).fill(0);
for (const e of errs) hist[Math.min(9, Math.floor((e.ph + 0.5) * 10))]++;
console.log('  phase histogram (-0.5..0.5):', hist.join(' '));
