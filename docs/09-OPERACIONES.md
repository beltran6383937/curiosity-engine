# 09 · Operaciones

- **Ver qué ha pasado**: `data/runs/<fecha>.json` (estado, pasos, enlaces, errores) o el panel (`node pipeline/dashboard.mjs` → `dashboard/index.html`). El vídeo de cada día está en GitHub → Releases → `ep-<fecha>`.
- **Detener publicaciones**: GitHub → Actions → `stop` → Run workflow (`stop`). Reanudar: lo mismo con `resume`.
- **Relanzar un día**: Actions → `produce` → Run workflow (fecha opcional). Retoma desde el último paso no terminado.
- **Publicar a mano lo que está READY**: Actions → `publish` → Run workflow.
- **Un run en NEEDS_ATTENTION**: lee el error en el run, corrige y borra el bloque `steps.<PASO>` del JSON (o pon `"state": "FAILED"`) y relanza `produce`.
- **Cambiar la hora, la mezcla de temas, la duración o las plataformas**: `config/engine.json` (commit y push).
- **Reiniciar con seguridad**: no hay procesos persistentes. Cada workflow es un contenedor nuevo que lee el estado del repo. Cancelar un job a medias es seguro: el siguiente retoma.
- **Local (Windows)**: `npm run studio` para previsualizar. Voz con el Python de `pq-rrss/.venv-voxcpm` (`CE_PYTHON`). Nunca a la vez que un render (15 GB de RAM).
