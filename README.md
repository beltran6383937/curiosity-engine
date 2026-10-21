# CURIOSITY ENGINE

Productora autónoma de vídeos verticales de curiosidades (espacio, coches, animales, tecnología) para las cuentas de Pérez & Quintano. 14 agentes (subagentes de Claude Code + pipeline determinista), vídeo 100 % programático (Remotion + three.js), voz local VoxCPM2, música original y publicación por APIs oficiales.

**Estado real de cada pieza → [docs/10-ESTADO-REAL.md](docs/10-ESTADO-REAL.md).** No todo está en producción: lee ese archivo antes de dar nada por hecho.

## Piloto

`output/pilot/curiosity-engine-pilot.mp4`: Venus, un giro dura más que su año. Guion, storyboard, fuentes, publicación e informe de calidad están en la misma carpeta.

## Estructura

```text
.claude/agents/      14 agentes (ATLAS, NOVA, HAWKING, VERITAS, HOOK, VISION, PIXEL, MOTION, ECHO, CUT, SENTINEL, PUBLISHER, CONNECT, INSIGHT)
episodes/<id>/       episode.json: guion, ganchos, claims con fuente, publicación
remotion/src/        kit.tsx (montaje, subtítulos, 3D base) · space.tsx (planetas, Sol, órbitas) · episodes/*.tsx (una escena por vídeo)
pipeline/            atlas.mjs (CLI) · orchestrator.mjs (estados) · steps.mjs · voice.py · align.py · music.py · render.mjs
                     frames.mjs · qa.mjs · check-episode.mjs · publishers.mjs · connect.mjs · insights.mjs · dashboard.mjs
config/engine.json   hora, plataformas, mezcla de temas, duración, umbral de calidad, presupuesto
data/                runs/<fecha>.json (estado), insights, candidatos, STOP
.github/workflows/   produce (04:30) · publish (20:30) · stop (botón de parada)
docs/                01-10
tests/               node --test (orquestador, publicadores, calidad, comentarios, analítica)
```

## Uso rápido

```bash
npm install
npm test                                   # pruebas automáticas
npm run studio                             # previsualizar escenas
node pipeline/render.mjs venus-pilot       # render
node pipeline/qa.mjs episodes/venus-pilot/episode.json work/venus-pilot/venus-pilot.mp4
node pipeline/atlas.mjs --dry-run          # run completo sin tocar las redes
```

Despliegue y autorizaciones: [docs/04-INTEGRACIONES.md](docs/04-INTEGRACIONES.md) y [docs/09-OPERACIONES.md](docs/09-OPERACIONES.md).
