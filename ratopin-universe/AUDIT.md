# Auditoría del motor actual (25-10-2026)

## Qué hace hoy
- **Cadena:** `pipeline/orchestrator.mjs` con 14 agentes (`.claude/agents/`): investiga → guion → voz → render → QA técnico → revisión visual (SENTINEL) → publica. Estado por día en `data/runs/<fecha>.json`. Si un paso falla 3 veces → `NEEDS_ATTENTION` + issue `alerta`.
- **Programación:** GitHub Actions. `produce.yml` (la víspera, crons de 08:30 a 17:30 UTC, `madrid-gate --next`) y `publish.yml` (08:30 Madrid, cron 57 5-9 UTC). También `connect.yml` (DM por palabra clave, cada 15 min) y `stop.yml` (parada de emergencia). Jobs aislados y acciones fijadas por SHA.
- **Imagen y vídeo:** Remotion 4.0.536 + three. Kit `remotion/src/pq.tsx` y `pqworld.tsx` (SVG + interfaz HTML). Cada episodio es un `remotion/src/episodes/E<fecha>.tsx` **escrito por el modelo**.
- **Voz:** VoxCPM2 (Apache-2.0) con la voz diseñada «narrador» (`assets/voice/narrador.wav`); alineado con Whisper (`pipeline/align.py`); música y SFX (`music.py`, `sfx.py`).
- **Publicación:** Instagram por la API oficial (en producción desde el 21-10, vídeo vía URL de la release); TikTok a la bandeja (SELF_ONLY: hay que terminar a mano; público exige la auditoría de TikTok).
- **CTA:** `connect.mjs` responde por DM a quien comente la palabra clave; `mode: test` hasta que Meta apruebe el acceso avanzado.
- **Tests:** `npm test` (node --test), 8 ficheros.
- **Coste real:** 0 €. Repo público (minutos de Actions ilimitados) + Claude con token de suscripción + modelos locales.

## Causa de la inconsistencia visual
1. **El modelo dibuja personajes y escenarios desde cero en cada episodio** (los escenarios nuevos los dibuja en la propia escena, según la regla del kit). No hay ningún dibujo aprobado que se reutilice, así que el personaje cambia cada día.
2. El movimiento son interpolaciones de SVG simples, sin poses clave, arcos ni sustitución de dibujos. Por eso se ve rígido.
3. SENTINEL detecta los fallos de composición, pero no hay corrección automática: 25-10 rechazado 3 veces (80/80/78) y sin vídeo.

## Qué se reutiliza
Orquestador y estado por día · workflows y gate horario · alertas · publicadores IG/TikTok · CONNECT (encaja con «Comenta X») · VoxCPM2 + alineado Whisper · SFX · Remotion como renderizador · SENTINEL como revisor (con un criterio nuevo) · tests.

## Qué se retira
Kit `pq.tsx`/`pqworld.tsx` y episodios escritos por el modelo (se quedan como histórico, sin borrar). Voz «narrador».

## Limitaciones
- Equipo local sin GPU (VoxCPM2 por CPU, lento) y 16 GB de RAM con ~2 GB libres: **voz y render nunca a la vez**.
- No existe ninguna pieza dibujada por separado: hay que sacarlas de ChatGPT (Beltrán) y aprobarlas.
- TikTok público necesita la auditoría y CONNECT en vivo necesita la aprobación de Meta.
- El token de IG caduca hacia el 20-12-2026 y no hay renovación automática (falta GH_ADMIN_TOKEN).
- El repo es público: los dibujos de Ratopín se pueden descargar (decisión de Beltrán, 25-10).

## Acción tomada
`produce` y `publish` desactivados el 25-10 (`gh workflow disable`) hasta que se apruebe el motor nuevo. Se reactivan con `gh workflow enable`.
