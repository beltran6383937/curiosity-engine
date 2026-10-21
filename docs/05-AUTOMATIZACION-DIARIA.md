# 05 · Automatización diaria

| Hora Madrid | Qué | Dónde |
|---|---|---|
| 04:30 | `produce` en jobs aislados: `write` (investigar → verificar → guion → escena) → `build` (voz → render → calidad técnica) → `review` (revisión visual) → `save` (release + estado) → **READY** | GitHub Actions (`.github/workflows/produce.yml`) |
| 19:57–20:30 | `publish`: descarga el MP4 de la release del día, espera a `publish_time` (20:30, mejor franja en España: TikTok 20:00, Reels 21:00-23:00) en punto y publica en las redes activas. Cron cada hora a :57 UTC; `madrid-gate --publish-window` deja pasar solo la que cae en la hora configurada, así cambiar `publish_time` no exige tocar el workflow | `.github/workflows/publish.yml` |
| 24 h / 72 h | `insights`: métricas reales → `data/insights.json` → NOVA | (pendiente de añadir al cron cuando Instagram esté conectado) |

- **Zona horaria**: GitHub programa en UTC. Cada workflow tiene las dos horas UTC posibles (verano e invierno), y `pipeline/madrid-gate.mjs` deja pasar solo la que coincide con Madrid (Intl `Europe/Madrid`, cambia solo con el horario). Probado en `tests/orchestrator.test.mjs`.
- **Cola y adelanto**: si la producción termina antes, el vídeo espera en READY. Si termina después de `publish_time`, `publish` lo publica en la siguiente pasada horaria dentro de la ventana (hasta 3 h después de `publish_time`; cada pasada reintenta lo pendiente) o con un lanzamiento manual. Si una red agota sus 3 intentos, el run pasa a NEEDS_ATTENTION y llega una alerta. Ningún control se salta por puntualidad.
- **Idempotencia**: el estado vive en `data/runs/<fecha>.json` (escritura atómica). Un paso `done` no se repite, un fallo se reintenta desde ese paso y cada red guarda su contenedor antes de publicar, así que un corte nunca duplica.
- **Reintentos**: hasta 3 por paso o por red. Después, estado `NEEDS_ATTENTION` y alerta.
- **Parada de emergencia**: workflow `stop` (botón en GitHub Actions) o el fichero `data/STOP`. Detiene producción y publicación sin borrar nada.
- **Retraso de los cron de GitHub**: en horas punta GitHub puede retrasar un cron varios minutos. La hora real queda registrada en el run.
