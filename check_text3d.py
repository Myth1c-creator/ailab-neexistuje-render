"""Text rules for the words that live inside the 3D picture of "Tahle holka neexistuje" (cdp.mjs check only sees the DOM: the captions).
Every 3D word is screen-anchored (src/worlds/common.ts place): its centre and width in px are set in the code, so the margins are
exact; this mirrors those numbers (intro.ts WH / WN / WJ, drop.ts WDS / WZ / WE / pair(), cta.ts CTA) and checks, for each word,
  EDGE  >= 150 px from the side edges at rest (with the punches and the sway at their worst) and at the peak of its slam (the user's
        rule: never at the edge, never across the whole width; sim_layout.mjs measures the projected boxes of every frame with the
        camera shake on top and needs the same 150 px);
  SIZE  no word wider than 760 px at rest, the labels / counter <= 260 px;
  DUP   no caption (capwords.json) while the same word is big on screen.
python check_text3d.py  ->  CHECK PASS / FAIL (and logs/text3d_check.json)
"""
import json
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
cut = json.loads((HERE / "audio/cut.json").read_text(encoding="utf-8"))
BPM, FPS, FRAMES = cut["bpm"], 60, 921
END = FRAMES / FPS
f = lambda fr: fr / FPS  # noqa: E731
W = json.loads((HERE / "audio/vo-words.json").read_text(encoding="utf-8"))
ws = lambda i: W[i]["start"]  # noqa: E731
fr_ = lambda s: round(s * FPS)  # noqa: E731
B = lambda i: f(fr_(cut["beats"][i]))  # noqa: E731
WS = lambda i: f(fr_(ws(i)))  # noqa: E731
FONT = json.loads((HERE / "public/fonts/unbounded_800_clean.typeface.json").read_text(encoding="utf-8"))
G = FONT["glyphs"]
adv = lambda s: sum(G[c]["ha"] for c in s) / FONT["resolution"]  # noqa: E731

PUNCH = 1.05 * 1.05  # a punch (5 %) + the sway / tilt
DROP, UI, PANEL, BLACK, LOCK = B(13), B(23), B(8), f(325), B(32)
SLAM = 1.08


def pair(a, b, total=640, gap=40):
    """drop.ts pair(): two words side by side at one height -> (centre a, width a, centre b, width b)"""
    s = (total - gap) / (adv(a) + adv(b))
    return 540 - total / 2 + adv(a) * s / 2, adv(a) * s, 540 + total / 2 - adv(b) * s / 2, adv(b) * s


xa1, wa1, xb1, wb1 = pair("ŽÁDNÁ", "KAMERA")
xa2, wa2, xb2, wb2 = pair("ŽÁDNÝ", "ATELIÉR")
CTA_PUSH = 1 + 0.015 * (END - WS(24))  # cta.ts PUSH at the end
LOGO_W = (2 * (540 - (352 - 0.5 * 150)) + 20) * CTA_PUSH

# (text, shown from, to (s), centre x, sway (px), width at rest at its worst (px), width at the slam peak (px), rest cap)
WORDS = [
    ("TAHLE", WS(0), 1.7, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("HOLKA", WS(1), 1.7, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("NEEXISTUJE", WS(2), 1.7, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("NIKDO", WS(6), PANEL, 540, 0, 594 * PUNCH, 594 * SLAM, 760),
    ("NEVYFOTIL", WS(7), PANEL, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("JEDEN", WS(10), BLACK, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("PROMPT", WS(11), BLACK, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("DESET", WS(15), 7.22, 540, 0, 594 * PUNCH, 594 * SLAM, 760),
    ("ŽÁDNÁ (drop)", WS(16), 9.13, 540, 0, 486 * PUNCH, 486 * SLAM, 760),
    ("NEEXISTUJE (drop)", WS(19), 9.13, 540, 0, 620 * PUNCH, 620 * SLAM, 760),
    ("ŽÁDNÁ (ui)", WS(20), 11.70, xa1, 0, wa1 * PUNCH, wa1 * SLAM, 760),
    ("KAMERA", WS(21), 11.70, xb1, 0, wb1 * PUNCH, wb1 * SLAM, 760),
    ("ŽÁDNÝ", WS(22), 11.70, xa2, 0, wa2 * PUNCH, wa2 * SLAM, 760),
    ("ATELIÉR", WS(23), 11.70, xb2, 0, wb2 * PUNCH, wb2 * SLAM, 760),
    ("counter 01-10", DROP, UI, 300, 0, 190, 190 * 1.25, 260),
    ("DEJ", WS(24), END, 540, 10, 390 * CTA_PUSH * 1.04, 390 * 1.08, 560),
    ("FOLLOW", WS(25), END, 540, 0, 640 * CTA_PUSH * 1.06, 640 * 1.1, 760),
    ("PRO VÍC NOVINEK", WS(26), END, 540, 0, 640 * CTA_PUSH * 1.03, 640 * CTA_PUSH * 1.1, 760),
    # the logo lockup: mark 150 px at x 352 (pop 160 %) + the wordmark 330 px at x 632 (slam 130 %), pushed in around x 540
    ("AI LAB (logo)", LOCK, END, 540, 0, LOGO_W, 2 * (540 - (352 - 0.5 * 150 * 1.6)), 760),
]
norm = lambda s: "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()  # noqa: E731

caps = [(w, a * 60 / BPM, b * 60 / BPM) for w, a, b in json.loads((HERE / "capwords.json").read_text(encoding="utf-8"))]
edge, size, dup, margins = [], [], [], {}
for text, t0, t1, cx, sway, w_rest, w_slam, cap in WORDS:
    for kind, w in (("rest", w_rest), ("slam", w_slam)):
        m = min(cx - sway - w / 2, 1080 - (cx + sway + w / 2))
        margins[f"{text} {kind}"] = round(m)
        if m < 150 - 1e-6:
            edge.append({"text": text, "kind": kind, "margin": round(m), "width": round(w)})
    if w_rest > cap:
        size.append({"text": text, "width": round(w_rest), "cap": cap})
    toks = set(norm(text).replace(".", "").replace("?", "").replace("(", "").replace(")", "").split())
    for cw, a, b in caps:
        if a < t1 and b > t0 and (norm(cw) in toks or (len(cw) >= 4 and norm(cw) in norm(text))):
            dup.append({"caption": cw, "t": [round(a, 3), round(b, 3)], "word": text})
res = {"edge": edge, "size": size, "dup": dup, "margins": margins}
(HERE / "logs").mkdir(exist_ok=True)
(HERE / "logs" / "text3d_check.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
for e in edge:
    print(f"EDGE  {e['text']} ({e['kind']}): {e['margin']} px, {e['width']} px wide (min 150)")
for s in size:
    print(f"SIZE  {s['text']}: {s['width']} px (cap {s['cap']})")
for d in dup:
    print(f"DUP   caption '{d['caption']}' {d['t']} under '{d['word']}'")
print("min margin", min(margins.values()), "px;", "CHECK PASS" if not edge and not dup and not size else "CHECK FAIL")
