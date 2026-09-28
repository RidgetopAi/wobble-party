# Cut B (vertical 9:16): cold open on the drop, 16 bars 37.95 -> 67.97, no
# desktop opener. Shared by render_B + assemble_B.
BEAT = 60 / 127.9
BAR = 4 * BEAT
DROP = 37.95
S0 = DROP                    # song time at video 0
FPS = 60
W, H = 1080, 1920

def seg(k0, beats, theme, shot):
    return dict(t=DROP + k0 * BAR, beats=beats, theme=theme, shot=shot)

# Portrait-friendly shots only (djReverse / stageSide read poorly at 9:16).
SEGS = [
    seg(0, 8, 'hackerman', 'orbit'),
    seg(2, 4, 'tokyo-night', 'heroClose'),
    seg(3, 4, 'gruvbox', 'djClose'),
    seg(4, 4, 'catppuccin-latte', 'crowdDolly'),
    seg(5, 4, 'rose-pine', 'overhead'),
]
fast = [('kanagawa', 'heroClose'), ('white', 'djClose'), ('vantablack', 'orbit'), ('nord', 'crowdDolly'),
        ('osaka-jade', 'heroClose'), ('ristretto', 'crane'), ('everforest', 'overhead'), ('lumon', 'djClose')]
for i, (th, sh) in enumerate(fast):
    SEGS.append(dict(t=DROP + 6 * BAR + i * BEAT, beats=1, theme=th, shot=sh))
SEGS += [
    seg(8, 8, 'catppuccin', 'heroClose'),
    seg(10, 8, 'ethereal', 'djClose'),
    seg(12, 4, 'retro-82', 'overhead'),
    seg(13, 12, 'hackerman', 'wide'),    # end card plate (3 bars: fade + hold)
]

def frames(s):
    """Frame-exact [a, b) on the video's 60 fps grid."""
    a = round((s['t'] - S0) * FPS)
    b = round((s['t'] + s['beats'] * BEAT - S0) * FPS)
    return a, b

def clip(i, s):
    return f"out/promo/B/{i:02d}_{s['shot']}_{s['theme']}.mp4"
