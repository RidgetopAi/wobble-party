import subprocess, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from segments import SEGS, S0, FPS, frames
for s in SEGS:
    a, b = frames(s)
    start = S0 + a / FPS
    dur = (b - a + 2) / FPS
    out = f"out/render/wobble_party_{start:.4f}_{s['shot']}_{s['theme']}.mp4"
    if os.path.exists(out): print('have', out); continue
    subprocess.run(['node', 'tools/render.mjs', 'wobble_party', '--start', f'{start:.4f}', '--dur', f'{dur:.4f}',
                    '--fps', str(FPS), '--size', '1920x1080', '--shot', s['shot'], '--theme', s['theme']], check=True)
