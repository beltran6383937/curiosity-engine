# Iguala la escala de las piezas v1 a la del cuerpo (cada hoja de ChatGPT sale a un tamaño distinto).
# Factores medidos a ojo sobre composiciones de prueba: cuello de la cabeza ≈ cuello de la camiseta, manga del brazo ≈
# manga del cuerpo, funda ≈ bolsillo del cinturón, boca encajada por la nariz sobre la cabeza 5.
# Uso (desde curiosity-engine): <python> -I ratopin-universe/tools/escalar.py
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parents[2] / "public/ratopin/v1"
OUT = SRC / "e"
HEAD = 1.2
SCALE = {"cuerpo-sinmangas": 1.0, "cabeza-": HEAD, "ojos-": HEAD, "boca-": 0.62 * HEAD,
         "cerca-": 0.58, "lejos-": 0.58, "llave": 0.58, "funda-movil": 0.33, "cola": 0.33}

OUT.mkdir(exist_ok=True)
for f in sorted(SRC.glob("*.png")):
    s = next((v for k, v in SCALE.items() if f.stem.startswith(k)), None)
    if s is None:
        continue
    im = Image.open(f)
    im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS).save(OUT / f.name)
    print(f"{f.name}: ×{s:.3f} → {round(im.width * s)}×{round(im.height * s)}")
