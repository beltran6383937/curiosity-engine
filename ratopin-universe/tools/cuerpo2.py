# Capas del cuerpo v2, sacadas del dibujo original con las dos mangas (public/ratopin/v1/cuerpo.png, 994×936).
# Sustituyen a los recortes rectangulares de la v1 (parches blancos y cajas que asomaban al inclinar el torso).
# Todas comparten las coordenadas de cuerpo.png, así que superpuestas reproducen el dibujo exacto. Orden de pintado:
#   piernas → hueco-lejos → brazo lejano → cuello-trasero → cabeza → torso → sisa → cinturon → hueco-cerca →
#   brazo cercano → manga-cerca → mano
#   · piernas: todo lo que queda por debajo del borde superior del cinturón (fijo).
#   · torso: lo de encima, cortado a media altura del cinturón (el corte queda siempre tapado por cinturon); con el hueco
#     de la manga lejana y el interior del cuello transparentes (por ahí asoman el brazo lejano y el cuello).
#   · cinturon: franja fija desde el contorno superior del cinturón y las bolsas hasta pasado el corte del torso.
#   · manga-cerca: la manga cercana sin el hueco, encima del brazo: el brazo sale de dentro de la manga. Ya no está en el
#     torso: gira un poco con el brazo (la tela sigue al brazo); hueco-cerca es su interior oscuro, detrás del brazo.
#   · sisa: lo que hay debajo de la manga (costado de la camiseta, en sombra), que asoma cuando la manga se levanta.
#   · hueco-lejos / cuello-trasero: el interior de la manga lejana y del cuello, detrás del brazo y de la cabeza.
# Uso: python -I -X utf8 cuerpo2.py <public/ratopin/v1> [depuracion.png]
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

W, H = 994, 936
# Borde superior aproximado del cinturón y las bolsas (x, y), un poco por encima del contorno: se ajusta solo al
# primer trazo negro de cada columna.
BELT_GUESS = [(250, 352), (268, 350), (300, 352), (340, 345), (372, 318), (400, 326), (440, 332), (480, 336),
              (520, 346), (560, 356), (600, 365), (640, 368), (690, 372), (712, 336), (745, 336), (762, 378),
              (772, 378), (776, 300), (994, 300)]  # a la derecha del portaherramientas ya no hay torso: muslo y fondo
CUT = 30         # el torso acaba CUT px por debajo del borde del cinturón
BELT_DEPTH = 58  # la franja del cinturón baja BELT_DEPTH px: tapa el corte aunque el torso se incline o respire
COLLAR = [(460, 4), (500, 6), (540, 14), (580, 16), (615, 12), (630, 24), (616, 42), (614, 62), (608, 72), (590, 77),
          (565, 76), (542, 68), (522, 58), (500, 42), (480, 28), (462, 18)]
SLEEVE = [(390, 25), (462, 25), (470, 50), (490, 90), (500, 113), (498, 150), (496, 187), (485, 215), (470, 240),
          (458, 262), (445, 272), (430, 277), (400, 276), (380, 268), (350, 257), (320, 244), (300, 230), (290, 150),
          (330, 60)]  # el borde de abajo va pegado al contorno del dobladillo
HOLLOW = dict(c=(383, 223), r=(70, 27.5), deg=33.8)  # boca de la manga cercana (elipse)
# Costado de la camiseta bajo la manga: contorno exterior (con trazo) de abajo arriba y borde del peto a la derecha.
SISA_SIDE = [(398, 302), (418, 232), (438, 140), (456, 34)]
SISA = SISA_SIDE + [(505, 85), (507, 285), (470, 304)]
SISA_GRAIN = (394, 88, 458, 152)  # trozo de tela lisa de la manga cercana en cuerpo.png (x0, y0, x1, y1)
FAR_SEED, FAR_LUM = (790, 190), 70                    # hueco lejano: zona sin trazo (luminancia > 70) que lo contiene


def poly(points):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return np.asarray(m) > 0


def ellipse(c, r, deg):
    y, x = np.mgrid[0:H, 0:W]
    t = np.deg2rad(deg)
    u = (x - c[0]) * np.cos(t) + (y - c[1]) * np.sin(t)
    v = -(x - c[0]) * np.sin(t) + (y - c[1]) * np.cos(t)
    return (u / r[0]) ** 2 + (v / r[1]) ** 2 <= 1


