// PUBLISHER · Instagram (API con Instagram Login) y TikTok (Content Posting API). Solo APIs oficiales.
// Idempotencia: cada publicador guarda su progreso en `ps` (estado de la red en el run) mediante save() ANTES de cada
// paso irreversible; al reintentar, retoma desde ahí y nunca publica dos veces el mismo contenedor.
import fs from "node:fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Los registros, el estado (data/, que se sube a git) y los issues nunca llevan credenciales: se tapan los campos
// conocidos (query, form o JSON), las cabeceras Bearer/OAuth y, por valor, cualquier secreto presente en el entorno.
const SECRET_NAME = /TOKEN|SECRET|KEY|PASSWORD/i;
export const redact = (s, env = process.env) => {
  let out = String(s)
    .replace(/((?:access|refresh)_token|client_secret|code_verifier|upload_url)(["']?\s*[:=]\s*["']?)[^&\s"',}]+/gi, "$1$2***")
    .replace(/\b(bearer|oauth)\s+[^\s"',}]+/gi, "$1 ***")
    .replace(/https:\/\/[^\s"']*upload[^\s"']*/gi, "https://***");
  for (const [k, v] of Object.entries(env)) if (SECRET_NAME.test(k) && v && v.length >= 8) out = out.split(v).join("***");
  return out;
};

async function call(fetchFn, url, init = {}) {
  const r = await fetchFn(url, init);
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
  if (!r.ok || body.error?.code && body.error.code !== "ok") throw new Error(redact(`${r.status} ${url.split("?")[0]}: ${JSON.stringify(body.error ?? body).slice(0, 300)}`));
  return body;
}

// ---------- Instagram ----------
// Flujo: contenedor REELS con subida reanudable → POST del MP4 a rupload.facebook.com → esperar FINISHED → media_publish.
export async function publishInstagram({ video, caption, ps, save, env = process.env, fetchFn = fetch, pollMs = 5000, maxPolls = 120 }) {
  const token = env.IG_ACCESS_TOKEN, user = env.IG_USER_ID, ver = env.IG_API_VERSION ?? "v24.0";
  if (!token || !user) throw new Error("Instagram sin autorizar: faltan IG_ACCESS_TOKEN / IG_USER_ID (docs/04-INTEGRACIONES.md)");
  const G = `https://graph.instagram.com/${ver}`;
  const q = (o) => new URLSearchParams({ ...o, access_token: token }).toString();
  // POST con cuerpo form-urlencoded: una caption larga con emojis no cabe en la URL (414)
  const post = (url, o) => call(fetchFn, url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: q(o) });
  const findByCaption = async () => {
    const recent = await call(fetchFn, `${G}/${user}/media?${q({ fields: "id,caption,permalink,timestamp", limit: "10" })}`);
    return recent.data?.find((m) => (m.caption ?? "").trim() === caption.trim());
  };

  if (ps.mediaId) { // ya publicado en un intento anterior: solo falta el enlace
    const info = await call(fetchFn, `${G}/${ps.mediaId}?${q({ fields: "permalink" })}`);
    return { id: ps.mediaId, permalink: info.permalink };
  }
  if (ps.containerId) { // reintento: ¿ya se publicó ese contenedor?
    const st = await call(fetchFn, `${G}/${ps.containerId}?${q({ fields: "status_code" })}`);
    if (st.status_code === "PUBLISHED") {
      const hit = await findByCaption();
      if (hit) return { id: hit.id, permalink: hit.permalink };
      throw new Error("contenedor PUBLISHED pero no se encuentra el post: revisar a mano antes de reintentar");
    }
    if (["ERROR", "EXPIRED"].includes(st.status_code)) { delete ps.containerId; delete ps.uploaded; save(); }
  }
  if (!ps.containerId) {
    // Red de seguridad ante estado perdido (p. ej. un push fallido): si ya hay un post con esta caption, no se repite.
    const dup = await findByCaption();
    if (dup) return { id: dup.id, permalink: dup.permalink, note: "ya publicado (detectado por caption)" };
    const c = await post(`${G}/${user}/media`, { media_type: "REELS", upload_type: "resumable", caption, share_to_feed: "true" });
    ps.containerId = c.id; save();
  }
  if (!ps.uploaded) {
    const bytes = fs.readFileSync(video);
    await call(fetchFn, `https://rupload.facebook.com/ig-api-upload/${ver}/${ps.containerId}`, { method: "POST", headers: { Authorization: `OAuth ${token}`, offset: "0", file_size: String(bytes.length) }, body: bytes });
    ps.uploaded = true; save();
  }
  for (let i = 0; i < maxPolls; i++) {
    const st = await call(fetchFn, `${G}/${ps.containerId}?${q({ fields: "status_code,status" })}`);
    if (st.status_code === "FINISHED") break;
    if (["ERROR", "EXPIRED"].includes(st.status_code)) { delete ps.containerId; delete ps.uploaded; save(); throw new Error(`Instagram rechazó el vídeo: ${st.status ?? st.status_code}`); }
    if (i === maxPolls - 1) throw new Error("Instagram no terminó de procesar el vídeo a tiempo");
    await sleep(pollMs);
  }
  const pub = await post(`${G}/${user}/media_publish`, { creation_id: ps.containerId });
  ps.mediaId = pub.id; save();
  const info = await call(fetchFn, `${G}/${pub.id}?${q({ fields: "permalink" })}`);
  return { id: pub.id, permalink: info.permalink };
}

// ---------- TikTok ----------
// Sin auditoría: solo cuentas privadas y SELF_ONLY (403 unaudited_client_can_only_post_to_private_accounts).
// is_aigc = true etiqueta el vídeo como generado con IA (voz sintética y animación por código).
// mode "inbox" (scope video.upload): el vídeo llega a la bandeja de TikTok del creador y él lo publica con un toque.
// Esa API no admite texto: la descripción se le entrega aparte (data/alerts/tiktok.md → issue «tiktok»).
export async function publishTikTok({ video, caption, ps, save, env = process.env, fetchFn = fetch, privacy = "SELF_ONLY", mode = "direct", pollMs = 5000, maxPolls = 120 }) {
  const inbox = mode === "inbox";
  const token = env.TIKTOK_ACCESS_TOKEN;
  if (!token) throw new Error("TikTok sin autorizar: falta TIKTOK_ACCESS_TOKEN (docs/04-INTEGRACIONES.md)");
  const T = "https://open.tiktokapis.com/v2/post/publish";
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" };
  // La upload_url es una credencial (el PUT no lleva token): solo vive en memoria, nunca en el estado que se sube a git.
  // Reintento tras un init sin subida: se pide otro init (el anterior caduca solo).
  let uploadUrl;
  if (ps.publishId && !ps.uploaded) { delete ps.publishId; save(); }
  if (!ps.publishId) {
    if (!inbox) {
      const info = await call(fetchFn, `${T}/creator_info/query/`, { method: "POST", headers: auth });
      const opts = info.data?.privacy_level_options ?? [];
      if (!opts.includes(privacy)) throw new Error(`TikTok no permite la privacidad ${privacy} en esta cuenta (opciones: ${opts.join(", ")})`);
    }
    const size = fs.statSync(video).size; // < 64 MB: un solo trozo
    if (size > 64 * 1024 * 1024) throw new Error("vídeo > 64 MB: reducir bitrate");
    const source_info = { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 };
    const init = await call(fetchFn, `${T}${inbox ? "/inbox" : ""}/video/init/`, { method: "POST", headers: auth, body: JSON.stringify(inbox ? { source_info } : {
      post_info: { title: caption.slice(0, 2200), privacy_level: privacy, disable_duet: false, disable_stitch: false, disable_comment: false, video_cover_timestamp_ms: 1000, brand_content_toggle: false, brand_organic_toggle: true, is_aigc: true },
      source_info,
    }) });
    ps.publishId = init.data.publish_id; uploadUrl = init.data.upload_url; save();
  }
  if (!ps.uploaded) {
    const bytes = fs.readFileSync(video);
    const r = await fetchFn(uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4", "Content-Length": String(bytes.length), "Content-Range": `bytes 0-${bytes.length - 1}/${bytes.length}` }, body: bytes });
    if (!r.ok) { delete ps.publishId; save(); throw new Error(`TikTok subida ${r.status}`); }
    ps.uploaded = true; save();
  }
  for (let i = 0; i < maxPolls; i++) {
    const st = await call(fetchFn, `${T}/status/fetch/`, { method: "POST", headers: auth, body: JSON.stringify({ publish_id: ps.publishId }) });
    const s = st.data?.status;
    if (s === "PUBLISH_COMPLETE") return { id: (st.data.publicaly_available_post_id ?? [])[0] ?? ps.publishId, privacy };
    if (inbox && s === "SEND_TO_USER_INBOX") return { id: ps.publishId, inbox: true };
    if (s === "FAILED") { delete ps.publishId; delete ps.uploaded; save(); throw new Error(`TikTok: ${st.data.fail_reason}`); }
    await sleep(pollMs);
  }
  throw new Error("TikTok no confirmó la publicación a tiempo");
}
