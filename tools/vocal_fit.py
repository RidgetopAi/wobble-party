# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Vocal-detector feedback loop with real ground truth.

Mixes a cappella stems over instrumentals, labels vocal activity per analysis
frame from the a cappella alone, runs the real brain on the mix, then fits and
cross-validates the logistic presence model on the brain's feature vectors.

    uv run tools/vocal_fit.py            # build mixes (cached), fit, report
    uv run tools/vocal_fit.py --eval     # evaluate the weights currently in vocal.rs

Stems live in music/stems/{acap_*,inst_*}.mp3 (CC, from ccMixter).
"""

import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
STEMS = ROOT / "music/stems"
OUT = ROOT / "out/vocal2"
BRAIN = ROOT / "brain/target/release/wobble-brain"
SR = 48000
HOP = 512
WIN = 4096
SEG = 75.0  # seconds per mix


def decode(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-i", str(path)]
    if dur:
        cmd += ["-t", str(dur)]
    cmd += ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)


def rms_db(x):
    return 10 * np.log10(np.mean(x.astype(np.float64) ** 2) + 1e-12)


def label(lv):
    """1 where the a cappella is clearly singing: well above the stem's own
    noise floor and within 22 dB of its loud passages (drops breaths,
    reverb tails and hiss)."""
    ref, floor = np.percentile(lv, 95), np.percentile(lv, 5)
    return (lv > max(ref - 22, floor + 12, -60)).astype(np.float32)


def frame_levels(acap_mono, n_frames):
    """a cappella level (dB) in each analysis frame's vocal window."""
    lv = np.empty(n_frames)
    for k in range(n_frames):
        end = (k + 1) * HOP
        seg = acap_mono[max(0, end - WIN) : end]
        lv[k] = 10 * np.log10(np.mean(seg.astype(np.float64) ** 2) + 1e-12) if len(seg) else -120
    return lv


def build_mix(acap, inst, rng):
    name = f"{acap.stem}__{inst.stem}"
    wav = OUT / f"{name}.wav"
    npz = OUT / f"{name}.npz"
    if npz.exists() and wav.exists():
        return name
    a_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(acap)], capture_output=True, text=True).stdout)
    i_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(inst)], capture_output=True, text=True).stdout)
    a0 = rng.uniform(0, max(0.0, a_dur - SEG))
    i0 = rng.uniform(10, max(10.0, i_dur - SEG - 5))
    a = decode(acap, a0, SEG)
    b = decode(inst, i0, SEG)
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    # Vocal level relative to the instrumental: typical pop/EDM mixes sit
    # vocals around -2..-8 dB below the full backing in RMS terms.
    rel = rng.uniform(-9, -1)
    active = a[np.abs(a).max(axis=1) > 1e-3]
    va = rms_db(active) if len(active) else -60
    gain = 10 ** ((rms_db(b) + rel - va) / 20)
    mix = b + a * gain
    peak = np.abs(mix).max()
    if peak > 0.98:
        mix *= 0.98 / peak
        a = a * (0.98 / peak)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(wav)],
        input=mix.astype(np.float32).tobytes(),
        check=True,
    )
    n_frames = n // HOP
    lv = frame_levels(a.mean(axis=1) * gain, n_frames)
    np.savez(npz, lv=lv, rel=rel)
    return name


def analyse(name):
    js = OUT / f"{name}.jsonl"
    if not js.exists():
        subprocess.run([str(BRAIN), "analyze", str(OUT / f"{name}.wav"), "--features", "--out", str(js)], check=True)
    rows = [json.loads(l) for l in open(js)]
    X = np.array([r["vf"] for r in rows], dtype=np.float64)
    p = np.array([r["vocal"] for r in rows])
    y = label(np.load(OUT / f"{name}.npz")["lv"])
    n = min(len(X), len(y))
    return X[:n], y[:n], p[:n]


def auc(score, y):
    order = np.argsort(score)
    ranks = np.empty(len(score))
    ranks[order] = np.arange(1, len(score) + 1)
    pos = y > 0.5
    n1, n0 = pos.sum(), (~pos).sum()
    if n1 == 0 or n0 == 0:
        return float("nan")
    return (ranks[pos].sum() - n1 * (n1 + 1) / 2) / (n1 * n0)


def expand(X):
    """Temporal context: each feature plus its 0.25 s and 1 s causal means."""
    out = [X]
    for w in (24, 94):
        c = np.cumsum(np.vstack([np.zeros((1, X.shape[1])), X]), axis=0)
        idx = np.arange(1, len(X) + 1)
        lo = np.maximum(0, idx - w)
        out.append((c[idx] - c[lo]) / (idx - lo)[:, None])
    return np.hstack(out)


