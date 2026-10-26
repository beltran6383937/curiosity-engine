# Voz de Pepa (paloma jefa de obra). 1) Diseña la voz desde una descripción (VoxCPM2 local, 0 €, sin clonar a nadie real)
# y la guarda como referencia; 2) genera cada frase continuando ese timbre, con el texto solo (la descripción entre paréntesis
# en modo continuación se lee en voz alta). Si una frase sale atropellada o estirada, se repite con otra semilla.
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/voz_pepa.py
import json
from pathlib import Path

import soundfile as sf
import numpy as np
import torch
from voxcpm import VoxCPM

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "work/pepa/voz"
REF, REF_TEXT = OUT / "ref.wav", "Pero bueno, ¿y esto qué es? Esto está fatal, hijo. Fatal. Yo esto no lo firmo, ¿eh? Ni de broma."
DESC = ("Señora de Madrid de unos cincuenta y cinco años, español de España con acento castellano castizo muy marcado, pronuncia la zeta, "
        "nada de acento latinoamericano, voz femenina algo ronca y grave, de portera de barrio cotilla y mandona, con mucho desparpajo y guasa, "
        "seca y rotunda, de personaje de dibujos animados")
LINES = {
    "L01": "Tengo tres años, soy paloma, y soy jefa de obra en una azotea de Madrid.",
    "L02": "Esto es todo lo que he supervisado hoy.",
    "L03": "Ocho de la mañana. Llega el instalador.",
    "L04": "Lo primero: inspección.",
    "L05": "Este tornillo, mal. Este cable, mal. Y este señor... fatal.",
    "L06": "Funciona.",
    "L07": "Y ahora, la prueba más importante.",
    "L08": "Superada.",
    "L09": "Y para terminar... lo firmo.",
    "L10": "Comenta pepa, y te enseño a no perder ni un aviso.",
}
OUT.mkdir(parents=True, exist_ok=True)
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
sr = model.tts_model.sample_rate
if not REF.exists():
    torch.manual_seed(1)
    sf.write(REF, model.generate(text=f"({DESC}){REF_TEXT}", cfg_value=2.0, inference_timesteps=10), sr)
    print("ref ok", flush=True)

def voiced(w):   # segundos con voz (sin silencios de los extremos)
    nz = np.flatnonzero(np.abs(w) > 0.02 * np.abs(w).max()); return (nz[-1] - nz[0]) / sr

for name, text in LINES.items():
    path = OUT / f"{name}.wav"
    if path.exists():
        continue
    words = len(text.split())
    for seed in (1, 2, 3, 4):
        torch.manual_seed(seed)
        w = model.generate(text=text, reference_wav_path=str(REF), prompt_wav_path=str(REF), prompt_text=REF_TEXT, cfg_value=2.0, inference_timesteps=10)
        rate = words / max(voiced(w), 0.1)
        if 1.6 <= rate <= 3.8 or words <= 2 and voiced(w) < 1.6:
            break
        print(f"{name} semilla {seed} descartada ({rate:.1f} palabras/s)", flush=True)
    sf.write(path, w, sr)
    print(f"{name} ok {len(w) / sr:.1f}s {rate:.1f} p/s semilla {seed}", flush=True)
(OUT / "lines.json").write_text(json.dumps(LINES, ensure_ascii=False, indent=1), encoding="utf-8")
