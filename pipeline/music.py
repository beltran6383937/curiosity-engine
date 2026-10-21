# ECHO · música original sintetizada (sin derechos de terceros): pad ambiental + campanas suaves + pulso grave.
# Determinista por semilla; se normaliza a -20 LUFS y Remotion la baja debajo de la voz.
# Uso: <python con numpy+soundfile> -I pipeline/music.py <salida.wav> <segundos> [semilla]
import subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 44100
out, dur = Path(sys.argv[1]), float(sys.argv[2])
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
rng = np.random.default_rng(seed)
n = int(dur * SR); t = np.arange(n) / SR
midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)
# Progresión en re menor: Dm9 · Bbmaj7 · Fmaj7/A · C6 (4 s por acorde)
chords = [[50, 57, 62, 64, 65], [46, 53, 57, 62, 65], [45, 53, 57, 60, 64], [48, 55, 60, 64, 69]]
seg = 4.0
L = np.zeros(n); R = np.zeros(n)
for ci in range(int(np.ceil(dur / seg)) + 1):
    a = int(ci * seg * SR); b = min(n, int((ci * seg + seg + 1.5) * SR))
    if a >= n: break
    tt = t[a:b] - t[a]
    env = np.minimum(1, tt / 1.6) * np.minimum(1, np.maximum(0, (seg + 1.5 - tt) / 1.5))
    for j, m in enumerate(chords[ci % 4]):
        f = midi(m); det = 1 + (rng.random() - 0.5) * 0.004
        v = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2 * det * tt) + 0.12 * np.sin(2 * np.pi * f * 3 * tt)) * env * 0.12
        pan = 0.5 + (j - 2) * 0.15
        L[a:b] += v * (1 - pan); R[a:b] += v * pan
# Campanas: notas de la escala, una cada ~1,5 s, con eco
scale = [62, 64, 65, 69, 72, 74, 76]
for s in np.arange(1.0, dur - 1, 1.5):
    a = int(s * SR); f = midi(rng.choice(scale) + 12); tt = t[: min(n - a, int(3 * SR))]
    v = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) * 0.05
    for d, g in [(0, 1), (0.37, 0.45), (0.74, 0.2)]:
        o = a + int(d * SR); k = min(len(v), n - o)
        if k > 0: (L if d != 0.37 else R)[o:o + k] += v[:k] * g
# Pulso grave muy suave (corazón del vídeo), negras a 72 bpm
for s in np.arange(0, dur, 60 / 72):
    a = int(s * SR); tt = t[: min(n - a, int(0.6 * SR))]
    v = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 7) * 0.08
    L[a:a + len(v)] += v; R[a:a + len(v)] += v
x = np.stack([L, R], 1)
fade = np.minimum(1, np.minimum(t / 1.5, (dur - t) / 2.0))[:, None]
x = x * fade / (np.max(np.abs(x)) + 1e-9) * 0.8
tmp = out.with_suffix(".raw.wav"); out.parent.mkdir(parents=True, exist_ok=True)
sf.write(tmp, x.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-af", "loudnorm=I=-20:TP=-2:LRA=11", "-ar", "44100", str(out)], check=True)
tmp.unlink(); print(f"ok música {out} ({dur:.1f} s, semilla {seed})")
