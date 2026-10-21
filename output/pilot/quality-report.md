# Informe de calidad: piloto Venus

**Veredicto de SENTINEL: APROBADO, 100/100** (umbral 90). Sin bloqueos ni avisos.
Fecha: 20-10-2026. Archivo: `output/pilot/curiosity-engine-pilot.mp4`. **No publicado:** queda pendiente de tu revisión.

## Técnico (medido con ffprobe y ffmpeg sobre el MP4 final)

| Comprobación | Resultado | Requisito |
|---|---|---|
| Formato | 1080×1920 (9:16) | 1080×1920 |
| Códecs | H.264 yuv420p BT.709 + AAC 48 kHz estéreo, faststart | H.264/AAC, yuv420p |
| Duración | 42,4 s | 25-45 s |
| Tamaño | 7,8 MB | < 64 MB (límite de subida en un solo bloque de TikTok) |
| Fotogramas | 30 fps | 30 o 60 |
| Sonoridad | −14,9 LUFS integrados, pico −3,4 dBFS, LRA 1,8 LU | −20 a −10 LUFS, sin saturar |
| Negros | ninguno a mitad de vídeo | ninguno |
| Congelados | ninguno > 3 s | ≤ 3 s |
| Silencios | ninguno largo | ninguno |

## Voz
- VoxCPM2 local con la voz «narrador» (la de la serie Curiosidades). Gratis, sin enviar audio fuera.
- Alineado con Whisper: **137 de 138 palabras coinciden (99,3 %)** (puerta de calidad: 90 %).
- Música: sintetizada por el propio motor (sin derechos de terceros), normalizada a −20 LUFS y mezclada por debajo de la voz.

## Contenido
- 7 afirmaciones, todas verificadas con fuentes de la NASA (ver `sources.md`).
- 3 ganchos de la plantilla viral (#69, #20 y #35). Elegido: #69.
- Etiqueta de IA en ambas captions («Voz generada con IA.») y `is_aigc` en TikTok.
- Sin CTA: no hay un recurso real que regalar, así que no se promete ninguno.

## Revisión visual (hoja de contacto, un fotograma cada 2 s)
Primera pasada, 9 defectos corregidos: anillo naranja duro en la atmósfera, Venus con aspecto de Júpiter (ahora tonos crema según las imágenes reales), órbita del gancho vista de canto, etiqueta encima del planeta, Sol fuera de plano, Tierra y Venus cortadas, cierre en negro, etiquetas solapadas y rocas burdas.
Segunda pasada, 4 defectos corregidos: flecha de giro vista de perfil, rocas amontonadas en los bordes, núcleo gris del Sol y subtítulo del 117 partido en dos líneas.
QA técnico detectó además rango de color yuvj420p (incompatible en algunos reproductores). Se añadió una pasada final a yuv420p BT.709 en `render.mjs`.

## Límites conocidos (no bloquean)
- En el gancho la órbita se ve casi como un arco plano: se entiende, pero no es espectacular.
- El diagrama del «por qué» es 2D y más sobrio que el resto.
- Venus está dibujado con texturas procedurales, no con fotos reales de la NASA. Es una decisión para no depender de licencias.
