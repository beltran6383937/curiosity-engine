# 04 · Integraciones (todas oficiales)

## Instagram: Instagram API with Instagram Login

- **Publicación**: `POST /{ig-user-id}/media` (`media_type=REELS`, `upload_type=resumable`) → `POST https://rupload.facebook.com/ig-api-upload/{ver}/{container}` con el MP4 → esperar `status_code=FINISHED` → `POST /{ig-user-id}/media_publish` → `GET /{media}?fields=permalink`. No hace falta alojar el vídeo en ningún servidor público.
- **Límites**: 50 publicaciones por API cada 24 h y 400 contenedores cada 24 h (consultable en `content_publishing_limit`).
- **Permisos**: `instagram_business_basic` y `instagram_business_content_publish`. Para la cuenta propia de P&Q, con rol en la app, **no hace falta App Review**. CONNECT necesita `instagram_business_manage_comments` y `instagram_business_manage_messages` con **acceso avanzado** (App Review) para responder a cualquier usuario.
- **Etiqueta de IA**: la API no tiene un campo «Info de IA». La caption incluye «Voz generada con IA.» como declaración explícita.
- **Token**: de larga duración (60 días). Se renueva con `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token` `pipeline/tokens.mjs` lo renueva antes de cada publicación y guarda el nuevo como secreto con `GH_ADMIN_TOKEN` (PAT de grano fino: solo este repo, permiso «Secrets: write»). Sin ese PAT no se renueva y caduca a los 60 días.

### Autorización inicial (la haces tú una vez, unos 10 min)

1. Cambia la cuenta de Instagram de P&Q a **Profesional** (empresa o creador), si no lo es ya.
2. En [developers.facebook.com](https://developers.facebook.com/apps), crea una app tipo «Empresa», añade el producto **Instagram → API setup with Instagram login** y, en «Generate access tokens», añade la cuenta de P&Q (te pedirá iniciar sesión en Instagram y aceptar).
3. Copia el token y el ID de usuario **directamente a GitHub**, sin pasarlos por el chat:
   `gh secret set IG_ACCESS_TOKEN -R <repo>` (lo pega en la terminal, oculto) y `gh secret set IG_USER_ID -R <repo>`.
4. Activa `platforms.instagram.enabled: true` en `config/engine.json`.

## TikTok: Content Posting API

- **Flujo**: `creator_info/query` → `video/init` (`FILE_UPLOAD`, un trozo si pesa menos de 64 MB, `is_aigc: true`) → `PUT upload_url` → `status/fetch` hasta `PUBLISH_COMPLETE`.
- **Restricción dura**: un cliente **sin auditar** solo puede publicar en **cuentas privadas** y con privacidad `SELF_ONLY`. Contra una cuenta pública devuelve 403 `unaudited_client_can_only_post_to_private_accounts`. La cuenta de P&Q es pública, así que **la publicación automática en TikTok no es posible hasta pasar la auditoría** (se solicita desde el portal de desarrolladores; plazo de semanas, criterio de TikTok).
- **Requisitos de la app**: web con política de privacidad y términos (perezandquintano.es puede alojarlos), scope `video.publish`, OAuth del propietario y 6 peticiones por minuto en `init`.
- **Token**: el de acceso dura 24 h y el de refresco 365 días. `pipeline/tokens.mjs` pide uno nuevo antes de cada publicación con `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` y `TIKTOK_REFRESH_TOKEN`; si TikTok rota el de refresco, lo guarda con `GH_ADMIN_TOKEN` (si falta, avisa con una alerta).
- **Hasta la auditoría**: `platforms.tiktok.enabled: false`. El vídeo queda en la release del día para subirlo a mano si quieres.

## Claude Code headless (investigación, guion, escena, revisión visual)

- `claude -p` en el runner con `CLAUDE_CODE_OAUTH_TOKEN` (lo generas tú con `claude setup-token` y lo guardas con `gh secret set CLAUDE_CODE_OAUTH_TOKEN`). Consume la cuota de tu suscripción, sin coste por API.
- Herramientas limitadas por paso (`--allowedTools`): lectura/escritura en el repo, WebSearch/WebFetch y los scripts de `pipeline/`. Sin acceso a secretos de publicación (esos solo existen en el job de publicar).

## Alertas

Issue de GitHub con la etiqueta `alerta` (te llega por correo y a la app de GitHub). Solo en casos que importan: un paso que falla 3 veces, una publicación que falla 3 veces o que no haya vídeo listo a la hora de publicar.

## Fuentes consultadas (20-10-2026)

- Meta, Content Publishing: https://developers.facebook.com/docs/instagram-platform/content-publishing y `content_publishing_limit`.
- TikTok, Direct Post reference (actualizada el 04-08-2026): https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- Manychat: plan gratuito reducido a ~25 contactos desde el 02-03-2026 (fuentes de terceros, sin verificar en la web oficial). Por eso se descarta.
