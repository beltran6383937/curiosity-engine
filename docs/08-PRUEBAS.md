# 08 · Pruebas

`npm test` (node:test, sin dependencias), 6 ficheros, 47 pruebas:

| Fichero | Qué demuestra |
|---|---|
| `tests/orchestrator.test.mjs` | Hora de Madrid en verano e invierno; no publica antes de las 07:00; un vídeo de mañana no sale hoy; una segunda pasada no repite pasos ni publicaciones; un fallo se reanuda desde su paso y escala a NEEDS_ATTENTION tras 3 intentos (con una sola alerta); STOP bloquea todo; si TikTok falla, Instagram conserva su estado; una red desactivada no bloquea. |
| `tests/publishers.test.mjs` | Instagram: contenedor → subida → FINISHED → publicar → enlace; **corte justo después de publicar → el reintento no publica otra vez** (lo encuentra por la caption); sin credenciales da un error claro; los errores nunca contienen el token. TikTok: rechaza una privacidad no permitida (cliente sin auditar); el flujo completo envía `is_aigc: true`, `SELF_ONLY` y un solo trozo. |
| `tests/qa.test.mjs` | SENTINEL bloquea: resolución incorrecta, dato sin verificar, CTA sin recurso, falta de etiqueta de IA, negro a mitad de vídeo (y tolera el fundido inicial), voz que no coincide y sonoridad fuera de rango. Los avisos restan puntos y bajan del umbral de 90. |
| `tests/connect-insights.test.mjs` | Palabra clave exacta (no dentro de otra palabra); una sola respuesta por persona, incluso si comenta dos veces en la misma pasada; nunca a la propia cuenta; el mensaje se identifica como automático; la analítica avisa de muestras pequeñas. |
| `tests/tokens.test.mjs` | TikTok renueva el acceso y guarda el refresco rotado; sin PAT avisa; aviso cuando el refresco va a caducar; Instagram renueva y guarda; los errores no llevan el token; redes desactivadas no llaman a nada; sin poder renovar, el token fijo pasa al paso de publicación. |
| `tests/episode-gate.test.mjs` | El banco de ganchos tiene las 100 plantillas (incluida la 100) y el piloto pasa las reglas; sin «generada con IA» en la caption de Instagram no pasa; la ventana de publicación sigue a `publish_time` y, cruzada con el cron real, deja una pasada previa y reintentos en verano e invierno. También en orquestador: publicación agotada → NEEDS_ATTENTION; STOP retirado → el run continúa. |
| `pipeline/save-state.sh` (manual, repo git local) | Guarda con rutas inexistentes, STOP y reanudación (también sin STOP previo) y un push rechazado por otro commit → rebase y reintento. |

Simulaciones de fallo cubiertas con mocks: error de red, token caducado, publicación duplicada tras corte, motor de voz caído, recurso de CTA inexistente y reinicio a mitad (estado atómico en disco).

**No cubierto aún con API real** (requiere autorizaciones): Instagram, TikTok, Claude headless en el runner y el workflow completo en GitHub. Ver [10-ESTADO-REAL.md](10-ESTADO-REAL.md).

Resultado de la última ejecución: ver `docs/10-ESTADO-REAL.md`.
