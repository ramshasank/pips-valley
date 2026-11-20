#!/usr/bin/env python3
"""Find the cream tummy patch in every Letter Monsters picture and print the table for art/letters.js
(TUM: name -> [centre x / width, centre y / height, radius / width]).  python3 tools/tummy.py [--sheet out.png]"""
import glob, json, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out, tiles = {}, []
for f in sorted(glob.glob(os.path.join(ROOT, "img", "letters", "*.webp"))):
    name = os.path.basename(f)[:-5]
    try: im = Image.open(f).convert("RGBA")
    except Exception: print("UNREADABLE", name, file=sys.stderr); continue
    a = np.asarray(im).astype(int); h, w = a.shape[:2]
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    cream = (al > 200) & (r > 215) & (g > 185) & (b > 130) & (b < 225) & (r - b > 20) & (r - b < 110)
    cream[: int(h * 0.3)] = False                      # never the face
    ys, xs = np.nonzero(cream)
    if len(xs) < w * h * 0.03: print("NO TUMMY", name, file=sys.stderr); continue
    # the patch is by far the biggest cream thing: trim stray specks, then take the middle of its box.
    # Arms or the chin may bite into the disc, so the radius is the smaller half-size.
    x0, x1 = np.percentile(xs, [1.5, 98.5]); y0, y1 = np.percentile(ys, [1.5, 98.5])
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; rad = min((x1 - x0) / 2, (y1 - y0) / 2)
    out[name] = [round(cx / w, 3), round(cy / h, 3), round(rad / w, 3)]
    if "--sheet" in sys.argv:
        t = Image.new("RGB", (w, h), (160, 200, 150)); t.paste(im, (0, 0), im); d = ImageDraw.Draw(t); d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(255, 0, 255), width=3); t.thumbnail((200, 200)); tiles.append((name, t))
print(json.dumps(out).replace('"', "'"))
if tiles:
    cols = 9; sh = Image.new("RGB", (cols * 205, ((len(tiles) + cols - 1) // cols) * 205), (30, 30, 40))
    for i, (name, t) in enumerate(tiles): sh.paste(t, ((i % cols) * 205, (i // cols) * 205))
    sh.save(sys.argv[sys.argv.index("--sheet") + 1])
