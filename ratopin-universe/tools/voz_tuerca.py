# Voz del episodio 1 de la Tuerca: misma voz aprobada (es3, character-bible/voice/voice-identity.json), una frase por archivo.
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/voz_tuerca.py
import json
from pathlib import Path

import soundfile as sf
import torch
from voxcpm import VoxCPM

ROOT = Path(__file__).resolve().parents[2]
VOICE = ROOT / "ratopin-universe/character-bible/voice"
ID = json.loads((VOICE / "voice-identity.json").read_text(encoding="utf-8"))
OUT = ROOT / "work/tuerca/voz"
LINES = {
    "L01": "Tengo veinticinco años, soy una tuerca, y trabajo de instalador en Madrid. Esto es todo lo que he hecho hoy.",
    "L02": "Siete y cincuenta y ocho. Modo en forma.",
    "L03": "Siete y cincuenta y nueve.",
    "L04": "Primer aviso. Una caldera que hace un ruido rarísimo.",
    "L05": "Y la señora me dice: es que ahí dentro hay una tuerca floja.",
    "L06": "¿Perdona?",
    "L07": "Floja tu caldera, señora.",
    "L08": "Segundo aviso. Un aire acondicionado en una azotea. Seis pisos. Sin ascensor.",
    "L09": "Estoy... perfectamente.",
    "L10": "¿Otro aviso? ¿Hoy?",
    "L11": "Comenta tuerca, y te enseño a no perder ni un aviso.",
}
OUT.mkdir(parents=True, exist_ok=True)
g = ID["generation"]
model = VoxCPM.from_pretrained(ID["model"], load_denoiser=g["load_denoiser"])
sr = model.tts_model.sample_rate
ref, ref_text = str(ROOT / "ratopin-universe" / ID["reference_wav"]), (ROOT / "ratopin-universe" / ID["reference_text"]).read_text(encoding="utf-8").strip()
for name, text in LINES.items():
    path = OUT / f"{name}.wav"
    if path.exists():
        continue
    torch.manual_seed(ID["seed"])
    # sin la descripción entre paréntesis: en modo continuación el modelo la lee en voz alta (~15 s); el timbre lo da ref.wav
    wav = model.generate(text=text, reference_wav_path=ref, prompt_wav_path=ref, prompt_text=ref_text,
                         cfg_value=g["cfg_value"], inference_timesteps=g["inference_timesteps"])
    sf.write(path, wav, sr)
    print(f"{name} ok {len(wav) / sr:.1f}s", flush=True)
(OUT / "lines.json").write_text(json.dumps(LINES, ensure_ascii=False, indent=1), encoding="utf-8")
