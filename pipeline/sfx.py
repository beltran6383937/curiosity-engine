# Efectos de sonido propios (sintetizados, sin licencias de terceros) del kit P&Q: se generan una vez y se versionan.
# Uso: <python con numpy + soundfile> -I pipeline/sfx.py   → public/sfx/{ring,buzz,impact,notify,swell}.wav
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public/sfx"
rng = np.random.default_rng(7)
t = lambda d: np.arange(int(SR * d)) / SR
env = lambda n, a, r: np.minimum(1, np.minimum(np.arange(n) / max(1, a * SR), (n - np.arange(n)) / max(1, r * SR)))

def write(name, x, peak=0.7):
    x = x / (np.abs(x).max() + 1e-9) * peak
    sf.write(OUT / f"{name}.wav", x.astype(np.float32), SR)

# Tono de llamada de móvil: dos ráfagas de un trino suave (dos senos que alternan a 16 Hz)
x = t(1.6)
tr = np.where(np.sin(2 * np.pi * 16 * x) > 0, np.sin(2 * np.pi * 1320 * x), np.sin(2 * np.pi * 1760 * x))
gate = ((x % 0.8) < 0.45).astype(float)
write("ring", tr * gate * env(len(x), 0.01, 0.05) * 0.6, 0.45)
# Vibración: zumbido grave modulado
x = t(0.9)
write("buzz", np.sign(np.sin(2 * np.pi * 150 * x)) * 0.3 * (np.sin(2 * np.pi * 7 * x) > -0.2) * env(len(x), 0.01, 0.1), 0.4)
# Golpe: bombo grave con caída de tono + ruido filtrado
x = t(1.1)
f = 95 * np.exp(-x * 6) + 38
body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 4.5)
noise = np.convolve(rng.standard_normal(len(x)), np.ones(40) / 40, "same") * np.exp(-x * 14)
write("impact", body + 0.8 * noise, 0.85)
# Aviso: dos notas limpias (quinta) con cola corta
x = t(0.6)
n1 = np.sin(2 * np.pi * 988 * x) * np.exp(-x * 9) * (x < 0.3)
n2 = np.sin(2 * np.pi * 1480 * x) * np.exp(-(x - 0.12).clip(0) * 7) * (x >= 0.12)
write("notify", n1 + n2, 0.4)
# Subida: barrido de ruido que crece (antes de una revelación)
x = t(1.2)
sw = np.convolve(rng.standard_normal(len(x)), np.ones(12) / 12, "same") * (x / x[-1]) ** 2 * env(len(x), 0.05, 0.08)
write("swell", sw, 0.35)
print("ok", sorted(p.name for p in OUT.glob("*.wav")))
