# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "matplotlib"]
# ///
"""Brain feedback loop: summarise analysis output against ground truth and
plot per-track signal timelines.

    uv run tools/report.py out/*.jsonl            # table + PNG per track
    uv run tools/report.py out/x.jsonl --t0 30 --t1 60   # zoomed plot

Ground truth comes from music/cc/tracks.tsv (name, bpm range, kind, url).
"""

import argparse
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parent.parent


def load(path):
    rows = [json.loads(line) for line in open(path)]
    keys = rows[0].keys()
    out = {}
    for k in keys:
        if k == "vf":
            continue
        out[k] = np.array([r[k] for r in rows])
    if "vf" in rows[0]:
        out["vf"] = np.array([r["vf"] for r in rows])
    return out


def truth():
    t = {}
    p = ROOT / "music/cc/tracks.tsv"
    if p.exists():
        for line in open(p):
            name, bpm, kind, _ = line.rstrip("\n").split("\t")
            lo, hi = (float(x) for x in bpm.split("-")) if "-" in bpm else (0, 0)
            t[name] = (lo, hi, kind)
    return t


def tempo_verdict(bpm, lo, hi):
    """Exact if inside the tagged range (±2%), octave if 2x/0.5x, else wrong."""
    if lo == 0:
        return "?"
    for mult, label in ((1, "ok"), (2, "x2"), (0.5, "x½"), (1.5, "x1.5"), (2 / 3, "x⅔")):
        if lo * mult * 0.98 <= bpm <= hi * mult * 1.02:
            return label
    return "WRONG"


def summarise(name, d, gt):
    t = d["t"]
    settle = t > 15
    bpm = np.median(d["bpm"][settle])
    lo, hi, kind = gt.get(name, (0, 0, "?"))
    in_range = np.mean((d["bpm"][settle] >= lo * 0.98) & (d["bpm"][settle] <= hi * 1.02)) if lo else float("nan")
    beats = int(d["beat"][-1])
    dur = t[-1]
    return {
        "track": name,
        "kind": kind,
        "truth": f"{lo:.0f}-{hi:.0f}" if lo else "-",
        "bpm": f"{bpm:.1f}",
        "verdict": tempo_verdict(bpm, lo, hi),
        "in_range": f"{in_range:.0%}" if lo else "-",
        "beat_conf": f"{np.mean(d['beatConf'][settle]):.2f}",
        "beats/min": f"{beats / dur * 60:.1f}",
        "vocal>0.5": f"{np.mean(d['vocal'] > 0.5):.0%}",
        "syl/s": f"{np.sum(d['syllable'] > 0) / dur:.2f}",
        "drops": int(np.sum(d["drop"] > 0)),
        "sections": "".join("CGBP"[s] for s in segments(d["section"], t)),
    }


def segments(section, t):
    out = []
    for s in section:
        if not out or out[-1] != s:
            out.append(int(s))
    return out[:40]


def plot(name, d, path, t0=None, t1=None):
    t = d["t"]
    m = np.ones_like(t, dtype=bool)
    if t0 is not None:
        m &= t >= t0
    if t1 is not None:
        m &= t <= t1
    tt = t[m]
    fig, ax = plt.subplots(7, 1, figsize=(18, 16), sharex=True)
    ax[0].plot(tt, d["level"][m], lw=0.6, label="level")
    ax[0].plot(tt, d["energy"][m], lw=1.2, label="energy")
    ax[0].plot(tt, d["energyLong"][m], lw=1.2, label="energyLong")
    ax[0].plot(tt, d["build"][m], lw=1.2, label="build")
    ax[0].plot(tt, d["calm"][m], lw=1.0, label="calm")
    ax[0].plot(tt, d["section"][m] / 3, lw=1.5, color="k", label="section/3")
    for x in tt[d["drop"][m] > 0]:
        ax[0].axvline(x, color="r", lw=2)
    ax[0].legend(loc="upper right", fontsize=7, ncol=6)
    bands = d["bands"][m]
    for i, lab in enumerate(["sub", "bass", "lowmid", "mid", "himid", "high"]):
        ax[1].plot(tt, bands[:, i] + i * 1.05, lw=0.5)
        ax[1].text(tt[0], i * 1.05 + 0.5, lab, fontsize=7)
    ax[2].plot(tt, d["flux"][m], lw=0.5, color="gray")
    for key, c, y in (("kick", "r", 1.05), ("snare", "b", 1.15), ("hat", "g", 1.25), ("onset", "k", 1.35)):
        ev = d[key][m] > 0
        ax[2].scatter(tt[ev], np.full(ev.sum(), y), s=6, c=c, label=key)
    hits = tt[d["beatHit"][m]]
    for x in hits:
        ax[2].axvline(x, color="orange", lw=0.4, alpha=0.6)
    ax[2].legend(loc="upper right", fontsize=7, ncol=4)
    ax[3].plot(tt, d["bpm"][m], lw=1)
    ax3b = ax[3].twinx()
    ax3b.plot(tt, d["beatConf"][m], lw=0.8, color="orange")
    ax3b.set_ylim(0, 1)
    ax[3].set_ylabel("bpm / conf")
    ax[4].plot(tt, d["vocal"][m], lw=1, label="vocal presence")
    ax[4].plot(tt, d["vocalEnv"][m], lw=0.7, label="vocal env")
    ev = d["syllable"][m] > 0
    ax[4].scatter(tt[ev], np.full(ev.sum(), 1.05), s=5, c="m", label="syllable")
    for key, c in ((1, "g"), (2, "r")):
        for x in tt[d["phrase"][m] == key]:
            ax[4].axvline(x, color=c, lw=0.8)
    ax[4].legend(loc="upper right", fontsize=7)
    ax[5].plot(tt, d["pitch"][m], lw=0.8, label="pitch (oct rel)")
    ax[5].legend(loc="upper right", fontsize=7)
    if "vf" in d:
        vf = d["vf"][m]
        labels = ["level", "dominance", "harm", "center", "salience", "motion", "modulation", "flux"]
        for i in range(vf.shape[1]):
            ax[6].plot(tt, np.clip(vf[:, i], 0, 1.5) + i * 1.6, lw=0.5)
            ax[6].text(tt[0], i * 1.6 + 0.8, labels[i], fontsize=7)
    ax[0].set_title(name)
    fig.tight_layout()
    fig.savefig(path, dpi=70)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--t0", type=float)
    ap.add_argument("--t1", type=float)
    ap.add_argument("--no-plot", action="store_true")
    a = ap.parse_args()
    gt = truth()
    rows = []
    for f in a.files:
        name = Path(f).stem
        d = load(f)
        rows.append(summarise(name, d, gt))
        if not a.no_plot:
            suffix = f"_{a.t0:g}-{a.t1:g}" if a.t0 is not None else ""
            plot(name, d, Path(f).with_name(f"{name}{suffix}.png"), a.t0, a.t1)
    cols = list(rows[0].keys())
    widths = [max(len(c), *(len(str(r[c])) for r in rows)) for c in cols]
    print("  ".join(c.ljust(w) for c, w in zip(cols, widths)))
    for r in rows:
        print("  ".join(str(r[c]).ljust(w) for c, w in zip(cols, widths)))


if __name__ == "__main__":
    sys.exit(main())
