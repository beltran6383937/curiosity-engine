"""Integra cinco expresiones sin mover el lienzo ni el cuello del rig.

Uso: python -I -X utf8 ratopin-universe/tools/caras.py public/ratopin/v1/e
Solo escribe e/caras/ y work/codex/caras-antes-despues.png. No usa IA ni red.
Las máscaras están dibujadas en las coordenadas originales, mirando a la izquierda.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
from scipy import ndimage
from scipy.interpolate import CubicHermiteSpline


PAIRS = [('H1', '02'), ('H1', '07'), ('H5', '06'), ('H5', '11'), ('H5', '02')]
NOSE = {'H1': (78, 229), 'H5': (65, 238)}
# Fila donde termina el mentón y comienza el cuello del recambio.
CHIN_Y = {'02': 123, '06': 143, '07': 130, '11': 154}


def polygon(size, points):
    im = Image.new('L', size)
    ImageDraw.Draw(im).polygon(points, fill=255)
    return np.array(im, dtype=float) / 255


def texture(head):
    """Pelaje real de la mejilla con solapes suaves, sin color plano."""
    rgb = np.array(head, dtype=float)[..., :3]
    # Zona interna sin contornos ni dientes. Conserva el grano del lápiz.
    patch = rgb[300:328, 230:310]
    # Eliminar posibles fragmentos de bigote del donante, conservando el lápiz gris.
    good = ~ndimage.binary_dilation(patch.mean(2) < 160, iterations=2)
    nearest = ndimage.distance_transform_edt(~good, return_distances=False, return_indices=True)
    patch = patch[tuple(nearest)]
    patch -= ndimage.gaussian_filter(patch, (5, 5, 0))
    h, w = rgb.shape[:2]
    # Pequeñas muestras reales con solape coseno y semilla fija: no se refleja
    # la tinta (el reflejo crearía rombos reconocibles en el pelaje).
    rng = np.random.default_rng(21)
    grain = np.zeros((h + 24, w + 24, 3))
    weight = np.zeros((h + 24, w + 24))
    window = np.outer(np.hanning(26)[1:-1], np.hanning(26)[1:-1])
    for ty in range(0, h, 12):
        for tx in range(0, w, 12):
            py = rng.integers(0, patch.shape[0] - 23)
            px = rng.integers(0, patch.shape[1] - 23)
            grain[ty:ty + 24, tx:tx + 24] += patch[py:py + 24, px:px + 24] * window[..., None]
            weight[ty:ty + 24, tx:tx + 24] += window
    grain = grain[:h, :w] / weight[:h, :w, None]
    # Sombreado suave tomado de la cabeza, excluyendo tinta, ojos y transparencia.
    valid = (rgb.mean(2) > 175) & (np.array(head)[..., 3] > 250)
    weights = ndimage.gaussian_filter(valid.astype(float), 22)
    shade = ndimage.gaussian_filter(rgb * valid[..., None], (22, 22, 0)) / np.maximum(weights[..., None], 1e-6)
    shade[weights < .01] = np.median(rgb[valid], axis=0)
    return np.clip(shade + grain, 0, 255)


def placed(mouth, size, origin):
    """Traslación subpíxel: la nariz conserva el anclaje del componente Mouth."""
    return mouth.transform(size, Image.Transform.AFFINE,
                           (1, 0, -origin[0], 0, 1, -origin[1]),
                           Image.Resampling.BICUBIC)


def integrate(head, mouth, key, number):
    flip = key == 'H1'
    canonical = ImageOps.mirror(head) if flip else head.copy()
    w, h = canonical.size
    nx, ny = NOSE[key]
    ox, oy = nx - 37, ny - 33.5
    cy = CHIN_Y[number]
    rgba = np.array(canonical, dtype=float)
    fur = texture(canonical)
    y, x = np.mgrid[:h, :w]

    # Se conserva todo el ojo y el puente sobre el hocico. El borrado incluye
    # nariz, sonrisa, incisivos y borde inferior, hasta la raíz del cuello.
    erase = polygon((w, h), [(0, 185), (114, 195), (126, 220), (155, 237),
                             (199, 246), (275, 247), (293, 277), (319, 310),
                             (302, 336), (250, 353), (226, 377), (180, 377),
                             (100, 352), (0, 312)])
    erase = np.array(Image.fromarray(np.uint8(erase * 255)).filter(ImageFilter.GaussianBlur(2.5))) / 255
    original = np.array(canonical)
    neck_edge = np.array([np.flatnonzero(row > 160)[0] if (row > 160).any() else 0
                          for row in original[..., 3]], dtype=float)
    join_y = 370
    # Recuperar progresivamente el sombreado original del cuello, sin una
    # franja horizontal donde termine el clonado. Solo se borra por completo
    # su contorno antiguo, que ahora queda dentro de la mandíbula más ancha.
    erase *= np.clip((join_y - y) / 40, 0, 1)
    old_neck = (y >= 330) & (y < join_y) & (abs(x - neck_edge[:, None] - 3) < 8)
    ink = original[..., :3].mean(2) < 190
    neck_ink = ndimage.gaussian_filter((old_neck & ink).astype(float), .6)
    erase = np.maximum(erase, neck_ink)
    rgba[..., :3] = rgba[..., :3] * (1 - erase[..., None]) + fur * erase[..., None]

    # Quitar también el alfa de la nariz vieja: repintar solo el RGB dejaría
    # un bulto blanco por encima del nuevo contorno.
    rgba[(x < 116) & (y >= 185) & (y < oy + 60), 3] = 0

    # Reconectar el puente con el lateral superior de la nariz nueva.
    back_x, back_y = {'02': (58, 24), '06': (70, 27), '07': (61, 24), '11': (58, 24)}[number]
    a = (ox + back_x, oy + back_y)
    b = (141, 211) if flip else (130, 218)
    bridge = polygon((w, h), [a, b, (155, b[1] + 15), (155, oy + 60), (a[0], oy + 60)])
    bridge = bridge > 0
    rgba[bridge, :3] = fur[bridge]
    rgba[bridge, 3] = 255

    # Un solo límite delantero: mentón nuevo → curva del cuello original.
    # El perfil del labio/diente es el alfa real del recambio, sin sus bigotes.
    body = ndimage.binary_opening(np.array(mouth)[..., 3] > 128, iterations=2)
    edge = np.array([np.flatnonzero(row)[0] if row.any() else 0 for row in body], dtype=float)
    chin = (ox + edge[cy] + 1.5, oy + cy)
    neck_x = neck_edge[join_y] + 1.5
    start_slope = 1.5 * (neck_x - chin[0]) / (join_y - chin[1])
    end_slope = (neck_edge[join_y + 3] - neck_edge[join_y - 3]) / 6
    curve = CubicHermiteSpline([chin[1], join_y], [chin[0], neck_x], [start_slope, end_slope])
    mouth_front = ox + np.interp(y - oy, np.arange(len(edge)), edge) + 3
    front = np.where(y < chin[1], mouth_front, curve(np.clip(y, chin[1], join_y)))
    affected = (y >= oy + 55) & (y < join_y) & (x < 270)
    inner_alpha = np.where(original[..., 3] > 128, original[..., 3], 255)
    rgba[..., 3] = np.where(affected, np.clip(x - front + .5, 0, 1) * inner_alpha, rgba[..., 3])
    extend = affected & (rgba[..., 3] > 0) & (original[..., 3] < 128)
    rgba[extend, :3] = fur[extend]

    # Contorno continuo, en vez del cuello estrecho que traía cada boca.
    line = Image.new('RGBA', (w * 4, h * 4))
    draw = ImageDraw.Draw(line)
    t = np.linspace(0, 1, 40)
    bridge_x = a[0] + (b[0] - a[0]) * t
    bridge_y = a[1] + (b[1] - a[1]) * (1 - (1 - t) ** 2)
    draw.line([(round(xx * 4), round(yy * 4)) for xx, yy in zip(bridge_x, bridge_y)],
              fill=(31, 30, 29, 255), width=12, joint='curve')
    sy = np.linspace(chin[1], join_y, 100)
    sx = curve(sy)
    draw.line([(round(a * 4), round(b * 4)) for a, b in zip(sx, sy)],
              fill=(31, 30, 29, 255), width=14, joint='curve')
    line = line.resize((w, h), Image.Resampling.LANCZOS)
    base = Image.fromarray(np.uint8(np.clip(rgba, 0, 255)))

    # La boca presta sus rasgos y su mentón, pero no su cuello ni el contorno
    # posterior de la mejilla (que quedarían flotando en mitad de la cabeza).
    mw, mh = mouth.size
    my, mx = np.mgrid[:mh, :mw]
    right = np.clip((190 - mx) / 48, 0, 1)
    top = np.clip((my - (30 + (mx - 65) * .4)) / 12, 0, 1)
    # Proteger la nariz entera, incluida la más ancha (06), pero excluir el
    # borde superior del hocico donante: lo sustituye el puente que acabamos
    # de unir a la cabeza, y conservar ambos trazos formaría una bifurcación.
    nose_right = {'02': [25, 40, 50, 60, 66, 65, 55, 40],
                  '06': [35, 50, 62, 73, 79, 79, 70, 49],
                  '07': [25, 42, 53, 63, 70, 69, 57, 40],
                  '11': [25, 40, 50, 59, 66, 67, 56, 40]}
    limit = np.interp(my, [0, 8, 15, 25, 35, 45, 55, 65], nose_right[number])
    top = np.maximum(top, np.clip((limit + 2 - mx) / 2, 0, 1))
    # Conservar borde inferior del mentón; fundir el pelaje interior encima.
    bottom = np.clip((cy + 5 - my) / 4, 0, 1)
    cut = right * top * bottom
    mr = np.array(mouth).copy()
    mr[..., 3] = np.uint8(mr[..., 3] * cut)
    donor = placed(Image.fromarray(mr), (w, h), (ox, oy))
    base.alpha_composite(donor)
    base.alpha_composite(line)
    # El color/alfa de la zona superior nunca cambia, ni por el filtrado.
    out = np.array(base)
    out[:185] = original[:185]
    out[join_y:] = original[join_y:]
    result = Image.fromarray(out)
    return ImageOps.mirror(result) if flip else result


def current(head, mouth, key):
    w, _ = mouth.size
    nx, ny = (426, 229) if key == 'H1' else (65, 238)
    left = nx - (w - 37) if key == 'H1' else nx - 37
    layer = ImageOps.mirror(mouth) if key == 'H1' else mouth
    out = head.copy()
    out.alpha_composite(placed(layer, head.size, (left, ny - 33.5)))
    return out


def main():
    src = Path(sys.argv[1]).resolve()
    out = src / 'caras'
    out.mkdir(exist_ok=True)
    root = Path(__file__).resolve().parents[2]
    debug = root / 'work/codex'
    debug.mkdir(parents=True, exist_ok=True)
    sheet = Image.new('RGB', (2064, 5 * 930), '#faf9f6')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22) if Path('C:/Windows/Fonts/segoeui.ttf').exists() else ImageFont.load_default()
    for i, (key, number) in enumerate(PAIRS):
        head = Image.open(src / f'cabeza-{key[1]}.png').convert('RGBA')
        mouth = Image.open(src / f'boca-{number}.png').convert('RGBA')
        result = integrate(head, mouth, key, number)
        name = f'{key}-boca-{number}.png'
        result.save(out / name)
        for column, (label, im) in enumerate([('PEGADO ACTUAL', current(head, mouth, key)), ('INTEGRADA', result)]):
            tile = Image.new('RGBA', im.size, '#faf9f6')
            tile.alpha_composite(im)
            sheet.paste(tile.convert('RGB').resize((im.width * 2, im.height * 2), Image.Resampling.NEAREST),
                        (column * 1032 + 12, i * 930 + 42))
            draw.text((column * 1032 + 16, i * 930 + 10), f'{name}  |  {label}  |  x2', fill='#202020', font=font)
        print(f'{name}: {result.width}x{result.height} RGBA')
    sheet.save(debug / 'caras-antes-despues.png')
    print(debug / 'caras-antes-despues.png')


if __name__ == '__main__':
    main()
