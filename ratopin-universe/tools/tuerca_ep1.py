# Tuerca · episodio 1: monta la línea de tiempo con las duraciones REALES de la voz, saca la boca (envolvente de la voz
# por fotograma) y mezcla voz + efectos + música propios (sintetizados aquí, 0 € y sin derechos de terceros).
# Salidas: remotion/src/tuerca/ep1-timeline.json · public/tuerca/ep1/mix.wav
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/tuerca_ep1.py
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
VOZ = ROOT / "work/tuerca/voz"
SR, FPS = 44100, 24
rng = np.random.default_rng(3)

def load(name):
    x, sr = sf.read(VOZ / f"{name}.wav", dtype="float32")
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr).astype(np.float32)
    nz = np.flatnonzero(np.abs(x) > 0.01 * np.abs(x).max())          # recorta silencios del principio y del final
    return x[max(0, nz[0] - 800): nz[-1] + 2200]

LINES = json.loads((VOZ / "lines.json").read_text(encoding="utf-8"))
V = {k: load(k) for k in LINES}
dur = {k: len(v) / SR for k, v in V.items()}

# ── línea de tiempo (segundos) ──
ev, at = {}, {}
def say(name, t): at[name] = t; return t + dur[name]
t = say("L01", 0.25)
t = say("L02", t + 0.35)
ev["suck"] = t + 0.15; ev["pop"] = ev["suck"] + 1.5; ev["crack"] = ev["pop"] + 0.55
t = say("L03", ev["pop"] + 1.15)
ev["kitchen"] = t + 0.6
t = say("L04", ev["kitchen"] + 0.5)
ev["trrr"] = t + 0.2
t = say("L05", ev["trrr"] + 1.3)
ev["stare"] = t + 0.1
t = say("L06", ev["stare"] + 0.9)
t = say("L07", t + 0.45)
ev["windup"] = t + 0.1; ev["throw"] = ev["windup"] + 0.45; ev["clonk"] = ev["throw"] + 0.5; ev["bonk"] = ev["clonk"] + 0.65
ev["roof"] = ev["bonk"] + 1.8
ev["popup"] = ev["roof"] + 2.2
t = say("L08", ev["popup"] + 0.7)
t = say("L09", t + 0.35)
ev["ring"] = t + 0.4
t = say("L10", ev["ring"] + 1.2)
ev["fall"] = t + 0.25; ev["clonc"] = ev["fall"] + 0.45
t = say("L11", ev["clonc"] + 0.9)
ev["end"] = t + 1.3
total = int(np.ceil(ev["end"] * FPS))

# ── boca: envolvente de la voz por fotograma (0‥1), normalizada por frase ──
mouth = np.zeros(total)
for k, x in V.items():
    hop = SR // FPS
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
    rms = np.convolve(rms, [0.25, 0.5, 0.25], "same") / (np.percentile(rms, 95) + 1e-9)
    s = int(round(at[k] * FPS))
    seg = np.clip((rms - 0.12) * 1.25, 0, 1)
    mouth[s:s + len(seg)] = np.maximum(mouth[s:s + len(seg)], seg[: max(0, total - s)])

# ── efectos (sintetizados) ──
tt = lambda d: np.arange(int(SR * d)) / SR
def norm(x, peak): return (x / (np.abs(x).max() + 1e-9) * peak).astype(np.float32)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
def metal(f0, d, decay, partials=(1, 2.76, 5.4, 8.9)):        # golpe metálico: parciales inarmónicos
    x = tt(d); return sum(np.sin(2 * np.pi * f0 * p * x) * np.exp(-x * decay * (1 + i * 0.6)) / (i + 1) for i, p in enumerate(partials))
