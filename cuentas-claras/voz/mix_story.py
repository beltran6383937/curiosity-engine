"""Cartoon foley (synth, 0 EUR) timed to cue.json + voice -> ../out/audio.wav and remotion/public/audio.wav"""
import json, os, shutil, numpy as np, soundfile as sf
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 44100
C = json.load(open(f"{R}/voz/cue.json")); voz, _ = sf.read(f"{R}/voz/voz_edit.wav"); rng = np.random.default_rng(11)
out = np.zeros(len(voz) + SR)
def put(t, x, g=1.0):
    a = int(max(t, 0) * SR); out[a:a + len(x)] += x[:len(out) - a] * g
env = lambda n, d: np.exp(-np.arange(n) / (d * SR))
def tone(f, d, shape=0.0):
    n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, d / 3)
def pop(): n = int(0.14 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (500 + 900 * np.exp(-t * 40)) * t) * env(n, 0.03)
def boing(): n = int(0.5 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (260 + 140 * np.sin(t * 40) * np.exp(-t * 5)) * t) * env(n, 0.18)
def whoosh(d=0.4): n = int(d * SR); x = np.convolve(rng.standard_normal(n), np.ones(50) / 50, "same"); return x * np.hanning(n)
def thud(f=70): n = int(0.5 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, 0.12) + 0.5 * rng.standard_normal(n) * env(n, 0.02)
def ding(): return tone(1320, 0.5) * 0.6 + tone(1980, 0.5) * 0.3
def flutter(d=1.4): n = int(d * SR); t = np.arange(n) / SR; return rng.standard_normal(n) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.hanning(n) * 0.5
def ringtone(): return (tone(880, 0.12) + tone(660, 0.12))
# phone ringing in scene A (two bursts per second) until "siguiente"
t = 0.2
while t < C["siguiente"] + 0.3:
    for k in range(3): put(t + k * 0.15, ringtone(), 0.10)
    t += 1.0
put(C["coin"] - 0.25, pop(), 0.5); put(C["coin"] - 0.1, flutter(1.5), 0.30)
put(C["siguiente"] - 0.95, whoosh(0.5), 0.2)                         # iris to scene B
put(C["siguiente"] + 0.9, boing(), 0.25); put(C["siguiente"] + 0.9 + 0.7, pop(), 0.3)
put(C["ledger"] - 0.12, whoosh(0.5), 0.2)
for k in ("r2v", "r3", "r4"): put(C[k], pop(), 0.5)
put(C["ledger"] + 0.55, pop(), 0.5)
for i in range(18): put(C["total"] + 0.12 + 1.3 * (i / 18) ** 0.7, tone(2400, 0.03), 0.10)
put(C["total"], boing(), 0.45); put(C["ejemplo"], thud(110), 0.5)
put(C["verdict"] - 0.12, whoosh(0.3), 0.2); put(C["verdict"] + 0.05, thud(60), 0.8)
put(C["auto"], ding(), 0.5); put(C["auto"] + 1.0, pop(), 0.4)
put(C["cta"] - 0.1, whoosh(0.3), 0.2); put(C["cta"] + 0.1, boing(), 0.35)
out[:len(voz)] += voz; out /= max(1.0, np.abs(out).max() / 0.95)
sf.write(f"{R}/out/audio.wav", out, SR); shutil.copy(f"{R}/out/audio.wav", f"{R}/remotion/public/audio.wav"); print("ok", len(out) / SR)
