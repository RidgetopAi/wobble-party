import subprocess, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from segments import SEGS, S0, FPS, frames, BEAT
FONT = '/usr/share/fonts/TTF/JetBrainsMonoNerdFont-Bold.ttf'
inputs = ['-i', 'out/promo/opener_A.mp4']
chains, labels = [], []
OPEN_N = frames(SEGS[0])[0]
chains.append(f"[0:v]trim=end_frame={OPEN_N},setpts=PTS-STARTPTS[o]"); labels.append('[o]')
for i, s in enumerate(SEGS, start=1):
    a, b = frames(s)
    start = S0 + a / FPS
    inputs += ['-i', f"out/render/wobble_party_{start:.4f}_{s['shot']}_{s['theme']}.mp4"]
    chains.append(f"[{i}:v]trim=end_frame={b - a},setpts=PTS-STARTPTS,format=yuv420p[s{i}]"); labels.append(f'[s{i}]')
TOTAL = frames(SEGS[-1])[1]
dur = TOTAL / FPS
card = frames(SEGS[-1])[0] / FPS           # end card starts here
LOGO = '/home/ridgetop/livestream/overlays/logo_traced.png'
BAR = 4 * BEAT
fade = lambda d: f"alpha='min(1,max(0,(t-{card + d:.3f})/{BEAT:.3f}))'"
txt = lambda text, size, color, y, d, extra='': (
    f"drawtext=fontfile={FONT}:text='{text}':fontsize={size}:fontcolor={color}:x=(w-tw)/2:y={y}:{extra}{fade(d)}")
n_in = len(labels)
inputs += ['-f', 'lavfi', '-i', f'color=c=black:s=1920x1080:r={FPS}:d={dur:.4f}',
           '-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.4f}', '-i', LOGO]
BLACK, LOGO_IN = n_in, n_in + 1
fc = (';'.join(chains) + ';' + ''.join(labels) + f"concat=n={n_in}:v=1:a=0,fps={FPS}[party];"
      # party fades toward black over the first bar of the card
      f"[{BLACK}:v]format=rgba,fade=t=in:st={card:.3f}:d={BAR:.3f}:alpha=1,colorchannelmixer=aa=0.78[dim];"
      f"[party][dim]overlay=shortest=1[pd];"
      # logo: black-on-transparent -> white, fades in on the card's 2nd beat
      f"[{LOGO_IN}:v]format=rgba,lutrgb=r=negval:g=negval:b=negval,scale=-1:340,"
      f"fade=t=in:st={card + BEAT:.3f}:d={BEAT:.3f}:alpha=1[logo];"
      f"[pd][logo]overlay=x=(W-w)/2:y=70[pl];"
      "[pl]" + ','.join([
          txt('WOBBLE PARTY', 104, 'white', 450, 2 * BEAT),
          txt('a music-reactive party for Omarchy', 40, '0xddf7ff', 578, 3 * BEAT),
          txt('omarchy plugin add https\\://github.com/RidgetopAi/wobble-party', 36, '0x82FB9C', 700, 4 * BEAT,
              'box=1:boxcolor=0x0B0C16@0.9:boxborderw=22:'),
          txt('COMING SOON', 46, '0x82FB9C', 800, 5 * BEAT),
      ]) + '[v]')
audio = ['-ss', f'{S0:.4f}', '-t', f'{dur:.4f}', '-i', 'music/Wobble Party.mp3']
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, *audio, '-filter_complex',
       fc + f";[{n_in + 2}:a]afade=t=out:st={dur - 2.5:.3f}:d=2.5[a]",
       '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-profile:v', 'high',
       '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', '-r', str(FPS),
       'out/promo/wobble_party_X.mp4']
subprocess.run(cmd, check=True)
print('wrote out/promo/wobble_party_X.mp4', f'{dur:.3f}s')
