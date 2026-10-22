# P&Q AI CONTENT ENGINE (repo `curiosity-engine`)

Productora autónoma del vídeo diario de PÉREZ & QUINTANO para Instagram y TikTok: IA aplicada y sistemas para **empresas de instalaciones** (electricistas, fontaneros, climatización y aerotermia, mantenimiento). Publica a las **08:30 de Madrid** desde el 23-10-2026; el vídeo se produce la víspera. Estrategia: [docs/11-ESTRATEGIA-EDITORIAL.md](docs/11-ESTRATEGIA-EDITORIAL.md) · qué se puede afirmar: [docs/12-VERDAD-PRODUCTO.md](docs/12-VERDAD-PRODUCTO.md).

Hasta el 22-10-2026 fue CURIOSITY ENGINE (curiosidades de espacio, coches, animales); esos episodios quedan como histórico. 14 agentes (subagentes de Claude Code + pipeline determinista), vídeo 100 % programático (Remotion + three.js), voz local VoxCPM2, música original y publicación por APIs oficiales.

**Estado real de cada pieza → [docs/10-ESTADO-REAL.md](docs/10-ESTADO-REAL.md).** No todo está en producción: lee ese archivo antes de dar nada por hecho.

## Piloto

`output/pilot/curiosity-engine-pilot.mp4`: Venus, un giro dura más que su año. Guion, storyboard, fuentes, publicación e informe de calidad están en la misma carpeta.

## Estructura

```text
.claude/agents/      14 agentes (ATLAS, NOVA, HAWKING, VERITAS, HOOK, VISION, PIXEL, MOTION, ECHO, CUT, SENTINEL, PUBLISHER, CONNECT, INSIGHT)
episodes/<id>/       ideas.md (5 ideas × 3 ganchos puntuadas) · episode.json (guion, ganchos, claims, publicación) · storyboard.md
remotion/src/        pq.tsx (kit P&Q: marca, interfaz, efectos, montaje) · pqworld.tsx (escenarios y personajes ilustrados)
                     kit.tsx + space.tsx (kit 3D de la etapa de curiosidades) · episodes/*.tsx (una escena por vídeo)
pipeline/            atlas.mjs (CLI) · orchestrator.mjs (estados) · steps.mjs · voice.py · align.py · music.py · render.mjs
                     frames.mjs · qa.mjs · check-episode.mjs · publishers.mjs · connect.mjs · insights.mjs · dashboard.mjs
config/engine.json   hora, plataformas, pilares editoriales, duración, umbral de calidad, presupuesto
data/                runs/<fecha>.json (estado), insights, candidatos, STOP
.github/workflows/   produce (víspera, desde 10:30) · publish (08:30) · stop (botón de parada)
docs/                01-12
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
