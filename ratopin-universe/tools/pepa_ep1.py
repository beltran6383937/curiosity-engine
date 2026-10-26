# Pepa · episodio 1, «Esto es todo lo que he supervisado hoy»: línea de tiempo con las duraciones REALES de la voz, boca
# (envolvente por fotograma) y mezcla voz + efectos + música propios (sintetizados aquí, 0 € y sin derechos de terceros).
# Salidas: remotion/src/pepa/ep1-timeline.json · public/pepa/ep1/mix.wav
# Uso (desde curiosity-engine): ../pq-rrss/.venv-voxcpm/Scripts/python -I -X utf8 ratopin-universe/tools/pepa_ep1.py
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
VOZ = ROOT / "work/pepa/voz"
SR, FPS = 44100, 24
rng = np.random.default_rng(5)

def load(name):
    x, sr = sf.read(VOZ / f"{name}.wav", dtype="float32")
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr).astype(np.float32)
    nz = np.flatnonzero(np.abs(x) > 0.01 * np.abs(x).max())
    return x[max(0, nz[0] - 800): nz[-1] + 2200]

LINES = json.loads((VOZ / "lines.json").read_text(encoding="utf-8"))
V = {k: load(k) for k in LINES}
dur = {k: len(v) / SR for k, v in V.items()}

ev, at = {}, {}
def say(name, t): at[name] = t; return t + dur[name]
t = say("L01", 0.25)
t = say("L02", t + 0.2)
t = say("L03", t + 0.5)
ev["arrive"] = t + 0.15; ev["box"] = ev["arrive"] + 0.6; ev["bocata"] = ev["arrive"] + 1.0
t = say("L04", ev["arrive"] + 1.6)
ev["turn1"] = t + 0.1; ev["peck"] = ev["turn1"] + 0.7
t = say("L05", ev["peck"] + 0.9)
ev["fan"] = t + 0.5; ev["blow"] = ev["fan"] + 0.8; ev["back"] = ev["blow"] + 1.4
t = say("L06", ev["back"] + 1.5)
ev["see"] = t + 0.4
t = say("L07", ev["see"] + 0.6)
ev["eat"] = t + 0.3; ev["gulp"] = ev["eat"] + 1.0; ev["hip"] = ev["gulp"] + 0.6
t = say("L08", ev["hip"] + 0.6)
t = say("L09", t + 0.5)
ev["turn2"] = t + 0.2; ev["plof"] = ev["turn2"] + 1.0
t = say("L10", ev["plof"] + 1.3)
ev["end"] = t + 1.3
total = int(np.ceil(ev["end"] * FPS))

mouth = np.zeros(total)
for k, x in V.items():
    hop = SR // FPS
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
    rms = np.convolve(rms, [0.25, 0.5, 0.25], "same") / (np.percentile(rms, 95) + 1e-9)
    s = int(round(at[k] * FPS)); seg = np.clip((rms - 0.12) * 1.25, 0, 1)
    mouth[s:s + len(seg)] = np.maximum(mouth[s:s + len(seg)], seg[: max(0, total - s)])

