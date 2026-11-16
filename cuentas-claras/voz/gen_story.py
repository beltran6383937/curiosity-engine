"""CUENTAS CLARAS Nº1 voice: «Will» cloned locally with VoxCPM2 from the energetic EP003 take (0 EUR, ElevenLabs is exhausted until 2026-12-02).
One piece per phrase + throw-away tail «Venga, chao.». Takes: wNN_tK.wav (K = take number), several per piece to pick the most natural.
  pq-rrss/.venv-voxcpm/Scripts/python.exe -I -X utf8 voz/gen_will.py TAKE [pieces...]"""
import os, sys
import soundfile as sf
import voxcpm.model.voxcpm2 as _vm
_vm.pick_runtime_dtype = lambda device, dtype: "float32"
from voxcpm import VoxCPM
HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "ref_will_ep003.wav")
REF_TEXT = "Por fin, 3 días de civilización y ya pueden ducharse. Milagro tecnológico, joder."
P = ["¡Este fontanero acaba de perder trescientos cincuenta euros... y ni se ha enterado!",
     "Le suena el móvil: cliente nuevo. Pero tiene las manos hechas un asco, y el cliente llama al siguiente.",
     "Veredicto: esto no necesita IA. Un mensaje automático en diez segundos, y ya está."]
take = int(sys.argv[1]); only = [int(a) for a in sys.argv[2:]] or list(range(1, len(P) + 1))
model = VoxCPM.from_pretrained(os.path.expanduser("~/.cache/huggingface/hub/models--openbmb--VoxCPM2/snapshots/32279effe8c19989596f05d353d1447f51d9e915"), load_denoiser=False); sr = model.tts_model.sample_rate
for i in only:
    out = os.path.join(HERE, f"n{i:02d}_t{take}.wav")
    if os.path.exists(out): continue
    a = model.generate(text=P[i - 1] + " Venga, chao.", reference_wav_path=REF, prompt_wav_path=REF, prompt_text=REF_TEXT, cfg_value=2.0, inference_timesteps=10, max_len=160, retry_badcase_max_times=1)
    sf.write(out, a, sr); print("OK", take, i, round(len(a) / sr, 2), P[i - 1], flush=True)
