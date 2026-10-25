# Trocea la cola escalada en segmentos solapados para encadenarlos (onda de látigo). Imprime pivotes y enganches
# para rig-v1.ts. Uso: python -I -X utf8 cola.py <public/ratopin/v1/e>
import sys
from pathlib import Path
import numpy as np
from PIL import Image

CUTS = [0, 150, 290, 420, 540]  # bordes de los segmentos (px); cada uno se alarga OVER px para tapar la junta
OVER = 10

d = Path(sys.argv[1])
im = Image.open(d / "cola.png")
a = np.array(im)[:, :, 3] > 128
mid = lambda x: float(np.where(a[:, x])[0].mean())  # altura de la línea media de la cola en la columna x
for i, (x0, x1) in enumerate(zip(CUTS, CUTS[1:])):
    im.crop((x0, 0, min(x1 + OVER, im.width), im.height)).save(d / f"cola-{i + 1}.png")
    child = f"  hijo en [{x1 - x0}, {mid(x1):.1f}]" if x1 < CUTS[-1] else ""
    print(f"cola-{i + 1}: pivot [0, {mid(max(x0, 6)):.1f}]{child}")
