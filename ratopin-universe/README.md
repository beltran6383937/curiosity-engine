# Ratopín Universe

Serie animada 2D de Pérez & Quintano protagonizada por **Ratopín**, ratón instalador dibujado a lápiz. Desde el 25-10-2026 sustituye a los vídeos ilustrados del motor anterior. Hoy no se publica nada: el motor viejo está pausado hasta que se apruebe el nuevo.

| Fase | Estado |
|---|---|
| 1 · Auditoría | [AUDIT.md](AUDIT.md) |
| 2 · Biblia del personaje y de la voz | v1 visual aprobada · voz: Beltrán eligió el timbre de cand1 pero con acento de España → variantes en `character-bible/voice/candidatas/espana/` → [character-bible/](character-bible/CHARACTER_BIBLE.md) |
| 3 · Arquitectura | [ARCHITECTURE.md](ARCHITECTURE.md) (método aprobado) |
| 4 · Prueba de movimiento de 5 s | Renderizada (sin sonido) y verificada: 60 dibujos distintos, 0 capas perdidas, 12/12 tests → [tests/motion-5s/](tests/motion-5s/HOJA-DE-TIEMPOS.md) · **pendiente de que Beltrán la apruebe** |
| 5–9 | Sin empezar: no se avanza hasta aprobar la prueba de 5 s |

Carpetas: `character-bible/` (identidad, referencias, piezas aprobadas) · `world-bible/` (escenarios y objetos fijos) · `prompts/` (hojas de piezas para ChatGPT) · `tools/` (voz, recorte, cola, render, verificación) · `tests/` (pruebas de movimiento).