tt = lambda d: np.arange(int(SR * d)) / SR
def norm(x, peak): return (x / (np.abs(x).max() + 1e-9) * peak).astype(np.float32)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
def sweep(f0, f1, d, dec): return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, int(SR * d))) / SR) * np.exp(-tt(d) * dec)
def noise(d, n, dec): return lp(rng.standard_normal(int(SR * d)), n) * np.exp(-tt(d) * dec)
SFX = {
    "step": norm(noise(0.12, 25, 40), 0.15),
    "thump": norm(sweep(140, 50, 0.35, 12) + noise(0.35, 12, 25) * 0.6, 0.7),
    "plaf": norm(noise(0.25, 6, 20) + sweep(300, 120, 0.25, 18) * 0.5, 0.45),
    "toc": norm(sweep(1800, 1400, 0.09, 45) + noise(0.09, 2, 60) * 0.4, 0.55),
    "tick": norm(noise(0.18, 2, 8) * (np.sin(2 * np.pi * 30 * tt(0.18)) > 0), 0.2),
    "whirr": norm(np.sin(2 * np.pi * np.cumsum(np.linspace(30, 95, int(SR * 0.8))) / SR) * 0.6 + noise(0.8, 4, 0) * np.linspace(0.2, 1, int(SR * 0.8)), 0.4),
    "whoosh": norm(noise(1.4, 3, 0) * np.sin(np.pi * tt(1.4) / 1.4) ** 2, 0.55),
    "coo": norm(np.sin(2 * np.pi * np.cumsum(420 - 80 * tt(0.6) / 0.6) / SR) * (0.55 + 0.45 * np.sin(2 * np.pi * 26 * tt(0.6))) * np.sin(np.pi * tt(0.6) / 0.6), 0.3),
    "nam": norm(noise(0.16, 2, 25) * (1 + np.sign(np.sin(2 * np.pi * 45 * tt(0.16)))), 0.35),
    "gulp": norm(sweep(520, 140, 0.35, 6), 0.45),
    "hip": norm(sweep(380, 900, 0.18, 10), 0.4),
    "plof": norm(noise(0.4, 5, 14) + sweep(220, 70, 0.4, 9) * 0.8, 0.8),
}
CUES = [("coo", 0.0), *[("step", ev["arrive"] + i * 0.18) for i in range(3)], ("thump", ev["box"]), ("plaf", ev["bocata"]),
        *[("step", ev["turn1"] + i * 0.2) for i in range(3)], *[("toc", ev["peck"] + i * 0.22) for i in range(3)],
        ("whirr", ev["fan"]), ("whoosh", ev["blow"] - 0.1), *[("step", ev["back"] + i * 0.2) for i in range(5)],
        ("coo", ev["see"]), *[("nam", ev["eat"] + i * 0.3) for i in range(3)], ("gulp", ev["gulp"]), ("hip", ev["hip"]),
        ("coo", ev["turn2"] + 0.2), ("plof", ev["plof"])]
L5 = at["L05"], dur["L05"]
CUES += [("tick", L5[0] + L5[1] * k) for k in (0.3, 0.6, 0.97)]

n = int(ev["end"] * SR) + SR
voice = np.zeros(n, np.float32); fx = np.zeros(n, np.float32)
for k, x in V.items():
    s = int(at[k] * SR); voice[s:s + len(x)] += x
for name, s in CUES:
    x = SFX[name]; i = int(s * SR); fx[i:i + len(x)] += x[: n - i]
# zumbido del ventilador mientras gira
fan = np.zeros(n, np.float32); a, b = int((ev["fan"] + 0.8) * SR), int(ev["back"] * SR)
hum = norm(np.sin(2 * np.pi * 95 * tt((b - a) / SR)) * 0.5 + noise((b - a) / SR, 4, 0), 0.25); fan[a:a + len(hum)] = hum

def pluck(f, d, dec=7.0):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x)) * np.exp(-x * dec)
beat = 60 / 104
mus = np.zeros(n, np.float32)
roots = [41, 46, 48, 41]                                         # F · Bb · C · F (original)
mel = [77, 81, 84, 81, 82, 79, 77, 74, 77, 81, 84, 89, 88, 84, 79, 77]
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
bt = 0
while bt * beat < ev["end"]:
    i = int(bt * beat * SR); bar = (bt // 4) % 4
    x = pluck(hz(roots[bar] + (0 if bt % 2 == 0 else 7)), 0.4, 10); mus[i:i + len(x)] += x[: n - i] * (0.55 if bt % 2 == 0 else 0.32)
    if bt % 4 in (1, 3) or bt % 8 == 6:
        x = pluck(hz(mel[bt % 16]), 0.35, 14); mus[i:i + len(x)] += x[: n - i] * 0.22
    bt += 1
mus = mus / (np.abs(mus).max() + 1e-9) * 0.13
for e, w in (("blow", 1.4), ("gulp", 1.0), ("plof", 1.3)):
    a = int(ev[e] * SR); mus[a: a + int(w * SR)] *= 0.15

mix = voice / (np.abs(voice).max() + 1e-9) * 0.85 + fx * 0.9 + fan + mus
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix[: int(ev["end"] * SR)]
out = ROOT / "public/pepa/ep1"; out.mkdir(parents=True, exist_ok=True)
sf.write(out / "mix.wav", np.stack([mix, mix], 1).astype(np.float32), SR)
TL = {"fps": FPS, "total": total, "ev": {k: round(v * FPS, 1) for k, v in ev.items()},
      "lines": {k: [round(at[k] * FPS, 1), round((at[k] + dur[k]) * FPS, 1), LINES[k]] for k in LINES},
      "mouth": [round(float(m), 2) for m in mouth]}
(ROOT / "remotion/src/pepa/ep1-timeline.json").write_text(json.dumps(TL, ensure_ascii=False), encoding="utf-8")
print(f"total {ev['end']:.1f}s · {total} fotogramas", {k: round(v, 1) for k, v in dur.items()})
