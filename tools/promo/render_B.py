# Render cut B's segments at 1080x1920. Run from the repo root.
import subprocess, sys, os, shutil
sys.path.insert(0, os.path.dirname(__file__))
from segments_B import SEGS, S0, FPS, W, H, frames, clip
os.makedirs('out/promo/B', exist_ok=True)
for i, s in enumerate(SEGS):
    out = clip(i, s)
    if os.path.exists(out): print('have', out); continue
    a, b = frames(s)
    start = S0 + a / FPS
    dur = (b - a + 2) / FPS
    st = repr(float(f'{start:.4f}'))   # as render.mjs prints Number(start)
    subprocess.run(['node', 'tools/render.mjs', 'wobble_party', '--start', st, '--dur', f'{dur:.4f}',
                    '--fps', str(FPS), '--size', f'{W}x{H}', '--shot', s['shot'], '--theme', s['theme']], check=True)
    shutil.move(f"out/render/wobble_party_{st}_{s['shot']}_{s['theme']}.mp4", out)
