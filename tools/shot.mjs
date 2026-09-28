// Visual feedback loop: open a stage URL in Chromium (GPU), let it settle,
// step the deterministic clock, save a screenshot.
//
//   node tools/shot.mjs "?lab" out/lab.png [--size 1600x900] [--steps 60] [--base URL]
//   node tools/shot.mjs "?replay=..&t=42" out/x.png
import { createRequire } from 'node:module';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const query = args[0] ?? '?lab';
const out = args[1] ?? 'out/shot.png';
const [w, h] = opt('--size', '1600x900').split('x').map(Number);
const steps = Number(opt('--steps', '30'));
const base = opt('--base', 'http://127.0.0.1:5188/');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium',
  headless: true,
  args: ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: w, height: h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const sep = query.includes('?') ? '&' : '?';
await page.goto(base + query + sep + 'capture&frozen', { waitUntil: 'load' });
await page.waitForFunction(() => window.__wp?.ready, null, { timeout: 60000 });
const shotKind = opt('--shot', null);
const info = await page.evaluate(([n, shot]) => {
  if (shot) window.__wp.shot(shot, 2);
  window.__wp.step(n);
  const gl = document.querySelector('canvas').getContext('webgl2');
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';
}, [steps, shotKind]);
await page.screenshot({ path: out });
console.log('renderer:', info);
for (const l of logs.slice(0, 20)) console.log(l);
await browser.close();
console.log('wrote', out);
