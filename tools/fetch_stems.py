# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Fetch Creative Commons training stems from ccMixter for the vocal model.

A cappellas are screened automatically: a clean vocal stem has real silences
(5th-percentile level below -45 dB), so stems with piano/guitar bleed are
rejected. Instrumentals are filtered by tags (no vocal/rap/spoken tags).

    uv run tools/fetch_stems.py --acap 120 --inst 60

Writes music/stems/{acap_c<id>,inst_c<id>}.mp3 and music/stems/CREDITS.tsv.
"""

import argparse
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
STEMS = ROOT / "music/stems"
API = "http://ccmixter.org/api/query?{q}&sort=rank&f=json"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "http://ccmixter.org/"}

ACAP_TAGS = [
    "acappella,female_vocals", "acappella,male_vocals", "acappella,rap", "acappella,pop",
    "acappella,soul", "acappella,rnb", "acappella,hip_hop", "acappella,rock", "acappella,dance",
    "acappella,electronic", "acappella,singing", "acappella,melody", "acappella,jazz",
]
INST_TAGS = [
    "instrumental,electronic", "instrumental,rock", "instrumental,hip_hop", "instrumental,house",
    "instrumental,dubstep", "instrumental,funk", "instrumental,pop", "instrumental,techno",
    "instrumental,jazz", "instrumental,trance", "instrumental,dnb", "instrumental,synthesizer",
    "instrumental,guitar", "instrumental,piano", "instrumental,disco",
]
ACAP_BAD = ("piano", "guitar", "instrumental", "drums", "strings", "synthesizer", "beat")
INST_BAD = ("vocal", "rap", "spoken", "acap", "singing", "choir", "voice")


def query(q, limit, offset=0):
    # curl, not urllib: ccMixter sometimes sends a header line >64 KiB.
    url = API.format(q=f"{q}&limit={limit}&offset={offset}")
    out = subprocess.run(["curl", "-s", "-m", "40", "-A", HEADERS["User-Agent"], url], capture_output=True, check=True).stdout
    return json.loads(out)


def mp3_url(rec):
    for f in rec.get("files", []):
        if f.get("download_url", "").endswith(".mp3"):
            return f["download_url"]
    return None


def download(url, path):
    subprocess.run(
        ["curl", "-sL", "-m", "180", "-A", HEADERS["User-Agent"], "-e", HEADERS["Referer"], "-o", str(path), url],
        check=True,
    )
    if path.stat().st_size < 100_000:
        path.unlink()
        raise RuntimeError(f"short download {url}")


def screen_acap(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-t", "240", "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True,
    ).stdout
    x = np.frombuffer(raw, np.float32)
    if len(x) < 16000 * 30:
        return False
    fr = x[: len(x) // 1365 * 1365].reshape(-1, 1365)
    lv = 10 * np.log10((fr.astype(np.float64) ** 2).mean(1) + 1e-12)
    p5, p95 = np.percentile(lv, 5), np.percentile(lv, 95)
    act = (lv > max(p95 - 22, p5 + 12, -60)).mean()
    return p5 < -45 and 0.25 < act < 0.92


def collect(tags, bad, want, prefix):
    seen = {p.stem.split("_c")[-1] for p in STEMS.glob(f"{prefix}_c*.mp3")}
    picks = {}
    for t in tags:
        for offset in range(0, 320 if prefix == "acap" else 80, 40):
            try:
                recs = query(f"tags={t}", 40, offset)
            except Exception as e:  # noqa: BLE001 - network hiccups are fine here
                print("query failed", t, e)
                continue
            for r in recs:
                uid = str(r["upload_id"])
                tagstr = r.get("upload_tags", "")
                if uid in seen or uid in picks or any(b in tagstr for b in bad):
                    continue
                if "Attribution" not in r.get("license_name", ""):
                    continue
                url = mp3_url(r)
                if url:
                    picks[uid] = (url, r.get("upload_name", ""), r.get("user_name", ""), r.get("license_name", ""))
    return list(picks.items())[: want * 2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--acap", type=int, default=100)
    ap.add_argument("--inst", type=int, default=50)
    a = ap.parse_args()
    STEMS.mkdir(parents=True, exist_ok=True)
    credits = STEMS / "CREDITS.tsv"

    for prefix, tags, bad, want, screen in (
        ("acap", ACAP_TAGS, ACAP_BAD, a.acap, screen_acap),
        ("inst", INST_TAGS, INST_BAD, a.inst, None),
    ):
        have = len(list(STEMS.glob(f"{prefix}_*.mp3")))
        need = max(0, want - have)
        cands = collect(tags, bad, need, prefix)
        print(f"{prefix}: have {have}, want {want}, {len(cands)} candidates")
        kept = 0

        def work(item):
            uid, (url, name, user, lic) = item
            path = STEMS / f"{prefix}_c{uid}.mp3"
            try:
                download(url, path)
            except Exception as e:  # noqa: BLE001
                print("  download failed", uid, e)
                return None
            if screen and not screen(path):
                path.unlink()
                return None
            return f"{path.name}\t{name}\t{user}\t{lic}\t{url}\n"

        with ThreadPoolExecutor(8) as ex, open(credits, "a") as cf:
            for line in ex.map(work, cands):
                if line and kept < need:
                    cf.write(line)
                    kept += 1
        print(f"{prefix}: kept {kept}")


if __name__ == "__main__":
    main()
