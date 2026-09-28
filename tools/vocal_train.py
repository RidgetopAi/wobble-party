# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "torch"]
# ///
"""Train the singing-voice network the brain runs live.

1. Build augmented mixes from music/stems (a cappella x instrumental), with
   frame labels from the dry vocal: presence (singing or not) and level.
2. Compute input features with the real brain (`wobble-brain features`),
   so training and runtime see bit-identical inputs.
3. Train a small causal GRU; validate on held-out singers + instrumentals.
4. Export brain/model/vocal.bin (WPN1 format, read by brain/src/analysis/net.rs).

    uv run tools/vocal_train.py --mixes 900 --epochs 25
    uv run tools/vocal_train.py --reuse          # skip data generation
"""

import argparse
import hashlib
import struct
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parent.parent
STEMS = ROOT / "music/stems"
DATA = ROOT / "out/vtrain"
BRAIN = ROOT / "brain/target/release/wobble-brain"
MODEL = ROOT / "brain/model/vocal.bin"
SR, HOP, WIN = 48000, 512, 2048
N_FEAT = 128
SEG = 40.0


# ---------------------------------------------------------------- audio utils

def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    ).stdout
    return float(out)


def decode(path, start=0.0, dur=None, rate=SR):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", str(path)]
    if dur:
        cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-f", "f32le", "-ac", "2", "-ar", str(rate), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def frame_db(mono, n_frames):
    """Level (dB) of each analysis frame's window (matches the mel window)."""
    sq = np.concatenate([[0.0], np.cumsum(mono.astype(np.float64) ** 2)])
    ends = (np.arange(n_frames) + 1) * HOP
    starts = np.maximum(0, ends - WIN)
    ends = np.minimum(ends, len(mono))
    e = (sq[ends] - sq[starts]) / np.maximum(ends - starts, 1)
    return 10 * np.log10(e + 1e-12)


def stem_stats(path):
    """Per-stem reference levels, computed once over the whole a cappella."""
    x = decode(path, rate=16000).mean(axis=1)
    fr = x[: len(x) // 1365 * 1365].reshape(-1, 1365)
    lv = 10 * np.log10((fr.astype(np.float64) ** 2).mean(1) + 1e-12)
    return float(np.percentile(lv, 95)), float(np.percentile(lv, 5))


def random_eq(x, rng):
    """Smooth random EQ curve applied in the frequency domain."""
    n = len(x)
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(n, 1 / SR)
    logf = np.log2(np.maximum(f, 20) / 20)
    pts = rng.uniform(-6, 6, 8)
    curve_db = np.interp(logf, np.linspace(0, 10, 8), pts)
    spec *= (10 ** (curve_db / 20))[:, None]
    return np.fft.irfft(spec, n=n, axis=0).astype(np.float32)


def reverb(x, rng):
    t60 = rng.uniform(0.3, 2.2)
    n = int(t60 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)).astype(np.float32) * np.exp(-6.9 * t / t60)[:, None]
    ir[:, :] *= 1 / np.sqrt((ir ** 2).sum(0))
    L = len(x) + n
    nfft = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, nfft, axis=0) * np.fft.rfft(ir, nfft, axis=0), nfft, axis=0)[: len(x)]
    mix = rng.uniform(0.1, 0.45)
    return (x * (1 - mix) + wet.astype(np.float32) * mix * 2).astype(np.float32)


def lowpass(x, cutoff):
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= (1 / (1 + (f / cutoff) ** 8))[:, None]
    return np.fft.irfft(spec, n=len(x), axis=0).astype(np.float32)


def width(x, w):
    mid = (x[:, 0] + x[:, 1]) * 0.5
    side = (x[:, 0] - x[:, 1]) * 0.5 * w
    return np.stack([mid + side, mid - side], axis=1)


def rms_db(x):
    return 10 * np.log10(np.mean(x.astype(np.float64) ** 2) + 1e-12)


# ---------------------------------------------------------------- dataset

