# Assemble cut B (vertical): frame-exact concat, end card, audio. Repo root.
import subprocess, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from segments_B import SEGS, S0, FPS, W, H, frames, clip, BEAT, BAR
FONT = '/usr/share/fonts/TTF/JetBrainsMonoNerdFont-Bold.ttf'
LOGO = '/home/ridgetop/livestream/overlays/logo_traced.png'
OUT = 'out/promo/wobble_party_vertical.mp4'
inputs, chains, labels = [], [], []
for i, s in enumerate(SEGS):
    a, b = frames(s)
    inputs += ['-i', clip(i, s)]
    chains.append(f"[{i}:v]trim=end_frame={b - a},setpts=PTS-STARTPTS,format=yuv420p[s{i}]"); labels.append(f'[s{i}]')
TOTAL = frames(SEGS[-1])[1]
dur = TOTAL / FPS
card = frames(SEGS[-1])[0] / FPS
fade = lambda d: f"alpha='min(1,max(0,(t-{card + d:.3f})/{BEAT:.3f}))'"
txt = lambda text, size, color, y, d, extra='': (
    f"drawtext=fontfile={FONT}:text='{text}':fontsize={size}:fontcolor={color}:x=(w-tw)/2:y={y}:{extra}{fade(d)}")
n_in = len(labels)
inputs += ['-f', 'lavfi', '-i', f'color=c=black:s={W}x{H}:r={FPS}:d={dur:.4f}',
           '-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.4f}', '-i', LOGO]
BLACK, LOGO_IN = n_in, n_in + 1
box = 'box=1:boxcolor=0x0B0C16@0.9:boxborderw=18:'
fc = (';'.join(chains) + ';' + ''.join(labels) + f"concat=n={n_in}:v=1:a=0,fps={FPS}[party];"
      f"[{BLACK}:v]format=rgba,fade=t=in:st={card:.3f}:d={BAR:.3f}:alpha=1,colorchannelmixer=aa=0.78[dim];"
      f"[party][dim]overlay=shortest=1[pd];"
      f"[{LOGO_IN}:v]format=rgba,lutrgb=r=negval:g=negval:b=negval,scale=-1:320,"
      f"fade=t=in:st={card + BEAT:.3f}:d={BEAT:.3f}:alpha=1[logo];"
      f"[pd][logo]overlay=x=(W-w)/2:y=400[pl];"
      "[pl]" + ','.join([
          txt('WOBBLE PARTY', 112, 'white', 790, 2 * BEAT),
          txt('a music-reactive party', 44, '0xddf7ff', 940, 3 * BEAT),
          txt('for Omarchy', 44, '0xddf7ff', 1000, 3 * BEAT),
          txt('omarchy plugin add', 34, '0x82FB9C', 1150, 4 * BEAT, box),
          txt('https\\://github.com/RidgetopAi/wobble-party', 34, '0x82FB9C', 1215, 4 * BEAT, box),
          txt('COMING SOON', 52, '0x82FB9C', 1360, 5 * BEAT),
      ]) + '[v]')
audio = ['-ss', f'{S0:.4f}', '-t', f'{dur:.4f}', '-i', 'music/Wobble Party.mp3']
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, *audio, '-filter_complex',
       fc + f";[{n_in + 2}:a]afade=t=out:st={dur - 2.5:.3f}:d=2.5[a]",
       '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-profile:v', 'high',
       '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-r', str(FPS), OUT]
subprocess.run(cmd, check=True)
print('wrote', OUT, f'{dur:.3f}s')
