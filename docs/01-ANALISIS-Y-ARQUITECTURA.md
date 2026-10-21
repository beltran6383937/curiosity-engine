# 01 · Análisis y arquitectura

Fecha: 20-10-2026 (Europe/Madrid). Autor: Claude Code (director técnico). Estado real de cada pieza: [10-ESTADO-REAL.md](10-ESTADO-REAL.md).

## Qué construimos

CURIOSITY ENGINE es una productora de vídeos verticales de curiosidades (espacio, coches, animales, tecnología) para las cuentas de **Pérez & Quintano** en Instagram y TikTok. Funciona como un pipeline de 13 agentes que comparten artefactos estructurados (`episode.json`, escenas TSX, informes de calidad). Cada vídeo es código reproducible: el mismo `episode.json` y la misma escena producen el mismo MP4.

## Decisiones del propietario (20-10-2026)

| Decisión | Valor | Consecuencia |
|---|---|---|
| Cuentas | Las de P&Q | El control de calidad es la única barrera antes de publicar en la marca. Umbral alto y bloqueos duros (§ Calidad). |
| Presupuesto | **0 € por ahora** | Sin OpenAI Images, sin ElevenLabs y sin APIs de pago. Todo es programático (3D/2D en Remotion), con voz local VoxCPM2 y música sintetizada original. |
| Servidor | Proponía usar un servidor existente | **No apto**: es un servidor de producción de un cliente, con poca RAM. La voz necesita ~5 GB, y un render diario degradaría ese servicio. Alternativa a 0 €: GitHub Actions (abajo). |

## Auditoría del entorno

