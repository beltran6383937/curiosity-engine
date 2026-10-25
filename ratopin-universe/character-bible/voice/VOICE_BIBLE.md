# Ratopín · Biblia de voz

## Qué voz es (Beltrán, 25-10-2026)
- Chico español joven (18–22), **graciosillo**, que **no parezca hecho por IA**. Natural, espontáneo, vacilón, irónico, expresivo, con buen ritmo.
- Suena a alguien que cuenta una anécdota graciosa a sus colegas. No a un locutor, ni a un narrador de TikTok, ni a un niño ni a un robot.
- Español de España, sin acento regional exagerado.
- Puede susurrar, gritar de forma cómica, reírse, acelerar, pausar, ironizar o quedarse callado, y siempre con el mismo timbre.

## Cómo se fija
- Motor: **VoxCPM2** (openbmb, Apache-2.0, local, 0 €). La voz se **diseña a partir de una descripción**, sin clonar a ninguna persona real.
- Las candidatas salen de `../../tools/voz_disenar.py` → `candidatas/candN.wav` (las descripciones están en `candidatas/descripciones.txt`).
- Beltrán elige una de oído. La toma elegida se copia a `ref.wav` + `ref.txt` y **todos los episodios la usan como referencia** (`reference_wav_path` + `prompt_wav_path`): el timbre no cambia de un día a otro.
- Parámetros estables en [voice-identity.json](voice-identity.json). Ahí no va ningún secreto.
- **Plan B**, el más humano: Beltrán o un colega graba las frases actuando y se transforman al timbre de Ratopín. Requiere el consentimiento por escrito de quien grabe.

## Interpretación
- Frases cortas. La pausa antes del remate dura lo que tenga que durar: el silencio forma parte del chiste.
- Ninguna frase en tono de venta. El cierre «Comenta X…» se dice con la misma voz de colega.
- Se pronuncia «Pérez y Quintano», nunca «Pérez ampersand Quintano».

## Sincronización de labios
- Bocas: hoja de 12 visemas (`../mouth-shapes/`).
- El español casi se pronuncia como se escribe, así que cada letra se traduce a su visema y se cuadra con los tiempos por palabra que da Whisper. No hace falta ninguna dependencia nueva.
- La boca solo se mueve cuando hay voz. En las pausas vuelve a la boca de reposo o a la de la expresión del momento.
