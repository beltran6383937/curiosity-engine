# 06 · Ciberseguridad

El repositorio es **público**. Todo lo que hay en él (código, `data/`, `episodes/`, escenas, releases y artefactos de Actions) lo puede ver cualquiera. Lo privado vive solo en GitHub Actions Secrets o en el `.env` local.

## Secretos
- En GitHub Actions Secrets: `CLAUDE_CODE_OAUTH_TOKEN`, `HOOKS_MD` (banco de ganchos de pago), `IG_ACCESS_TOKEN`, `IG_USER_ID`, `TIKTOK_ACCESS_TOKEN`, `TIKTOK_REFRESH_TOKEN`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `GH_ADMIN_TOKEN` (renovar secretos) y, si se activa CONNECT, `CONNECT_HMAC_KEY`.
- Nunca en el repo, en capturas, en el chat ni en un frontend. `.env` y `.env.*` están en `.gitignore`; `.env.example` no lleva valores.
- `tokens.mjs` marca los tokens renovados con `::add-mask::` antes de usarlos y los pasa a `gh secret set` por stdin.

## Aislamiento del modelo (`produce.yml`)
El modelo lee páginas web no confiables (inyección de instrucciones) y escribe una escena TSX que webpack compila. Por eso la producción va en jobs separados y nunca coinciden código del modelo y credenciales:

| Job | Qué hace | Secretos | GITHUB_TOKEN |
|---|---|---|---|
| `gate` | hora de Madrid y STOP | ninguno | `contents: read` |
| `write` | Claude investiga y escribe guion y escena | token de Claude, `HOOKS_MD` | `contents: read`, no se guarda en `.git` |
| `build` | voz, **compilación** y render | **ninguno** | `contents: read` |
| `review` | Claude mira los fotogramas | token de Claude | `contents: read` |
| `save` | release y commit en main | ninguno propio | `contents: write`, `issues: write` |

- **Claude sin ejecución**: `--tools` solo ofrece Read, Glob, Grep, WebSearch, WebFetch, Write, Edit y Agent; `--disallowedTools` bloquea Bash, leer `.env`, `.git`, `/proc` y `~/.claude`, y escribir en `pipeline/`, `.github/` y `.claude/`; `--strict-mcp-config` sin servidores MCP. Los subagentes de `.claude/agents/` tampoco tienen Bash. Escribe solo en las rutas de su fase (en `review`, únicamente `work/<id>/visual-review.json`).
- **Escena revisada antes de compilar** (`check-episode.mjs`, `sceneSafety`): en `remotion/src/episodes/` solo archivos `.tsx`; imports solo de `react`, `remotion`, `three`, `@remotion/*`, `@react-three/fiber|drei` y rutas relativas, sin `!` (loaders de webpack); rechaza `require`, `import()`, `eval`, `new Function`, `process` y red.
- **Paso de testigo controlado** (`collect.mjs`): cada job descarga el artefacto del anterior en una carpeta aparte y copia solo las rutas esperadas del día (nombre válido, archivo normal, tamaño máximo). Nunca entra `.claude/`, `pipeline/` ni un enlace simbólico, y la escena vuelve a pasar `sceneSafety`.
- **Riesgo residual aceptado**: el código de la escena se ejecuta en el Chromium del render dentro de `build`, que no tiene secretos. En el peor caso podría alterar el vídeo o el estado del día, nunca robar una credencial. Lo frena el QA técnico, la revisión visual y la parada de emergencia.

## Registros sin secretos
`redact()` (`publishers.mjs`) tapa `access_token`, `refresh_token`, `client_secret`, `code_verifier` y `upload_url` en query, formulario o JSON, las cabeceras Bearer/OAuth, las URL de subida y, por valor, cualquier variable de entorno cuyo nombre contenga TOKEN, SECRET, KEY o PASSWORD. Se aplica a los errores que se guardan en `data/` y a las alertas que acaban en issues. La `upload_url` de TikTok, que funciona como credencial, solo vive en memoria (`tests/security.test.mjs`).

## Datos personales
- `data/connect.json` (CONNECT, desactivado) guarda los ids de comentarios y usuarios como HMAC-SHA256 con `CONNECT_HMAC_KEY`. Sin la clave no se pueden revertir probando ids.
- Sin nombres, correos ni rutas personales en el código, la documentación o el historial. Los commits de los bots usan direcciones noreply.

## Visibilidad del vídeo antes de publicarlo
La release `ep-<fecha>` y los artefactos de Actions (1 día de retención) son **públicos**: el vídeo del día se puede ver desde las 04:30 hasta su publicación a las 20:30. Se acepta porque el contenido es divulgativo y se publica igualmente. Si un día importa la exclusiva, la opción es guardar el MP4 cifrado o en un almacenamiento privado.

## Cadena de suministro
- Versiones fijadas en `package.json` (Remotion 4.0.536, three 0.169.0, React 18.3.1) y `npm ci` con lockfile (`npm audit`: 0 vulnerabilidades, 21-10-2026).
- Acciones de GitHub fijadas por SHA (con su versión en un comentario) y Claude Code fijado a 2.1.305.
- Pendiente: hashes en `requirements.txt` (pip) y revisión fija de los modelos de Hugging Face. Hoy entran por versión; se aplazan porque solo corren en `build`, que no tiene secretos.

## Superficie de entrada
- No hay webhooks públicos (CONNECT sondea la API) ni servidor que atacar. El panel es HTML estático sin datos sensibles y escapa todo el texto.
- Los workflows solo arrancan por cron o a mano (`workflow_dispatch`); nunca por PR o issue de terceros. La fecha manual se valida antes de usarla y nunca se interpola en un script.
- `tiktok-auth.mjs` (solo en local) escucha únicamente en 127.0.0.1: comprueba `state`, acepta solo `GET /callback`, hace un único intercambio, escapa el texto, responde `no-store` y se cierra a los 5 minutos.

## Contenido y operación
- Datos solo con fuente verificada, sin música de terceros, etiqueta de IA y sin mensajes no solicitados (CONNECT responde una vez a quien comenta la palabra clave y se identifica como automático).
- Parada de emergencia: workflow `stop`.
- Copias de seguridad: el historial (runs, episodios y escenas) está en git y los MP4 en las releases.