- Windows 11, 16 hilos de CPU, **15,3 GB de RAM**, GPU AMD Radeon integrada (**sin CUDA**) y 645 GB libres.
- Node 24.19, Python 3.12, uv, FFmpeg 9.0.2, `gh` (sesión iniciada). Blender: **no instalado**.
- Ya existe el pipeline de `pq-rrss`: Remotion 4.0.536 con @remotion/three, la voz diseñada «narrador» con VoxCPM2 (Apache-2.0, ya aprobada; Curiosidades 01 se publicó el 20-10), alineado con faster-whisper y SFX sintetizados. **Se reutiliza; no se reinventa.**
- Claves: ninguna en el entorno (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY` y `ANTHROPIC_API_KEY` sin definir). Correcto con presupuesto 0 €.
- Límite real: la voz VoxCPM2 ocupa ~5 GB y tarda 20 min o más en CPU. No puede coincidir con un render (lección de pq-rrss: un OOM mató una voz).

## Selección de herramientas (por qué)

| Necesidad | Elegido | Descartado / después | Motivo |
|---|---|---|---|
| Composición y animación | **Remotion 4** (React, fotograma a fotograma) | Motion Canvas, edición manual | Ya instalado y probado. Determinista. Gratis hasta 3 personas. |
| 3D | **@remotion/three + three.js** (planetas procedurales, shaders) | Blender | Sin GPU dedicada ni Blender. three.js renderiza en el mismo pase. Blender queda para cuando haya presupuesto o GPU. |
| Gráficos científicos 2D | SVG/HTML generado desde datos | Imágenes IA | Regla: cifras, ejes y rótulos nunca con IA visual. |
| Imágenes IA | **Ninguna (0 €)**. Proveedor preparado: OpenAI Images (`gpt-image-1`) | Runway, Kling | Se activa con `OPENAI_API_KEY` y presupuesto. Coste estimado en [07-COSTES.md](07-COSTES.md). |
| Voz española | **VoxCPM2 «narrador»** (local) | ElevenLabs (de pago), Kokoro (más robótica) | Calidad aprobada por P&Q y 0 €. |
| Subtítulos | faster-whisper (alineado palabra a palabra) | | Comprueba además que lo que se oye coincide con el guion (puerta ≥ 90 %). |
| Música | **Síntesis original** (`pipeline/music.py`) | Canciones comerciales | Derechos 100 % propios y válidos en ambas redes. |
| Investigación y guion | **Claude Code en modo headless** con la suscripción (`CLAUDE_CODE_OAUTH_TOKEN`) | API de pago de OpenAI/Anthropic | 0 € adicionales. Tiene WebSearch/WebFetch para fuentes reales. |
| Programación diaria | **GitHub Actions** (cron con horario de verano/invierno resuelto en código) | Servidor de un cliente, PC local, n8n | 0 €, no depende del PC y deja registros y artefactos. |
| Instagram | **Instagram API con Instagram Login**: contenedor REELS, subida reanudable a `rupload.facebook.com` y luego `media_publish` | Metricool/Buffer (de pago) | Oficial. No necesita alojar el vídeo. Para la cuenta propia (con rol en la app) no hace falta App Review. |
| TikTok | **Content Posting API** | Bots o scraping (prohibido) | Sin auditoría, todo sale en **privado** (`unaudited_client_can_only_post_to_private_accounts`). La publicación pública exige auditoría de TikTok (semanas). |
| Comentarios y DM | Implementación propia sobre la API oficial: sondeo de comentarios y Private Replies | Manychat | El plan gratuito de Manychat bajó a ~25 contactos (marzo 2026). La API oficial es gratis, pero responder a público ajeno a la app exige acceso avanzado (App Review). |

## Arquitectura

```text
GitHub Actions (cron 03:00 y 04:00 UTC → el código decide la hora de Madrid)
  └─ ATLAS (orchestrator.mjs): máquina de estados en data/runs/<fecha>.json (idempotente, reanudable)
       1 RESEARCHING      NOVA + HAWKING   → 5 candidatos puntuados (Claude headless, WebSearch)
       2 FACT_CHECK       VERITAS          → claims[] con fuente y estado; bloquea si alguno falla
       3 SCRIPTING        HOOK             → 3 ganchos de viral-hooks, guion ≤ 45 s
       4 STORYBOARD       VISION           → escenas + escena TSX con el kit (Remotion)
       5 VOICE            ECHO             → VoxCPM2 + Whisper (puerta ≥ 90 %), música original
       6 RENDERING        MOTION/CUT       → remotion render (ANGLE/SwiftShader)
       7 QUALITY_CHECK    SENTINEL         → ffprobe, loudness, negros, congelados, fotogramas + revisión visual
       8 READY → PUBLISHING  PUBLISHER     → IG (rupload + media_publish) y TikTok, estado separado por red
       9 PUBLISHED        INSIGHT          → métricas a las 24 h y 72 h → data/insights.json → NOVA
     NEEDS_ATTENTION / FAILED → issue de GitHub (notificación al móvil) solo si importa
  STOP: fichero `data/STOP` o variable `CE_STOP=1` → no publica nada (parada de emergencia)
```

Persistencia: el propio repositorio (JSON versionado en `data/`). No hace falta base de datos externa con un vídeo al día. El historial editorial (temas, fuentes, guiones y métricas) queda auditable en git. Ceiling: si se pasa a varias cuentas o varios vídeos al día, migrar a SQLite/Postgres.

## Límites reales de automatización

1. **TikTok público**: imposible sin la auditoría de TikTok. Hasta entonces, privado (SELF_ONLY) o bandeja de borradores, que pide un toque en la app.
2. **Instagram**: autónomo para la cuenta propia tras una autorización OAuth inicial. El token de larga duración dura 60 días y se renueva solo si se usa.
3. **Comentarios y DM a público**: requieren App Review de Meta (`instagram_business_manage_comments` y `instagram_business_manage_messages`, acceso avanzado). El código queda listo y desactivado.
4. **Claude headless**: consume la cuota de la suscripción de Claude del equipo, compartida con su uso interactivo. Si se agota, ATLAS pasa al plan B: un episodio de la cola preparada.
5. **Minutos de GitHub Actions**: con repo privado hay 2.000 min/mes (2 vCPU / 7 GB). Una producción diaria con VoxCPM2 en CPU puede pasar de 60 min, lo que da unos 1.800 min/mes, muy al límite. Con repo **público**, los minutos son ilimitados (4 vCPU / 16 GB), pero el código queda visible. Los secretos siguen protegidos. **Decisión del propietario pendiente.**

## Calidad (resumen; detalle en 03 y 08)

Bloqueos duros: claim sin fuente o con estado distinto de `verified`, voz con menos del 90 % de coincidencia, MP4 que no es 1080×1920 / H.264 / AAC, fotogramas negros o congelados, una CTA sin recurso real, o la etiqueta de IA desactivada. Puntuación interna con umbral de 90. Si un vídeo no lo pasa, se repara (2 intentos). Si sigue fallando, se publica el siguiente de la cola preparada o no se publica nada, nunca uno malo.

## Plan de implementación (orden de prioridad del encargo)

1. Piloto Venus real (MP4 con voz, música, subtítulos, 3D/2D).
2. Motor reproducible: `episode.json` → voz → alineado → render → QA → entrega.
3. Orquestador con estados e idempotencia, más el workflow programado.
4. Publicadores IG y TikTok (OAuth oficial, simulación con mocks y prueba real tras autorizar).
5. Comentarios y DM (código y pruebas, activación tras App Review).
6. Analítica (métricas que la API da de verdad).
7. Panel (estático, generado desde `data/`).

## Criterios de aceptación

Los del encargo (§21). Cada uno queda marcado en [10-ESTADO-REAL.md](10-ESTADO-REAL.md) con un estado: implementado / probado con mocks / probado con API real / autorizado / en producción.
