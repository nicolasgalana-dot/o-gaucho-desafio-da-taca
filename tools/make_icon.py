import base64
import io
import re
from pathlib import Path
from PIL import Image, ImageOps

html_path = Path("app/src/main/assets/index.html")
text = html_path.read_text(encoding="utf-8")

patterns = [
    r'class=["\']coverArtwork["\'][^>]*>.*?<img[^>]+src=["\']data:image/[^;]+;base64,([^"\']+)["\']',
    r'<img[^>]+src=["\']data:image/[^;]+;base64,([^"\']+)["\'][^>]*>'
]

payload = None
for pattern in patterns:
    match = re.search(pattern, text, flags=re.S | re.I)
    if match:
        payload = match.group(1)
        break

if not payload:
    raise SystemExit("Não foi possível localizar a arte da capa dentro do HTML.")

image = Image.open(io.BytesIO(base64.b64decode(payload))).convert("RGB")
icon = ImageOps.fit(
    image,
    (512, 512),
    method=Image.Resampling.LANCZOS,
    centering=(0.5, 0.27)
)
out = Path("app/src/main/res/drawable/icon.png")
out.parent.mkdir(parents=True, exist_ok=True)
icon.save(out, "PNG", optimize=True)
print(f"Ícone gerado: {out} ({image.width}x{image.height} -> 512x512)")
