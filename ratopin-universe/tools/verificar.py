# Verifica una prueba de movimiento: toma 1 de cada 2 fotogramas (12 dibujos/s sobre 24 fps), comprueba que ningún dibujo
# es idéntico al anterior (Ratopín nunca quieto) y monta la tira de contacto para revisar arcos y espaciado.
# Renderizar SIN cámara para que la comparación mida al personaje, no el movimiento de cámara.
# Uso: <python> -I verificar.py <carpeta_png_24fps> <tira.png> [--fotogramas 120] [--umbral 0.15] [--zona x0,y0,x1,y1]
# --fotogramas: cuántos debe haber; además la numeración tiene que ser seguida (un render cortado no puede dar OK).
# --zona: un trozo del plano que no se mueve (p. ej. las botas). Si en algún fotograma cambia, se perdió una capa al
# renderizar (pasó con 2 pestañas de Chrome a la vez y poca RAM).
import argparse
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("src", type=Path)
ap.add_argument("sheet", type=Path)
ap.add_argument("--fotogramas", type=int)
ap.add_argument("--umbral", type=float, default=0.15)  # diferencia media mínima entre dibujos (niveles de gris 0-255)
ap.add_argument("--zona")
args = ap.parse_args()
src, sheet, threshold = args.src, args.sheet, args.umbral
all_frames = sorted(src.glob("*.png"))
nums = [int(re.search(r"(\d+)$", f.stem).group(1)) for f in all_frames]
seq = bool(nums) and nums == list(range(nums[0], nums[0] + len(nums)))
if not seq or (args.fotogramas and len(all_frames) != args.fotogramas):
    sys.exit(f"FALLO: secuencia incompleta: {len(all_frames)} fotogramas (esperados {args.fotogramas or '?'}), numeración seguida: {seq}")
frames = all_frames[::2]
gray = [np.asarray(Image.open(f).convert("L"), np.float32) for f in frames]
diffs = [float(np.abs(a - b).mean()) for a, b in zip(gray, gray[1:])]
still = [i + 1 for i, v in enumerate(diffs) if v < threshold]

cols, w = 10, 216
h = int(w * gray[0].shape[0] / gray[0].shape[1])
rows = -(-len(frames) // cols)
canvas = Image.new("RGB", (cols * w, rows * h), "white")
for i, f in enumerate(frames):
    canvas.paste(Image.open(f).convert("RGB").resize((w, h)), ((i % cols) * w, (i // cols) * h))
canvas.save(sheet)

print(f"{len(frames)} dibujos · diferencia entre consecutivos: mín {min(diffs):.2f} · media {np.mean(diffs):.2f}")
print("OK: ningún dibujo repetido" if not still else f"FALLO: dibujos casi idénticos al anterior: {still}")

lost = []
if args.zona:
    x0, y0, x1, y1 = map(int, args.zona.split(","))
    zone = lambda f: np.asarray(Image.open(f).convert("L").crop((x0, y0, x1, y1)), np.float32)
    ref = zone(all_frames[0])
    lost = [i for i, f in enumerate(all_frames) if float(np.abs(zone(f) - ref).mean()) > 8]
    print("OK: ninguna capa perdida" if not lost else f"FALLO: fotogramas con capas perdidas: {lost}")
sys.exit(1 if still or lost else 0)
