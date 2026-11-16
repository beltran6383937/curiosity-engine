"""Lay the 8 cloned-Will pieces (wNN_tK.wav + .words.json) one after another -> voz_edit.wav + ../timeline.json (cues from Whisper word times).
  uv run --no-project --with soundfile --with numpy python -I -X utf8 voz/assemble_voz.py [take for each piece e.g. 1 1 1 1 1 1 1 1]"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 44100; FADE = int(0.012 * SR)
TAKES = [int(a) for a in sys.argv[1:]] or [1] * 8
GAP = {1: 0.10, 2: 0.14, 3: 0.12, 4: 0.12, 5: 0.22, 6: 0.14, 7: 0.20}    # pause after piece i
norm = lambda w: re.sub(r"[^a-z0-9áéíóúñü]", "", w.lower())

PIECES = [("n01", 1), ("n02", 1), ("w03", 1), ("w04", 1), ("w05", 1), ("n03", 1), ("w08", 1)]
GAP = {0: 0.12, 1: 1.45, 2: 0.10, 3: 0.12, 4: 0.20, 5: 0.14}
def load(i):
    name, k = PIECES[i]; src = os.path.join(HERE, f"{name}_t{k}.wav"); w = src[:-4] + "_44k.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), w], check=True)
    x = sf.read(w)[0]; ws = json.load(open(src + ".words.json", encoding="utf-8"))
    kk = next((j for j, v in enumerate(ws) if norm(v["w"]).startswith("veng") and j > 2), len(ws))
    h = int(0.05 * SR); on = next(j for j in range(0, len(x) - h, h // 2) if 20 * np.log10(np.sqrt((x[j:j + h] ** 2).mean()) + 1e-9) > -30)
    t0 = max(0.0, on / SR - 0.04); t1 = min(ws[kk - 1]["t1"] + 0.14, (ws[kk - 1]["t1"] + ws[kk]["t0"]) / 2) if kk < len(ws) else len(x) / SR
    y = tighten(x[int(t0 * SR):int(t1 * SR)].copy(), 0.13); y = tempo(y, TEMPO); y[:FADE] *= np.linspace(0, 1, FADE); y[-FADE:] *= np.linspace(1, 0, FADE)
    return y, []

TEMPO = 1.07
def tempo(x, r):
    a = os.path.join(HERE, "_fit_in.wav"); b = os.path.join(HERE, "_fit_out.wav"); sf.write(a, x, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-af", f"atempo={r:.4f}", b], check=True); return sf.read(b)[0]

def tighten(x, keep=0.20):
    h = int(0.01 * SR); n = len(x) // h; db = [20 * np.log10(np.sqrt((x[j * h:(j + 1) * h] ** 2).mean()) + 1e-9) for j in range(n)]
    out, keepmap, j = [], [], 0
    while j < n:
        if db[j] < -42:
            k = j
            while k < n and db[k] < -42: k += 1
            m = min(k - j, int(keep / 0.01)); out.append(x[j * h:(j + m) * h]); j = k
        else: out.append(x[j * h:(j + 1) * h]); j += 1
    return np.concatenate(out + [x[n * h:]])

pieces, t, starts = [], 0.10, {}
for i in range(len(PIECES)):
    y, _ = load(i); rms = float(np.sqrt((y ** 2).mean())); pieces.append((t, y, rms)); starts[i] = t
    t += len(y) / SR + GAP.get(i, 0.0)
ref = pieces[0][2]; dur = t + 0.9; out = np.zeros(int(dur * SR))
for s_, y, rms in pieces:
    y = y * min(2.0, ref / rms); a = int(s_ * SR); out[a:a + len(y)] += y
sf.write(os.path.join(HERE, "voz_edit.wav"), out, SR)
import numpy as np
from faster_whisper import WhisperModel
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(HERE, "voz_edit.wav"), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(np.frombuffer(raw, np.float32), language="es", beam_size=5, word_timestamps=True, initial_prompt="Joder, curro, euros, veredicto.")
H = [dict(w=w.word.strip(), t0=w.start, t1=w.end) for s_ in segs for w in s_.words]
json.dump(H, open(os.path.join(HERE, "voz_edit.words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
def wt(i, pred, nxt=None):
    hi = starts[nxt] if nxt is not None else 1e9
    for v in H:
        if v["t0"] >= starts[i] - 0.15 and v["t0"] < hi and pred(norm(v["w"])): return round(v["t0"], 2)
    print("NO CUE", i); return round(starts[i], 2)
# merge "2" + ".800"
W2 = []
for v in H:
    if W2 and v["w"].startswith(".") and W2[-1]["w"].isdigit(): W2[-1]["w"] += v["w"]; W2[-1]["t1"] = v["t1"]
    else: W2.append(dict(v))
cue = {"story": round(starts[1], 2), "coin": wt(0, lambda w: w == "ni"), "cliente": wt(1, lambda w: w.startswith("client"), 2), "manos": wt(1, lambda w: w.startswith("manos"), 2),
       "siguiente": wt(1, lambda w: w.startswith("siguiente"), 2), "ledger": round(starts[2], 2), "r2": wt(2, lambda w: w == "una", 3), "r2v": wt(2, lambda w: w == "dos", 3),
       "r3": wt(3, lambda w: w.startswith("700") or w.startswith("setec"), 4), "r4": round(starts[4], 2), "total": wt(4, lambda w: w.startswith("2") or w == "dos", 5),
       "verdict": round(starts[5], 2), "auto": wt(5, lambda w: w.startswith("mensaje"), 6), "cta": round(starts[6], 2)}
cue["ejemplo"] = round(cue["total"] + 1.9, 2)
json.dump({"dur": round(dur, 2), "cue": cue, "words": [dict(w=v["w"], t0=round(v["t0"], 2), t1=round(v["t1"], 2)) for v in W2]}, open(os.path.join(HERE, "..", "remotion", "tl.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump(cue, open(os.path.join(HERE, "cue.json"), "w"), indent=1)
print(json.dumps({"dur": round(dur, 2), "cue": cue}, indent=1))
