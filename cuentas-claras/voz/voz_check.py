"""EP008 voice QA (copied from EP002): Whisper (faster-whisper, MIT, local) word timings + match against the script.

  uv run --no-project --with faster-whisper python -I -X utf8 06_pipeline/days/ep008/voz_check.py 08_audio/ep008/voz_raw.mp3 08_audio/ep008/texto_voz.txt
Writes <audio>.words.json [{w, t0, t1, p}] and prints heard text, similarity ratio and every word that does not match.
"""
import difflib, json, re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

audio, script = sys.argv[1], sys.argv[2]
norm = lambda w: re.sub(r"[^a-z0-9áéíóúñü]", "", w.lower())
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
model = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else "small", device="cpu", compute_type="int8")
segs, _ = model.transcribe(np.frombuffer(raw, np.float32), language="es", beam_size=5, word_timestamps=True, vad_filter=False,
                           initial_prompt="Ramón, internet, fibra, tranvía, mercado, joder.")
heard = [w for s in segs for w in s.words]
json.dump([{"w": w.word.strip(), "t0": round(w.start, 3), "t1": round(w.end, 3), "p": round(w.probability, 3)} for w in heard],
          open(audio + ".words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
want = [norm(w) for w in open(script, encoding="utf-8").read().split() if norm(w)]
got = [norm(w.word) for w in heard if norm(w.word)]
sm = difflib.SequenceMatcher(a=want, b=got, autojunk=False)
print("HEARD:", " ".join(w.word.strip() for w in heard))
print(f"RATIO {sm.ratio():.3f}  words script={len(want)} heard={len(got)}")
for op, a0, a1, b0, b1 in sm.get_opcodes():
    if op != "equal": print(f"  {op}: script={' '.join(want[a0:a1])!r} heard={' '.join(got[b0:b1])!r}")
low = [(w.word.strip(), round(w.start, 2), round(w.probability, 2)) for w in heard if w.probability < 0.5]
print("LOW-CONFIDENCE:", low)
