# Saca del dibujo «mano con el móvil» (e/cerca-mano-pantalla.png) solo la mano (pulgar, palma y yemas) en
# e/cerca-mano-agarre.png, con el mismo lienzo y coordenadas. El móvil va por código (Phone en MotionTest5s.tsx, con las
# medidas de PHONE): es el mismo móvil en el bolsillo, en la mano y delante de la cara, y la mano se pinta encima.
# Uso: python -I -X utf8 mano_agarre.py <public/ratopin/v1/e> [depuracion.png]
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

PHONE = [(90, 6), (178, 24), (134, 204), (54, 188)]  # esquinas del contorno exterior del móvil dibujado
FINGERS = [(160, 102), (152, 128), (142, 152), (60, 100)]  # semillas: tres yemas y el pulgar, que van delante


def main():
    d = Path(sys.argv[1])
    rgba = np.array(Image.open(d / "cerca-mano-pantalla.png").convert("RGBA"))
    h, w = rgba.shape[:2]
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon(PHONE, fill=255)
    phone = ndimage.binary_dilation(np.asarray(m) > 0, iterations=7)  # con todo el trazo exterior
    lum = rgba[..., :3].astype(np.float32) @ [0.299, 0.587, 0.114]
    lab, _ = ndimage.label((lum > 140) & (rgba[..., 3] > 128))
    fingers = ndimage.binary_dilation(np.isin(lab, [lab[y, x] for x, y in FINGERS]), iterations=6)  # con su contorno
    hand = rgba.copy()
    hand[..., 3] = np.where(phone & ~fingers, 0, hand[..., 3])
    Image.fromarray(hand).save(d / "cerca-mano-agarre.png")
    if len(sys.argv) > 2:
        k = 4
        sheet = Image.new("RGBA", (w * k, h * k), (140, 160, 190, 255))
        sheet.alpha_composite(Image.fromarray(hand).resize((w * k, h * k), Image.LANCZOS))
        sheet.convert("RGB").save(sys.argv[2])


main()
