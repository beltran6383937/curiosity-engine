# Diseña candidatas de la voz de Ratopín con VoxCPM2 (Apache-2.0, local, 0 €). Sin clonar a nadie: el timbre sale de la descripción.
# Cada candidata dice el chiste del jardinero en dos tomas: la 1ª diseña la voz y la 2ª la reutiliza como referencia (mismo timbre),
# unidas con la pausa cómica. Beltrán elige de oído; la elegida pasa a voice/ref.wav + voice-identity.json.
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/voz_disenar.py
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from voxcpm import VoxCPM

OUT = Path(__file__).resolve().parent.parent / "character-bible/voice/candidatas"
LINE_A = "Uf. Como sea otra vez el del aire acondicionado... me hago jardinero. Te lo juro."
LINE_B = "Es el del aire acondicionado. Madre mía."
PAUSE_S = 1.4
DESCS = [
    "Chico español de veinte años, voz masculina joven, natural y cercana, con un punto nasal de personaje de dibujos animados, vacilón e irónico, habla como si contara una anécdota graciosa a sus colegas, relajado y con sonrisa en la voz",
    "Chaval español de diecinueve años, voz juvenil aguda y vivaracha, pícaro y muy gracioso, tono de personaje de serie de animación sin ser infantil, expresivo, se le escapa la risa",
    "Joven español de veintiún años, voz masculina algo ronca y cansada, sarcástico y seco, humor irónico de colega, pausas con intención, muy natural y espontáneo",
    "Chico de dieciocho años de España, voz masculina joven con chispa y descaro, rápido y travieso, gracioso como un amigo contando una situación absurda, nada de locutor",
]

OUT.mkdir(parents=True, exist_ok=True)
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
sr = model.tts_model.sample_rate
for k, desc in enumerate(DESCS):
    final = OUT / f"cand{k + 1}.wav"
    if final.exists():
        continue
    torch.manual_seed(k + 1)
    a = model.generate(text=f"({desc}){LINE_A}", cfg_value=2.0, inference_timesteps=10)
    pa = OUT / f"cand{k + 1}-a.wav"
    sf.write(pa, a, sr)
    b = model.generate(text=LINE_B, reference_wav_path=str(pa), prompt_wav_path=str(pa), prompt_text=LINE_A, cfg_value=2.0, inference_timesteps=10)
    sf.write(final, np.concatenate([a, np.zeros(int(PAUSE_S * sr), dtype=a.dtype), b]), sr)
    print(f"cand{k + 1} ok {len(a) / sr:.1f}s + {len(b) / sr:.1f}s", flush=True)
(OUT / "descripciones.txt").write_text("\n".join(f"cand{k + 1}: {d}" for k, d in enumerate(DESCS)), encoding="utf-8")