def fit_logistic(X, y, l2=1e-3, iters=3000, lr=0.5):
    mu, sd = X.mean(0), X.std(0) + 1e-6
    Z = (X - mu) / sd
    w = np.zeros(Z.shape[1])
    b = 0.0
    # Balance classes.
    wpos = 0.5 / max(y.mean(), 1e-3)
    wneg = 0.5 / max(1 - y.mean(), 1e-3)
    sw = np.where(y > 0.5, wpos, wneg)
    for _ in range(iters):
        p = 1 / (1 + np.exp(-(Z @ w + b)))
        g = (p - y) * sw
        w -= lr * (Z.T @ g / len(y) + l2 * w)
        b -= lr * g.mean()
    # Fold standardisation back into raw-feature weights.
    return w / sd, b - np.sum(w * mu / sd)


def predict(X, w, b):
    return 1 / (1 + np.exp(-(X @ w + b)))


def smooth(p, up=0.06, down=0.25, fps=SR / HOP):
    ku, kd = 1 - np.exp(-1 / (up * fps)), 1 - np.exp(-1 / (down * fps))
    out = np.empty_like(p)
    v = 0.0
    for i, x in enumerate(p):
        v += (x - v) * (ku if x > v else kd)
        out[i] = v
    return out


def report(tag, p, y):
    acc = np.mean((p > 0.5) == (y > 0.5))
    fp = np.mean(p[y < 0.5] > 0.5) if (y < 0.5).any() else float("nan")
    fn = np.mean(p[y > 0.5] <= 0.5) if (y > 0.5).any() else float("nan")
    print(f"  {tag:<28} AUC {auc(p, y):.3f}  acc {acc:.1%}  false+ {fp:.1%}  missed {fn:.1%}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval", action="store_true", help="only evaluate the in-brain presence output")
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(a.seed)
    acaps = sorted(STEMS.glob("acap_*.mp3"))
    insts = sorted(STEMS.glob("inst_*.mp3"))

    # Each a cappella over two different instrumentals.
    pairs = []
    for i, ac in enumerate(acaps):
        for j in range(2):
            pairs.append((ac, insts[(i * 2 + j) % len(insts)]))
    names = [build_mix(ac, ins, rng) for ac, ins in pairs]
    data = {n: analyse(n) for n in names}

    ys = np.concatenate([data[n][1] for n in names])
    print(f"{len(names)} mixes, {len(ys)} frames, vocal-active {ys.mean():.1%}")

    print("in-brain presence (current weights):")
    for grp in ("acap_rap", "acap_c", "acap_homesick", "acap_male"):
        sel = [n for n in names if n.startswith(grp)]
        report(grp, np.concatenate([data[n][2] for n in sel]), np.concatenate([data[n][1] for n in sel]))
    report("ALL", np.concatenate([data[n][2] for n in names]), ys)
    if a.eval:
        return

    # Leave-one-singer-out cross validation (instrumentals also rotate).
    print("\n5-fold, grouped by singer (raw features / with temporal context):")
    folds = [acaps[k::5] for k in range(5)]
    for ctx in (False, True):
        ps, yy = [], []
        for fold in folds:
            held = tuple(ac.stem + "__" for ac in fold)
            tr = [n for n in names if not n.startswith(held)]
            te = [n for n in names if n.startswith(held)]
            f = expand if ctx else (lambda x: x)
            Xtr = np.vstack([f(data[n][0]) for n in tr])
            ytr = np.concatenate([data[n][1] for n in tr])
            w, b = fit_logistic(Xtr, ytr)
            for n in te:
                ps.append(smooth(predict(f(data[n][0]), w, b)))
                yy.append(data[n][1])
        report("context" if ctx else "raw", np.concatenate(ps), np.concatenate(yy))

    Xall = np.vstack([data[n][0] for n in names])
    w, b = fit_logistic(Xall, ys)
    print("\nfull fit (raw features) -> paste into brain/src/analysis/vocal.rs:")
    print(f"pub const WEIGHTS: [f32; N_FEATURES] = [{', '.join(f'{x:.4f}' for x in w)}];")
    print(f"pub const BIAS: f32 = {b:.4f};")
    (OUT / "weights.json").write_text(json.dumps({"w": list(w), "b": b}))


if __name__ == "__main__":
    main()
