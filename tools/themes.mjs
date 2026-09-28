// Theme sweep: render the same moment under every installed Omarchy theme
// and tile them (labelled) into one contact sheet.
//   node tools/themes.mjs [--shot wide] [--query "?demo"] [--steps 240] [--out out/themes.jpg]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const shot = opt('--shot', 'wide');
const query = opt('--query', '?demo');
const steps = Number(opt('--steps', '240'));
const out = opt('--out', `${ROOT}/out/themes_${shot}.jpg`);
const base = 'http://127.0.0.1:5188/';
const themes = JSON.parse(execFileSync('curl', ['-s', 'http://127.0.0.1:7477/themes']).toString());
const dir = `${ROOT}/out/themes`;
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'] });
const files = [];
for (const t of themes) {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await page.goto(`${base}${query}&theme=${t}&capture&frozen`);
  await page.waitForFunction(() => window.__wp?.ready, null, { timeout: 60000 });
  await page.evaluate(([s, n]) => {
    window.__wp.shot(s, 1);
    window.__wp.step(n);
  }, [shot, steps]);
  const f = `${dir}/${t}.png`;
  await page.screenshot({ path: f });
  files.push([t, f]);
  await page.close();
}
await browser.close();
const py = `
from PIL import Image, ImageDraw
import sys, json
items = json.loads(sys.argv[1]); cols = 4
W, H = 640, 360
rows = (len(items) + cols - 1) // cols
g = Image.new('RGB', (W * cols, H * rows), 'black')
for i, (name, f) in enumerate(items):
    im = Image.open(f).convert('RGB')
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 12 + 9 * len(name), 26], fill=(0, 0, 0))
    d.text((6, 6), name, fill=(255, 255, 255))
    g.paste(im, ((i % cols) * W, (i // cols) * H))
g = g.resize((g.width // 2, g.height // 2))
g.save(sys.argv[2], quality=88)
`;
execFileSync('uv', ['run', '-q', '--with', 'pillow', 'python', '-c', py, JSON.stringify(files), out]);
console.log('wrote', out);
