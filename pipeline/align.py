# ECHO/CUT · tiempos por frase y palabra de la locución (pipeline/voice.py) con Whisper local (faster-whisper, MIT).
# Recorta la coletilla desechable final, opcionalmente acelera sin cambiar el tono, normaliza a -14 LUFS y escribe
# public/audio/<id>.mp3 + <id>.json { voice, duration, lines: [{ text, start, end }] } como voz_kokoro.py.
# Uso: uv run --no-project --with faster-whisper python -I -X utf8 pipeline/align.py episodes/<id>/episode.json [tempo=1.0]
import difflib, json, re, subprocess, sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
tempo = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
src = ROOT / "work" / spec["id"] / "voice.wav"
norm = lambda w: re.sub(r"[^a-z0-9áéíóúñü]", "", w.lower())

raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
model = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = model.transcribe(np.frombuffer(raw, np.float32), language="es", beam_size=5, word_timestamps=True, vad_filter=False)
heard = [w for s in segs for w in s.words]
print("whisper:", " ".join(w.word.strip() for w in heard))

# La voz dice "say" (cifras en letra) pero Whisper suele escribir las cifras en dígitos, como el texto en pantalla.
# Se alinea con las dos versiones y se queda la que más coincide; los tiempos se pasan luego a las palabras en pantalla.
def tokens(spoken):
    return [(i, norm(w)) for i, l in enumerate(spec["lines"]) for w in (spec.get("say", {}).get(str(i), l) if spoken else l).split() if norm(w)]

def match(script):
    m = difflib.SequenceMatcher(a=[w for _, w in script], b=[norm(w.word) for w in heard], autojunk=False)
    return {a + k: b + k for a, b, n in m.get_matching_blocks() for k in range(n)}

script, s2h = max(((s, match(s)) for s in [tokens(False)] + ([tokens(True)] if spec.get("say") else [])), key=lambda x: len(x[1]) / len(x[0]))
print(f"coinciden {len(s2h)}/{len(script)} palabras")
match = len(s2h) / len(script)
# SENTINEL: puerta de calidad de la voz (lo que se oye coincide con el guion)
(ROOT / "public/audio").mkdir(parents=True, exist_ok=True)  # se versiona: sobrevive al cambiar de runner
(ROOT / "public/audio" / f"{spec['id']}.qa.json").write_text(json.dumps({"matched": len(s2h), "total": len(script), "ratio": round(match, 3), "heard": " ".join(w.word.strip() for w in heard)}, ensure_ascii=False, indent=1), encoding="utf-8")
if match < 0.9:
    raise SystemExit(f"VOZ RECHAZADA: solo coincide el {match:.0%} del guion (mínimo 90 %): regenera la locución")

def first_time(line):  # inicio de la primera palabra reconocida de la frase
    for k, (i, _) in enumerate(script):
        if i == line and k in s2h:
            return heard[s2h[k]].start
    raise SystemExit(f"frase {line} sin palabras reconocidas: revisa la locución")

last_k = max(k for k, (i, _) in enumerate(script) if i == len(spec["lines"]) - 1 and k in s2h)
assert last_k == len(script) - 1, "la última palabra del guion no se oye entera: regenera la locución"
cut = heard[s2h[last_k]].end + 0.3
starts = [max(0.0, first_time(i) - 0.05) for i in range(len(spec["lines"]))]
lines = [{"text": t, "start": round(starts[i] / tempo, 3), "end": round((starts[i + 1] - 0.08 if i + 1 < len(starts) else cut) / tempo, 3)} for i, t in enumerate(spec["lines"])]
# Tiempos por palabra (subtítulos palabra a palabra): las no reconocidas se reparten entre sus vecinas reconocidas.
wt = [(heard[s2h[k]].start, heard[s2h[k]].end) if k in s2h else None for k in range(len(script))]
for k in range(len(wt)):
    if wt[k] is None:
        prev = next((wt[j][1] for j in range(k - 1, -1, -1) if wt[j]), 0.0)
        nxt = next((wt[j][0] for j in range(k + 1, len(wt)) if wt[j]), cut)
        wt[k] = (prev, max(prev + 0.05, (prev + nxt) / 2))
# Palabras en pantalla: reparto proporcional sobre las habladas de su frase (1:1 si son las mismas).
for i, l in enumerate(spec["lines"]):
    dw = [w for w in l.split() if norm(w)]
    ks = [k for k, (j, _) in enumerate(script) if j == i]
    n, m = len(dw), len(ks)
    lines[i]["words"] = [{"w": w, "s": round(wt[ks[x * m // n]][0] / tempo, 3), "e": round(wt[ks[min(m - 1, ((x + 1) * m - 1) // n)]][1] / tempo, 3)} for x, w in enumerate(dw)]

out = ROOT / "public/audio"; out.mkdir(parents=True, exist_ok=True)
af = f"atrim=0:{cut},afade=t=out:st={cut - 0.12}:d=0.12,atempo={tempo},apad=pad_dur=0.6,loudnorm=I=-14:TP=-1.5:LRA=11"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", af, "-ar", "44100", "-b:a", "192k", str(out / f"{spec['id']}.mp3")], check=True)
duration = round(cut / tempo + 0.6, 3)
(out / f"{spec['id']}.json").write_text(json.dumps({"voice": spec.get("voice", "VoxCPM2 (voz diseñada)"), "engine": "VoxCPM2", "duration": duration, "lines": lines}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"ok {spec['id']}: {duration} s (tempo {tempo})")
for l in lines: print(f"{l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")
