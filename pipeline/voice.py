# ECHO · locución de una sola toma con VoxCPM2 (Apache-2.0, local, 0 €) usando la voz diseñada "narrador".
# Añade una coletilla desechable ("Venga, chao.") para que el modelo no se coma la última palabra; align.py la recorta.
# Uso: <python con voxcpm> -I -X utf8 pipeline/voice.py episodes/<id>/episode.json
import json, sys
from pathlib import Path

import soundfile as sf
from voxcpm import VoxCPM

ROOT = Path(__file__).resolve().parent.parent
spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
ref = ROOT / "assets/voice/narrador.wav"
ref_text = (ROOT / "assets/voice/narrador.txt").read_text(encoding="utf-8").strip()
text = " ".join(spec.get("say", {}).get(str(i), l) for i, l in enumerate(spec["lines"])) + " Venga, chao."
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
a = model.generate(text=text, reference_wav_path=str(ref), prompt_wav_path=str(ref), prompt_text=ref_text, cfg_value=2.0, inference_timesteps=10)
out = ROOT / "work" / spec["id"]; out.mkdir(parents=True, exist_ok=True)
sf.write(out / "voice.wav", a, model.tts_model.sample_rate)
print(f"ok {spec['id']}: {len(a) / model.tts_model.sample_rate:.1f} s -> {out / 'voice.wav'}")
