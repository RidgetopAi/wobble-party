// Crowd activity feedback loop: step a song section on the deterministic
// clock (no screenshots) and report how much the crowd moves compared with
// the heroes and the yellow star-glasses hero, with the defaults and with
// each set of tuning dials given.
//
//   node tools/activity.mjs <track> --start 60 --dur 40 [--query "&energy=0.2&hop=0.4"]...
//
// Each --query adds a column set; the defaults always run first. Needs the
// stage dev server (port 5188) and out/<track>.jsonl like tools/render.mjs.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const track = args[0];
const start = Number(opt('--start', '60'));
const dur = Number(opt('--dur', '40'));
const base = opt('--base', 'http://127.0.0.1:5188/');
const queries = [''];
args.forEach((a, i) => a === '--query' && queries.push(args[i + 1].startsWith('&') ? args[i + 1] : '&' + args[i + 1]));
const jsonl = `${ROOT}/out/${track}.jsonl`;
if (!track || !fs.existsSync(jsonl)) {
  console.error(`usage: node tools/activity.mjs <track> [--start s] [--dur s] [--query "&k=v"]...  (needs ${jsonl})`);
  process.exit(1);
}

const SECTIONS = ['calm', 'groove', 'build', 'peak'];
const STEP = 0.5;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium',
  headless: true,
  args: ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'],
});

async function run(extra) {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.route('**/replay/**', (route) => route.fulfill({ path: jsonl, contentType: 'text/plain' }));
  await page.goto(`${base}?replay=replay/${track}.jsonl&t=${start}&capture&frozen&quality=low${extra}`);
  await page.waitForFunction(() => window.__wp?.ready, null, { timeout: 120000 });
  const out = [];
  for (let t = 0; t < dur; t += STEP) {
    out.push(await page.evaluate((s) => (window.__wp.step(Math.round(s * 30), 1 / 30), window.__wp.info()), STEP));
  }
  await page.close();
  return out;
}

const runs = [];
for (const q of queries) runs.push(await run(q));
await browser.close();

const pct = (v) => `${Math.round(v * 100)}%`.padStart(5);
const f2 = (v) => v.toFixed(2).padStart(5);
const label = (q) => (q ? q.slice(1) : 'defaults');

// Per 4 s: section, hype, then per run crowd hops/beat and crowd motion vs yellow.
console.log(`\n${track} ${start}-${start + dur}s   hops = crowd beat-hops per dancer per beat, mv = crowd motion vs yellow`);
console.log('   time  section  ' + queries.map((q, i) => `| run ${i}: hype  hops   mv`).join(' '));
const per = Math.round(4 / STEP);
for (let i = per - 1; i < runs[0].length; i += per) {
  const base0 = runs[0][i];
  let line = `${base0.clock.toFixed(0).padStart(7)}  ${SECTIONS[base0.section].padEnd(7)}  `;
  for (const r of runs) {
    const a = r[i].activity;
    line += `|        ${f2(r[i].hype)} ${f2(a.crowd.hops)} ${pct(a.yellow.motion > 1e-3 ? a.crowd.motion / a.yellow.motion : 0)} `;
  }
  console.log(line);
}

console.log('\nmeans over the section (after the first 4 s window fills):');
const skip = per;
queries.forEach((q, i) => {
  const r = runs[i].slice(skip);
  const mean = (fn) => r.reduce((s, x) => s + fn(x), 0) / Math.max(1, r.length);
  const g = (k, key) => mean((x) => x.activity[k][key]);
  console.log(`  run ${i} (${label(q)})`);
  console.log(`    hype ${f2(mean((x) => x.hype))}`);
  for (const k of ['crowd', 'heroes', 'yellow']) {
    console.log(`    ${k.padEnd(7)} hops/beat ${f2(g(k, 'hops'))}  twitch/beat ${f2(g(k, 'twitch'))}  motion ${f2(g(k, 'motion'))}  swirling ${pct(g(k, 'swirling'))}`);
  }
  const ym = g('yellow', 'motion');
  console.log(`    crowd motion vs yellow ${pct(ym > 1e-3 ? g('crowd', 'motion') / ym : 0)}`);
});