def make_example(i, acaps, insts, stats, seed):
    rng = np.random.default_rng(seed + i * 7919)
    kind = rng.choice(["mix", "inst", "acap"], p=[0.8, 0.14, 0.06])
    ac = acaps[rng.integers(len(acaps))]
    ins = insts[rng.integers(len(insts))]
    a_dur, i_dur = stats[ac]["dur"], stats[ins]["dur"]
    seg = SEG
    b = decode(ins, rng.uniform(0, max(0.0, i_dur - seg)), seg)
    a = decode(ac, rng.uniform(0, max(0.0, a_dur - seg)), seg)
    n = min(len(a), len(b))
    if n < SR * 10:
        return None
    a, b = a[:n], b[:n]
    n_frames = n // HOP

    dry_db = frame_db(a.mean(axis=1), n_frames)
    p95, p5 = stats[ac]["p95"], stats[ac]["p5"]
    thr = max(p95 - 22, p5 + 12, -60)
    presence = (dry_db > thr).astype(np.float32)
    level = np.clip((dry_db - p95 + 30) / 30, 0, 1).astype(np.float32)

    # Vocal processing.
    v = a
    if rng.random() < 0.7:
        v = random_eq(v, rng)
    if rng.random() < 0.6:
        v = reverb(v, rng)
    v = width(v, rng.uniform(0.0, 0.6))
    # Backing processing.
    if rng.random() < 0.4:
        b = random_eq(b, rng)
    b = width(b, rng.uniform(0.3, 1.5))

    if kind == "inst":
        mix = b
        presence[:] = 0
        level[:] = 0
    elif kind == "acap":
        mix = v
    else:
        active = a[np.abs(a).max(axis=1) > 1e-3]
        va = rms_db(active) if len(active) else -60
        rel = rng.uniform(-12, 2)
        mix = b + v * 10 ** ((rms_db(b) + rel - va) / 20)
    if rng.random() < 0.1:
        mix = width(mix, 0.0)
    if rng.random() < 0.1:
        mix = lowpass(mix, rng.uniform(4000, 11000))
    peak = np.abs(mix).max() + 1e-9
    mix = mix / peak * 10 ** (rng.uniform(-24, -1) / 20)

    feats = subprocess.run([str(BRAIN), "features"], input=mix.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    X = np.frombuffer(feats, dtype=np.float32).reshape(-1, N_FEAT)
    m = min(len(X), n_frames)
    return {
        "X": X[:m].astype(np.float16),
        "p": presence[:m],
        "l": level[:m],
        "acap": ac.stem,
        "inst": ins.stem,
        "kind": kind,
    }


def build(n_mixes, seed, holdout_acap, holdout_inst):
    DATA.mkdir(parents=True, exist_ok=True)
    acaps = sorted(STEMS.glob("acap_*.mp3"))
    insts = sorted(STEMS.glob("inst_*.mp3"))
    t0 = time.time()
    with ThreadPoolExecutor(12) as ex:
        def st(p):
            s = {"dur": duration(p)}
            if p.name.startswith("acap_"):
                s["p95"], s["p5"] = stem_stats(p)
            return p, s
        stats = dict(ex.map(st, acaps + insts))
    print(f"stats for {len(acaps)} a cappellas, {len(insts)} instrumentals in {time.time() - t0:.0f}s")

    ha = {p for p in acaps if hashlib.md5(p.stem.encode()).digest()[0] < 256 * holdout_acap}
    hi = {p for p in insts if hashlib.md5(p.stem.encode()).digest()[0] < 256 * holdout_inst}
    splits = {
        "train": ([p for p in acaps if p not in ha], [p for p in insts if p not in hi], n_mixes),
        "val": (sorted(ha), sorted(hi), max(60, n_mixes // 8)),
    }
    for name, (A, I, n) in splits.items():
        print(f"{name}: {len(A)} singers x {len(I)} instrumentals -> {n} examples")
        t0 = time.time()
        with ThreadPoolExecutor(14) as ex:
            exs = [e for e in ex.map(lambda i: make_example(i, A, I, stats, seed + (0 if name == "train" else 10**6)), range(n)) if e]
        np.savez(
            DATA / f"{name}.npz",
            X=np.concatenate([e["X"] for e in exs]),
            p=np.concatenate([e["p"] for e in exs]),
            l=np.concatenate([e["l"] for e in exs]),
            lens=np.array([len(e["p"]) for e in exs]),
            acap=np.array([e["acap"] for e in exs]),
            kind=np.array([e["kind"] for e in exs]),
        )
        print(f"  built in {time.time() - t0:.0f}s, {sum(len(e['p']) for e in exs)} frames")


# ---------------------------------------------------------------- model

class Net(nn.Module):
    def __init__(self, h=96):
        super().__init__()
        self.inp = nn.Linear(N_FEAT, h)
        self.gru = nn.GRU(h, h, num_layers=2, batch_first=True)
        self.out = nn.Linear(h, 2)

    def forward(self, x, h0=None):
        y = F.relu(self.inp(x))
        y, h = self.gru(y, h0)
        return self.out(y), h


def load_split(name):
    z = np.load(DATA / f"{name}.npz")
    return z["X"], z["p"], z["l"], z["lens"]


def crops(X, P, L, lens, seq, n, rng):
    starts = np.concatenate([[0], np.cumsum(lens)[:-1]])
    idx = rng.integers(len(lens), size=n)
    xs, ps, ls = [], [], []
    for i in idx:
        s = starts[i] + rng.integers(0, max(1, lens[i] - seq))
        xs.append(X[s : s + seq])
        ps.append(P[s : s + seq])
        ls.append(L[s : s + seq])
    return (
        torch.from_numpy(np.stack(xs).astype(np.float32)),
        torch.from_numpy(np.stack(ps)),
        torch.from_numpy(np.stack(ls)),
    )


def auc(score, y):
    order = np.argsort(score)
    ranks = np.empty(len(score))
    ranks[order] = np.arange(1, len(score) + 1)
    pos = y > 0.5
    n1, n0 = pos.sum(), (~pos).sum()
    return (ranks[pos].sum() - n1 * (n1 + 1) / 2) / (n1 * n0)


def evaluate(net, X, P, L, lens, dev):
    net.eval()
    starts = np.concatenate([[0], np.cumsum(lens)[:-1]])
    probs, levels = [], []
    with torch.no_grad():
        for s, n in zip(starts, lens):
            x = torch.from_numpy(X[s : s + n].astype(np.float32))[None].to(dev)
            y, _ = net(x)
            probs.append(torch.sigmoid(y[0, :, 0]).cpu().numpy())
            levels.append(torch.sigmoid(y[0, :, 1]).cpu().numpy())
    net.train()
    pr, lv = np.concatenate(probs), np.concatenate(levels)
    warm = np.concatenate([np.arange(n) >= 94 for n in lens])
    pr, lv, P, L = pr[warm], lv[warm], P[warm], L[warm]
    acc = np.mean((pr > 0.5) == (P > 0.5))
    fp = np.mean(pr[P < 0.5] > 0.5)
    fn = np.mean(pr[P > 0.5] <= 0.5)
    corr = np.corrcoef(lv, L)[0, 1]
    return {"auc": auc(pr, P), "acc": acc, "false+": fp, "missed": fn, "level_r": corr}


def export(net):
    sd = net.state_dict()
    blob = bytearray(b"WPN1")
    blob += struct.pack("<I", len(sd))
    for k, v in sd.items():
        a = v.detach().cpu().numpy().astype("<f4")
        name = k.encode()
        blob += struct.pack("<I", len(name)) + name
        blob += struct.pack("<I", a.ndim) + b"".join(struct.pack("<I", d) for d in a.shape)
        blob += a.tobytes()
    MODEL.parent.mkdir(parents=True, exist_ok=True)
    MODEL.write_bytes(bytes(blob))
    print(f"exported {MODEL} ({len(blob) / 1024:.0f} KiB)")


def train(epochs, seed):
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)
    Xt, Pt, Lt, lt = load_split("train")
    Xv, Pv, Lv, lv = load_split("val")
    print(f"train {len(Pt)} frames ({Pt.mean():.0%} vocal), val {len(Pv)} frames ({Pv.mean():.0%} vocal), device {dev}")
    net = Net().to(dev)
    opt = torch.optim.AdamW(net.parameters(), lr=2e-3, weight_decay=1e-4)
    steps_per_epoch = 200
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3, total_steps=epochs * steps_per_epoch)
    pos_w = torch.tensor((1 - Pt.mean()) / max(Pt.mean(), 1e-3), device=dev)
    best = None
    for ep in range(epochs):
        tl = 0.0
        for _ in range(steps_per_epoch):
            x, p, l = crops(Xt, Pt, Lt, lt, 500, 64, rng)
            x, p, l = x.to(dev), p.to(dev), l.to(dev)
            # Feature noise + random level offset for robustness.
            x = x + 0.05 * torch.randn_like(x) + 0.1 * torch.randn(x.shape[0], 1, 1, device=dev)
            y, _ = net(x)
            y, p, l = y[:, 60:], p[:, 60:], l[:, 60:]
            loss = F.binary_cross_entropy_with_logits(y[..., 0], p, pos_weight=pos_w.sqrt()) + 0.7 * F.binary_cross_entropy_with_logits(y[..., 1], l)
            opt.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(net.parameters(), 1.0)
            opt.step()
            sched.step()
            tl += loss.item()
        m = evaluate(net, Xv, Pv, Lv, lv, dev)
        print(f"epoch {ep + 1:2d} loss {tl / steps_per_epoch:.4f}  val " + "  ".join(f"{k} {v:.3f}" for k, v in m.items()))
        if best is None or m["auc"] > best[0]:
            best = (m["auc"], {k: v.detach().clone() for k, v in net.state_dict().items()})
    net.load_state_dict(best[1])
    print(f"best val AUC {best[0]:.3f}")
    export(net.cpu())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mixes", type=int, default=900)
    ap.add_argument("--epochs", type=int, default=25)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--reuse", action="store_true")
    a = ap.parse_args()
    if not a.reuse:
        build(a.mixes, a.seed, holdout_acap=0.16, holdout_inst=0.15)
    train(a.epochs, a.seed)


if __name__ == "__main__":
    main()
