# Recorta una hoja de piezas de ChatGPT en PNG sueltos con transparencia (una pieza por archivo).
# Fondo: si la hoja ya trae alfa se usa; si es blanca, el fondo es el blanco conectado con los bordes (el blanco DENTRO del
# contorno, como la camiseta, queda opaco). Las piezas se ordenan por filas (arriba→abajo, izquierda→derecha).
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/recortar.py <hoja.png> <carpeta_salida> [prefijo]
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

WHITE = 235       # luminancia a partir de la cual un píxel cuenta como fondo blanco
MIN_AREA = 0.002  # piezas más pequeñas que esta fracción de la hoja = motas, se descartan
PAD = 6
GAP = 5           # huecos del contorno de hasta ~2·GAP px se consideran cerrados


def piece_mask(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[..., 3]
    if (alpha < 250).mean() > 0.05:  # la hoja ya viene con transparencia; ChatGPT añade un halo oscuro de ~10 % de opacidad
        return alpha > 128
    lum = rgba[..., :3].astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
    light = lum >= WHITE
    # El trazo a lápiz deja huecos: se engorda GAP px para que el fondo no se cuele dentro y luego se devuelve
    # ese margen al fondo (solo por píxeles blancos), así el contorno queda donde estaba.
    lab, _ = ndimage.label(~ndimage.binary_dilation(~light, iterations=GAP))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    background = ndimage.binary_dilation(np.isin(lab, edge[edge > 0]), iterations=GAP) & light
    return ~background


def main(sheet: str, out_dir: str, prefix: str = "pieza") -> list[dict]:
    rgba = np.asarray(Image.open(sheet).convert("RGBA")).copy()
    mask = piece_mask(rgba)
    # Los bigotes y trazos finos pueden quedar sueltos: se agrupan con su pieza dilatando solo para etiquetar.
    has_alpha = (rgba[..., 3] < 250).mean() > 0.05
    lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=3 if has_alpha else 8))
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    pieces = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        region = (lab[sl] == i) & mask[sl]
        if region.sum() < MIN_AREA * mask.size:
            continue
        y0, x0 = max(sl[0].start - PAD, 0), max(sl[1].start - PAD, 0)
        y1, x1 = min(sl[0].stop + PAD, mask.shape[0]), min(sl[1].stop + PAD, mask.shape[1])
        keep = (lab[y0:y1, x0:x1] == i) & mask[y0:y1, x0:x1]
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(keep, crop[..., 3] if has_alpha else 255, 0)
        pieces.append({"box": [int(x0), int(y0), int(x1), int(y1)], "img": crop})
    # Orden de lectura: agrupa por filas con la altura media como tolerancia.
    h = np.median([p["box"][3] - p["box"][1] for p in pieces]) if pieces else 1
    pieces.sort(key=lambda p: (round(p["box"][1] / (h * 0.6)), p["box"][0]))
    meta = []
    for k, p in enumerate(pieces, start=1):
        name = f"{prefix}-{k:02d}.png"
        Image.fromarray(p["img"]).save(out / name)
        meta.append({"file": name, "box": p["box"], "size": [p["img"].shape[1], p["img"].shape[0]]})
    (out / f"{prefix}.json").write_text(json.dumps({"sheet": Path(sheet).name, "pieces": meta}, indent=1), encoding="utf-8")
    print(f"{len(meta)} piezas → {out}")
    return meta


if __name__ == "__main__":
    main(*sys.argv[1:4])
