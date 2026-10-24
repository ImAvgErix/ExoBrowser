# Draws Exo Shield's icon from the Exo mark (brand/exo-mark.svg): the same glass squircle, rim and white bars, cut
# into a shield. (Exo Browser's own icon, the Horizon, is drawn by hand in brand/exo-browser.svg.)
# python tools/make-icons.py  ->  brand/exo-shield.svg
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
mark = (root / "ui" / "exo-mark.svg").read_text(encoding="utf-8")

defs = mark[mark.index("<defs>"):mark.index("</defs>") + 7]
paths = re.findall(r'<path d="([^"]+)"([^>]*)/>', mark)
tile = paths[0][0]                      # the squircle
bars = [d for d, attrs in paths if 'url(#g' in attrs]
rim = next(d for d, attrs in paths if 'stroke="url(#r)"' in attrs)


def scaled(d, k, cx=32.0, cy=32.0, dx=0.0, dy=0.0):
    def f(m):
        x, y = float(m.group(1)), float(m.group(2))
        return f"{(x - cx) * k + cx + dx:.2f} {(y - cy) * k + cy + dy:.2f}"
    return re.sub(r"(-?\d+\.?\d*) (-?\d+\.?\d*)", f, d)


base = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{defs.replace("</defs>", "")}'
        '<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/>'
        '<stop offset="0.55" stop-color="#f7f7fa"/><stop offset="1" stop-color="#d8d8e1"/></linearGradient></defs>'
        f'<path d="{tile}" fill="url(#p)"/><path d="{tile}" fill="url(#s)"/>')
end = f'<path d="{rim}" fill="none" stroke="url(#r)" stroke-width="0.77"/></svg>'

# Exo Shield: a white shield, the Exo bars cut into it.
shield_d = "M32 10.5 L49.5 17 V30.5 C49.5 41.5 42 49.5 32 53.5 C22 49.5 14.5 41.5 14.5 30.5 V17 Z"
shield = base + f'<path d="{shield_d}" fill="url(#w)"/>'
for d in bars:
    shield += f'<path d="{scaled(d, 0.42, dy=0.5)}" fill="#0c0c0e"/>'
shield += end

(root / "brand").mkdir(exist_ok=True)
(root / "brand" / "exo-shield.svg").write_text(shield, encoding="utf-8")
print("ok", len(shield))
