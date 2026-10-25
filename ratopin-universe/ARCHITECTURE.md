# Arquitectura · motor de animación de Ratopín

## Método elegido (Beltrán, 25-10-2026)
**Animación de recorte con dibujos de sustitución**, la técnica de Toon Boom Harmony o Moho en series de TV. No es dibujo a mano fotograma a fotograma, y así se dice siempre.

| Alternativa | Por qué no |
|---|---|
| Generar cada plano o fotograma con IA de imagen | La identidad cambia entre imágenes, que es justo el problema |
| IA de vídeo (Kling, Seedance…) | De pago por clip, el personaje cambia entre clips y no hay control de los labios |
| Animador humano | Mejor calidad, pero depende de una persona; se puede añadir más adelante para piezas clave |

## Flujo
```
hojas ChatGPT (Beltrán) ──► tools/recortar.py ──► piezas PNG con alfa + pivote ──► aprobación ──► biblioteca del rig (versionada)
guion ──► hoja de tiempos (JSON: poses clave + curvas) ──► se calcula a 12 dibujos/s ──► Remotion <Ratopin/> ──► MP4 1080×1920
voz (VoxCPM2 + ref.wav fija) ──► Whisper (tiempos por palabra) ──► visemas por letra ──► bocas en la hoja de tiempos
```

## Piezas
- `rig/ratopin.rig.json`: cada pieza con `id`, `file`, `version`, `pivot` (articulación), `parent`, `z`.
- Cadena: cuerpo → cuello → cabeza (sustitución H1–H5) → boca (M1–M12); hombro → brazo → antebrazo → mano (sustitución); cola por segmentos.
- Pupilas, párpados, cejas, rayas de vibración y pantallas: SVG generado por código con el mismo trazo. Son lo que más se mueve, así que se animan en cada dibujo sin pedir piezas nuevas.

## Movimiento
- Poses clave con curvas de espaciado (ease, exceso, asentamiento) → se calcula un valor por articulación en cada dibujo (12/s, «en doses» sobre 24 fps).
- Capas que nunca paran: respiración, cola, bigotes, orejas con retraso.
- Temblor de línea: filtro SVG `feTurbulence` + `feDisplacementMap` con una semilla nueva en cada dibujo, para que la línea vibre como el lápiz.
- Cámara a 24 fps: respiración de cámara en mano, empujes y paralaje entre fondo, personaje y primer término.

## Control de calidad (antes de que lo vea nadie)
1. Hash de cada pieza usada contra la biblioteca aprobada → la identidad no puede cambiar.
2. Ningún dibujo idéntico al anterior → el personaje nunca está quieto.
3. Distancias entre articulaciones constantes y contactos (mano-herramienta, pie-suelo) dentro de su tolerancia.
4. Tira de contacto + SENTINEL con criterios de animación (arcos, espaciado, identidad).
5. Audio: QA actual (LUFS, inteligibilidad) + desfase entre visemas y voz menor de 1 dibujo.

## Implementado en la prueba de 5 s (25-10-2026)
- Rig: `remotion/src/ratopin/rig-v1.ts` (pivotes y enganches medidos sobre rejilla; sustituye al `rig.json` previsto mientras haya un solo rig). Render recursivo en `rig.tsx`, ojos/cejas en `face.tsx`, pistas e IK de dos huesos en `anim.ts`.
- Poses dibujo a dibujo en `motion5s.ts` (sin React, testeable); la composición `RatopinMotion5s` (`MotionTest5s.tsx`) solo pinta.
- Contactos por cinemática inversa: la boca de la llave se fija a la abrazadera y el brazo lejano se resuelve hacia atrás; la mano cercana sigue arcos (Bézier) y, desde que coge el móvil, manda su giro absoluto.
- Cola en 4 segmentos (`tools/cola.py`) con onda que viaja de la base a la punta.
- Tests: `tests/ratopin-anim.test.mjs` y `tests/ratopin-motion5s.test.mjs` (llave pegada a la abrazadera, muñecas al alcance, espaciado ≤ 130 px/dibujo, pies fijos, piezas existentes).
- Render: `node ratopin-universe/tools/render5s.mjs` → MP4 + PNG sin cámara; `tools/verificar.py <frames> <tira> --fotogramas 120 --zona 60,1750,450,1880`.
- **Ojo:** renderizar con 1 pestaña. Con 2 y ~2,5 GB libres salieron 10 de 120 fotogramas sin capas; la zona fija de `verificar.py` lo detecta.

## Integración con el motor actual (fase 8, tras aprobar el piloto)
El orquestador, los workflows, los publicadores, CONNECT y SENTINEL se mantienen. Cambia el paso de render: el modelo deja de escribir `remotion/src/episodes/*.tsx` y pasa a escribir **guion + hoja de tiempos JSON** validada contra la biblioteca del rig.

## Coste
0 €: ChatGPT (cuenta de Beltrán) para las piezas, VoxCPM2 local o en CI, Remotion y GitHub Actions como ahora.