def belt_top(rgba):
    """Por columna: primera fila con un trazo negro de al menos 3 px cerca de la guía (el contorno del cinturón)."""
    lum = rgba[..., :3].astype(np.float32) @ [0.299, 0.587, 0.114]
    ink = (lum < 60) & (rgba[..., 3] > 128)
    xs, ys = zip(*BELT_GUESS)
    guess = np.interp(np.arange(W), xs, ys)
    top = guess.copy()
    for x in range(W):
        y0 = int(guess[x]) - 14
        for y in range(max(y0, 0), int(guess[x]) + 26):
            if ink[y:y + 3, x].all():
                top[x] = y - 1
                break
    return ndimage.median_filter(top, 5)  # sin dientes sueltos


def sisa(out, rgba):
    """Costado de la camiseta en sombra (más oscuro hacia la axila) con su contorno exterior. Lleva el grano de lápiz de
    la propia camiseta (detalle de la manga del dibujo, repetido): un tono plano se leía como un parche."""
    m = poly(SISA)
    y, x = np.mgrid[0:H, 0:W]
    shade = np.clip((x - 400) / 110, 0, 1) * 0.5 + np.clip((y - 30) / 270, 0, 1) * 0.5  # claro hacia el peto y abajo
    patch = rgba[SISA_GRAIN[1]:SISA_GRAIN[3], SISA_GRAIN[0]:SISA_GRAIN[2], :3].mean(-1)
    grain = patch - ndimage.gaussian_filter(patch, 6)
    grain = np.tile(grain, (H // grain.shape[0] + 1, W // grain.shape[1] + 1))[:H, :W]
    tone = np.clip(222 + 20 * shade + grain, 0, 255).astype(np.uint8)  # camiseta blanca en sombra suave, con grano
    layer = np.zeros((H, W, 4), np.uint8)
    layer[..., 0], layer[..., 1], layer[..., 2] = tone, tone - 2, tone - 4
    layer[..., 3] = np.where(m, 255, 0)
    im = Image.fromarray(layer)
    ImageDraw.Draw(im).line(SISA_SIDE, fill=(20, 20, 20, 255), width=7, joint="curve")
    im.save(out / "sisa.png")
    return np.asarray(im)


def main():
    src = Path(sys.argv[1])
    rgba = np.array(Image.open(src / "cuerpo.png").convert("RGBA"))
    out = src / "e"
    top = belt_top(rgba)
    rows = np.arange(H)[:, None]
    below_top = rows >= top[None, :]
    torso_zone = rows < (top + CUT)[None, :]
    belt_zone = below_top & (rows < (top + BELT_DEPTH)[None, :])

    lum = rgba[..., :3].astype(np.float32) @ [0.299, 0.587, 0.114]
    lab, _ = ndimage.label((lum > FAR_LUM) & (rgba[..., 3] > 128))
    far = ndimage.binary_dilation(lab == lab[FAR_SEED[1], FAR_SEED[0]], iterations=1)
    collar = poly(COLLAR)
    sleeve_all = poly(SLEEVE) & torso_zone
    hollow = ellipse(**HOLLOW) & sleeve_all
    sleeve = sleeve_all & ~hollow

    def save(name, mask):
        layer = rgba.copy()
        layer[..., 3] = np.where(mask, layer[..., 3], 0)
        Image.fromarray(layer).save(out / f"{name}.png")
        return layer

    layers = {
        "piernas": save("piernas", below_top),
        "torso": save("torso", torso_zone & ~far & ~collar & ~sleeve_all),
        "cinturon": save("cinturon", belt_zone),
        "manga-cerca": save("manga-cerca", sleeve),
        "hueco-cerca": save("hueco-cerca", hollow),
        "hueco-lejos": save("hueco-lejos", far),
        "cuello-trasero": save("cuello-trasero", collar),
    }
    layers["sisa"] = sisa(out, rgba)
    print(f"hueco lejano {int(far.sum())} px, bbox x {np.where(far.any(0))[0][[0, -1]]} y {np.where(far.any(1))[0][[0, -1]]}")
    if len(sys.argv) > 2:  # depuración: cada capa sobre fondo de color, y el borde del cinturón en rojo
        tiles = []
        for name, layer in layers.items():
            t = Image.new("RGBA", (W, H), (140, 160, 190, 255))
            t.alpha_composite(Image.fromarray(layer))
            d = ImageDraw.Draw(t)
            d.line([(x, top[x]) for x in range(W)], fill=(255, 0, 0, 255), width=1)
            d.text((10, 10), name, fill=(0, 0, 0, 255))
            tiles.append(t)
        sheet = Image.new("RGBA", (W * 3, H * 2))
        for i, t in enumerate(tiles):
            sheet.paste(t, ((i % 3) * W, (i // 3) * H))
        sheet.convert("RGB").save(sys.argv[2])


main()