SFX = {
    "inhale": norm(lp(rng.standard_normal(int(SR * 1.2)), 30) * np.linspace(0, 1, int(SR * 1.2)) ** 1.5, 0.25),
    "pop": norm(np.sin(2 * np.pi * np.cumsum(np.linspace(900, 140, int(SR * 0.18))) / SR) * np.exp(-tt(0.18) * 18), 0.8),
    "zip": norm(np.sin(2 * np.pi * np.cumsum(np.linspace(500, 2200, int(SR * 0.45))) / SR) * np.exp(-tt(0.45) * 3), 0.35),
    "crack": norm(np.concatenate([rng.standard_normal(int(SR * 0.05)) * 1.0, lp(rng.standard_normal(int(SR * 0.5)), 3) * np.exp(-tt(0.5) * 9)]), 0.6),
    "step": norm(metal(1250, 0.25, 26), 0.22),
    "trrr": norm(np.sign(np.sin(2 * np.pi * 38 * tt(1.0))) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * tt(1.0))) * lp(rng.standard_normal(int(SR)), 6), 0.3),
    "clonk": norm(metal(420, 1.2, 4.5) + 0.6 * lp(rng.standard_normal(int(SR * 1.2)), 8) * np.exp(-tt(1.2) * 30), 0.75),
    "bonk": norm(metal(260, 1.4, 3.0, (1, 1.5, 2.9)) * (1 + 0.3 * np.sin(2 * np.pi * 6 * tt(1.4))), 0.8),
    "tweet": norm(sum(np.sin(2 * np.pi * np.cumsum(2600 + 700 * np.sin(2 * np.pi * 9 * tt(0.22))) / SR) * np.exp(-tt(0.22) * 6) for _ in [0]), 0.18),
    "clunk": norm(metal(600, 0.35, 14) + lp(rng.standard_normal(int(SR * 0.35)), 20) * np.exp(-tt(0.35) * 25), 0.4),
    "pant": norm(lp(rng.standard_normal(int(SR * 0.3)), 14) * np.sin(np.pi * tt(0.3) / 0.3), 0.18),
    "ring": norm(np.where(np.sin(2 * np.pi * 16 * tt(1.1)) > 0, np.sin(2 * np.pi * 1320 * tt(1.1)), np.sin(2 * np.pi * 1760 * tt(1.1))) * ((tt(1.1) % 0.55) < 0.38), 0.3),
    "clonc": norm(metal(180, 1.6, 2.6) + metal(330, 1.6, 5) + lp(rng.standard_normal(int(SR * 1.6)), 10) * np.exp(-tt(1.6) * 12), 0.95),
}
CUES = [("inhale", ev["suck"]), ("pop", ev["pop"]), ("zip", ev["pop"] + 0.05), ("crack", ev["crack"]),
        *[("step", ev["kitchen"] + 0.08 + i * 0.25) for i in range(5)], ("trrr", ev["trrr"]), ("trrr", ev["trrr"] + 1.0),
        *[("trrr", s) for s in np.arange(ev["trrr"] + 2.0, ev["clonk"], 1.0)],
        ("zip", ev["throw"]), ("clonk", ev["clonk"]), ("bonk", ev["bonk"]), *[("tweet", ev["bonk"] + 0.35 + i * 0.3) for i in range(4)],
        *[("clunk", ev["roof"] + 0.15 + i * 0.3) for i in range(7)], *[("pant", ev["popup"] + i * 0.42) for i in range(4)],
        ("ring", ev["ring"]), ("clonc", ev["clonc"])]
gains = {"trrr": 1.0}

n = int(ev["end"] * SR) + SR
voice = np.zeros(n, np.float32); fx = np.zeros(n, np.float32)
for k, x in V.items():
    s = int(at[k] * SR); voice[s:s + len(x)] += x
for name, s in CUES:
    x = SFX[name]; i = int(s * SR); fx[i:i + len(x)] += x[: n - i] * gains.get(name, 1.0)
# el traqueteo de la caldera baja mientras habla la tuerca
duck = np.ones(n, np.float32)
for k in ("L05",):
    duck[int(at[k] * SR): int((at[k] + dur[k]) * SR)] = 0.45

# ── música: bajo pizzicato + marimba, juguetona, en Do mayor (original) ──
def pluck(f, d, dec=7.0):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x)) * np.exp(-x * dec)
bpm, beat = 112, 60 / 112
mus = np.zeros(n, np.float32)
roots = [48, 45, 41, 43]                                         # C · Am · F · G
mel = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 79, 77, 74, 71]
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
b = 0
while b * beat < ev["end"]:
    i = int(b * beat * SR); bar = (b // 4) % 4
    if b % 2 == 0: x = pluck(hz(roots[bar]), 0.45, 9); mus[i:i + len(x)] += x[: n - i] * 0.55
    else: x = pluck(hz(roots[bar] + 7), 0.3, 12); mus[i:i + len(x)] += x[: n - i] * 0.35
    if b % 4 in (1, 3) or b % 8 == 6:
        x = pluck(hz(mel[b % 16]), 0.35, 14); mus[i:i + len(x)] += x[: n - i] * 0.22
    b += 1
mus = mus / (np.abs(mus).max() + 1e-9) * 0.14
# silencio musical en los golpes gordos (el chiste suena más)
for e, w in (("pop", 1.2), ("clonk", 0.8), ("bonk", 1.0), ("clonc", 1.2)):
    a = int(ev[e] * SR); mus[a: a + int(w * SR)] *= 0.15

mix = voice / (np.abs(voice).max() + 1e-9) * 0.85 + fx * duck * 0.9 + mus
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix[: int(ev["end"] * SR)]
out = ROOT / "public/tuerca/ep1"; out.mkdir(parents=True, exist_ok=True)
sf.write(out / "mix.wav", np.stack([mix, mix], 1).astype(np.float32), SR)

TL = {"fps": FPS, "total": total, "ev": {k: round(v * FPS, 1) for k, v in ev.items()},
      "lines": {k: [round(at[k] * FPS, 1), round((at[k] + dur[k]) * FPS, 1), LINES[k]] for k in LINES},
      "mouth": [round(float(m), 2) for m in mouth]}
(ROOT / "remotion/src/tuerca/ep1-timeline.json").write_text(json.dumps(TL, ensure_ascii=False), encoding="utf-8")
print(f"total {ev['end']:.1f}s · {total} fotogramas", {k: round(v, 1) for k, v in dur.items()})
