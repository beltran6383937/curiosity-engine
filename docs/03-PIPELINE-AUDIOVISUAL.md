# 03 · Pipeline audiovisual

```text
episode.json ──► voice.py (VoxCPM2 «narrador», 1 toma) ──► align.py (Whisper: tiempos por palabra + puerta ≥ 90 %)
     │                                                        │
     ├──► music.py (pad original, −20 LUFS, semilla por día)  ▼
     └──► escena TSX (kit + space) ──────────────► render.mjs (Remotion, H.264 CRF 18 + AAC, 1080×1920, 30 fps)
                                                              ▼
                                       frames.mjs (hoja de fotogramas) + qa.mjs (técnico) + revisión visual
```

## Sistema visual

- **Identidad**: fondos espaciales profundos (grano y viñeta), iluminación de una sola fuente (el Sol) con atmósfera fresnel, tipografía Hanken Grotesk, oro `#ffc86b` para lo que gira y cian `#7fd6ff` para lo que orbita.
- **3D programático** (`remotion/src/space.tsx`): planetas con textura procedural determinista (fbm y bandas de nubes, sin descargas), atmósfera por shader, Sol con halos, flechas de giro con sentido real (pro/retrógrado) y arcos de progreso guiados por datos.
- **2D de datos**: diagramas SVG generados desde cifras verificadas. Nunca IA para números, ejes ni rótulos.
- **Transiciones**: cada escena entra al empezar su frase, con un leve zoom y desenfoque (sin cortes secos). Las escenas comparten paleta, luz y planeta para mantener la continuidad.
- **Subtítulos**: palabra a palabra, grupos de hasta 3 palabras, palabras clave en caja de color, zona 300–480 px (lejos de la interfaz de Instagram y TikTok).
- **Ritmo**: un cambio visual significativo cada 1–3 s ligado a palabras concretas (`w(frase, /palabra/)`).

## Audio

- Voz VoxCPM2 (Apache-2.0) clonada de la voz diseñada «narrador» (`assets/voice/`), a −14 LUFS y con pico ≤ −1,5 dBTP.
- Música original sintetizada (`pipeline/music.py`): re menor, pad + campanas + pulso a 72 bpm, mezclada a ~−28 LUFS bajo la voz. Derechos 100 % propios.
- Whoosh de transición entre escenas (SFX sintetizado propio).

## Reproducibilidad

Mismo `episode.json` + misma escena + mismo audio = mismo MP4: todo sale de `useCurrentFrame()` y de semillas fijas (`random(seed)`). La voz es la única pieza no determinista (TTS); por eso se guarda en `work/<id>/voice.wav` y no se regenera si existe.

## Comandos (piloto)

```bash
# voz (~20-35 min en CPU; nada más pesado a la vez)
<python-voxcpm> -I -X utf8 pipeline/voice.py episodes/venus-pilot/episode.json
uv run --no-project --with faster-whisper python -I -X utf8 pipeline/align.py episodes/venus-pilot/episode.json
python -I pipeline/music.py public/music/venus-pilot.wav 46 3
node pipeline/check-episode.mjs venus-pilot
node pipeline/frames.mjs venus-pilot          # hoja de fotogramas en work/frames/venus-pilot/
node pipeline/render.mjs venus-pilot          # work/venus-pilot/venus-pilot.mp4
node pipeline/qa.mjs episodes/venus-pilot/episode.json work/venus-pilot/venus-pilot.mp4
```
