# 02 · Agentes

Los 14 agentes son **subagentes nativos de Claude Code** definidos en `.claude/agents/<nombre>.md`: rol, herramientas autorizadas, modelo, entradas, salidas, criterios y límites. La sesión headless del run diario (ATLAS) los invoca con el mecanismo de delegación de Claude Code. Los pasos que no necesitan juicio (voz, render, control técnico, publicación) son código determinista en `pipeline/`. No se gasta un modelo en lo que un script hace mejor.

| Agente | Rol | Herramientas | Entrada → salida | Implementación |
|---|---|---|---|---|
| ATLAS | Director general | todas + Agent | fecha, `data/` → episodio listo, run | `.claude/agents/atlas.md` + `pipeline/orchestrator.mjs` (estados) + `pipeline/steps.mjs` |
| NOVA | CMO | Read, Write, WebSearch | insights, catálogo → ángulo, experimento, captions | `nova.md` |
| HAWKING | Investigación | WebSearch, WebFetch | categoría → 5 candidatos puntuados (`data/candidates/`) | `hawking.md` |
| VERITAS | Fact-checking independiente | WebFetch, WebSearch | claims → `verified/corrected/rejected` | `veritas.md` (modelo distinto del guionista y sin acceso de edición a la escena) |
| HOOK | Guion | Read, Write | hechos verificados → 3 ganchos de `assets/hooks/hooks.md` + guion | `hook.md` |
| VISION | Dirección creativa | Read, Write | guion → `storyboard.md` | `vision.md` |
| PIXEL | Imágenes OpenAI | Read, Write | storyboard → recursos | `pixel.md`, **desactivado** (0 €) |
| MOTION | Motion design | Read, Write, Edit (sin ejecutar nada) | storyboard → `remotion/src/episodes/*.tsx` | `motion.md` + `remotion/src/kit.tsx` + `space.tsx` |
| ECHO | Audio | script (job build) | guion → voz, alineado, música | `pipeline/voice.py`, `align.py`, `music.py` |
| CUT | Edición y render | script (job build) | escena + audio → MP4 | `pipeline/render.mjs` |
| SENTINEL | Calidad (veto) | Read + su informe | MP4 + fotogramas → `quality.json` | `pipeline/qa.mjs` (técnico) + revisión visual con Claude |
| PUBLISHER | Distribución | script (job publish) | MP4 READY → enlaces reales | `pipeline/publishers.mjs` |
| CONNECT | Comentarios/DM | script (sin modelo) | comentarios con palabra clave → DM con la info de P&Q + respuesta pública | `pipeline/connect.mjs` + `connect.yml` (cada 15 min), `connect.mode: off` hasta App Review |
| INSIGHT | Analítica | script | métricas API → `data/insights.json` | `pipeline/insights.mjs` |

## Coordinación

- **Secuencia controlada** donde hay dependencia: investigación → verificación → guion → verificación del guion → storyboard → escena → voz → render → calidad → publicación.
- **Paralelo** donde no la hay: HAWKING busca candidatos mientras NOVA lee los insights. La música se genera junto a la voz.
- **Un solo escritor por artefacto**: `episode.json` lo escribe HOOK (NOVA solo toca `publication`), la escena solo MOTION y `quality.json` solo SENTINEL. ATLAS registra cada paso en `data/runs/<fecha>.json`.
- **Nadie aprueba su propio trabajo**: VERITAS revisa a HAWKING y a HOOK, y SENTINEL revisa a MOTION, ECHO y CUT.
- **Un trabajo pesado cada vez**: la voz nunca coincide con un render (límite de RAM).
