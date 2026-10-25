# Ratopín con acento de España. Beltrán eligió el timbre de cand1 (25-10) pero sonaba latinoamericano: estas variantes
# prueban dos caminos con VoxCPM2 (local, 0 €, sin clonar a ninguna persona real):
#   · clonado controlado: el timbre de cand1 como referencia + indicación de acento castellano entre paréntesis;
#   · diseño desde cero con el acento muy explícito (en español y en inglés).
# es5 parte de la voz de la serie «Espera, espera» (también diseñada, ya aceptada como española) hecha más de dibujo animado.
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/voz_espana.py
from pathlib import Path

import soundfile as sf
import torch
from voxcpm import VoxCPM

HERE = Path(__file__).resolve().parent.parent / "character-bible/voice/candidatas"
OUT = HERE / "espana"
CAND1 = str(HERE / "cand1-a.wav")
CHICO = str(Path(__file__).resolve().parents[3] / "pq-rrss/out/voz/chico/voz.wav")
TEXT = "Uf. Como sea otra vez el del aire acondicionado... me hago jardinero. Te lo juro. ... Es el del aire acondicionado. Madre mía."
VARIANTS = {
    "es1": (CAND1, "acento castellano de España, de Madrid, pronuncia la zeta y la ce como en España, nada de acento latinoamericano, vacilón e irónico"),
    "es2": (CAND1, "Castilian Spanish accent from Madrid, Spain, European Spanish pronunciation, not Latin American, playful and ironic"),
    "es3": (None, "Chico de Madrid de veinte años, español de España con acento castellano muy marcado, pronuncia la zeta, nada de acento "
                  "latinoamericano, voz masculina joven, natural y cercana, con un punto nasal de personaje de dibujos animados, vacilón e "
                  "irónico, relajado y con sonrisa en la voz"),
    "es4": (None, "A twenty-year-old young man from Madrid, Spain, speaking Castilian Spanish with a strong Spain accent, European Spanish, "
                  "not Latin American, slightly nasal cartoon-character voice, playful, ironic, relaxed, smiling while he talks"),
    "es5": (CHICO, "voz algo nasal de personaje de dibujos animados, vacilón e irónico, relajado, con sonrisa en la voz"),
}

OUT.mkdir(parents=True, exist_ok=True)
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
sr = model.tts_model.sample_rate
for name, (ref, style) in VARIANTS.items():
    path = OUT / f"{name}.wav"
    if path.exists():
        continue
    torch.manual_seed(1)
    wav = model.generate(text=f"({style}){TEXT}", reference_wav_path=ref, cfg_value=2.0, inference_timesteps=10)
    sf.write(path, wav, sr)
    print(f"{name} ok {len(wav) / sr:.1f}s", flush=True)
(OUT / "variantes.txt").write_text("\n".join(f"{k}: {'timbre de ' + Path(r).name + ' + ' if r else ''}{s}" for k, (r, s) in VARIANTS.items()), encoding="utf-8")
(OUT / "ref.txt").write_text(TEXT, encoding="utf-8")
