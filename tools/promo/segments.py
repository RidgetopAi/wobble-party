# Cut A (X, 16:9) party segments after the opener. Shared by render + assemble.
BEAT = 60 / 127.9
BAR = 4 * BEAT
DROP = 37.95
S0 = DROP - 3 * BAR          # song time at video 0
FPS = 60

def seg(k0, beats, theme, shot):
    return dict(t=DROP + k0 * BAR, beats=beats, theme=theme, shot=shot)

SEGS = [
    seg(0, 4, 'hackerman', 'wide'),
    seg(1, 4, 'tokyo-night', 'orbit'),
    seg(2, 4, 'catppuccin-latte', 'crowdDolly'),
    seg(3, 4, 'gruvbox', 'djClose'),
    seg(4, 4, 'rose-pine', 'overhead'),
    seg(5, 4, 'retro-82', 'crane'),
]
fast = [('kanagawa', 'wide'), ('white', 'heroClose'), ('vantablack', 'orbit'), ('nord', 'stageSide'),
        ('osaka-jade', 'crowdDolly'), ('ristretto', 'djReverse'), ('everforest', 'overhead'), ('lumon', 'wide')]
for i, (th, sh) in enumerate(fast):
    SEGS.append(dict(t=DROP + 6 * BAR + i * BEAT, beats=1, theme=th, shot=sh))
SEGS += [
    seg(8, 8, 'catppuccin', 'heroClose'),
    seg(10, 8, 'ethereal', 'crowdDolly'),
    seg(12, 8, 'last-horizon', 'djClose'),
    seg(14, 16, 'hackerman', 'wide'),    # end card plate (4 bars: fade + hold)
]

def frames(s):
    """Frame-exact [a, b) on the video's 60 fps grid."""
    a = round((s['t'] - S0) * FPS)
    b = round((s['t'] + s['beats'] * BEAT - S0) * FPS)
    return a, b
