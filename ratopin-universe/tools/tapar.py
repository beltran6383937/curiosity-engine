# Tapa los extremos huecos de una pieza (ChatGPT dibuja brazos y muñecas como tubos abiertos): rellena el interior del
# hueco con el color del pelaje y borra la línea interior, así el extremo queda redondo y cerrado y la articulación se
# puede solapar sin que se vea el agujero. La silueta exterior no se toca.
#   Ver zonas:   <python> -I tapar.py <pieza.png> --zonas <depuracion.png>
#   Tapar:       <python> -I tapar.py <pieza.png> <salida.png> <zona> [<zona> …]
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

LINE = 110     # luminancia por debajo de la cual un píxel es trazo
MIN_AREA = 300


def zones(rgba):
    lum = rgba[..., :3].astype(np.float32).mean(-1)
    inside = rgba[..., 3] > 128
    lab, n = ndimage.label(inside & (lum >= LINE))
    areas = ndimage.sum(np.ones_like(lab), lab, index=range(1, n + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a >= MIN_AREA]
    return lab, keep, lum, inside


def debug(src, dst):
    rgba = np.asarray(Image.open(src).convert("RGBA"))
    lab, keep, _, _ = zones(rgba)
    out = Image.fromarray(rgba).convert("RGB")
    over = np.asarray(out).copy()
    rng = np.random.default_rng(7)
    for z in keep:
        over[lab == z] = (0.5 * over[lab == z] + 0.5 * rng.integers(40, 255, 3)).astype(np.uint8)
    img = Image.fromarray(over)
    dr = ImageDraw.Draw(img)
    for z in keep:
        cy, cx = ndimage.center_of_mass(lab == z)
        dr.text((cx - 6, cy - 6), str(z), fill=(255, 0, 0))
    img.save(dst)


def cap(src, dst, picked):
    rgba = np.asarray(Image.open(src).convert("RGBA")).copy()
    lab, keep, lum, inside = zones(rgba)
    body = np.isin(lab, [z for z in keep if z not in picked])
    fur = np.median(rgba[body][:, :3], axis=0).astype(np.uint8)
    for z in picked:
        hole = ndimage.binary_fill_holes(lab == z)                     # incluye el sombreado interior del hueco
        near_hole = ndimage.binary_dilation(hole, iterations=7)
        near_body = ndimage.binary_dilation(body & ~hole, iterations=7)
        near_out = ndimage.binary_dilation(~inside, iterations=4)
        arc = near_hole & near_body & ~near_out & inside & (lum < LINE)  # trazo entre hueco y cuerpo, no la silueta
        fill = hole | arc
        rgba[fill, :3] = fur
        rgba[fill, 3] = 255
    Image.fromarray(rgba).save(dst)


if __name__ == "__main__":
    if sys.argv[2] == "--zonas":
        debug(sys.argv[1], sys.argv[3])
    else:
        cap(sys.argv[1], sys.argv[2], [int(z) for z in sys.argv[3:]])
