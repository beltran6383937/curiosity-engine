// CONNECT · palabra clave en comentarios → DM privado (Private Replies) con el mensaje de P&Q + respuesta pública corta.
// Sondea los comentarios de los Reels con CTA (sin webhooks públicos que proteger); lo lanza .github/workflows/connect.yml.
// Requisitos de Meta: instagram_business_manage_comments + instagram_business_manage_messages; para responder a cualquier
// usuario, con acceso avanzado (App Review). config/engine.json → connect.mode:
//   off  · no hace nada
//   test · solo responde a las cuentas de connect.testers (vídeo de App Review; la app sigue en modo desarrollo)
//   live · responde a todo el que comente la palabra clave (tras la aprobación de Meta)
// Un DM por persona y recurso. Meta solo admite UN private reply por comentario y dentro de 7 días: aunque el registro
// se pierda (push fallido), un reintento no duplica el DM, y la respuesta pública solo va detrás de un DM enviado.
// Uso: node pipeline/connect.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { redact } from "./publishers.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DAY = 86400000;
export const MAX_FAILS = 5; // fallos sueltos de un comentario antes de abandonarlo (borrado, usuario que no admite DMs…)

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const matches = (text, keyword) => new RegExp(`(^|[^\\p{L}])${escRe(keyword)}([^\\p{L}]|$)`, "iu").test(text ?? "");
export const message = (cta, tpl) => tpl.replaceAll("{url}", cta.resource_url).replaceAll("{keyword}", cta.keyword);
// Varias frases para que Meta no vea el mismo comentario repetido; la misma para el mismo comentario (determinista)
export const publicReply = (commentId, replies) => replies[parseInt(crypto.createHash("sha256").update(String(commentId)).digest("hex").slice(0, 8), 16) % replies.length];

// data/ es público: los ids de Instagram se guardan como HMAC con un secreto (CONNECT_HMAC_KEY, secreto de GitHub);
// un hash sin clave se revierte probando ids conocidos.
export const key = (s, secret = process.env.CONNECT_HMAC_KEY) => {
  if (!secret || secret.length < 32) throw new Error("falta CONNECT_HMAC_KEY (32+ caracteres aleatorios)");
  return crypto.createHmac("sha256", secret).update(String(s)).digest("hex").slice(0, 32);
};
const userKey = (c, cta) => key(`user:${c.from?.id}:${cta.resource_url}`);

// Pura y testeable: decide a quién responder. ledger[key(commentId)] = true (enviado) | nº de fallos; ledger[userKey] = true.
// own: id y/o username de la cuenta de P&Q (su propio comentario «Comenta LLAMADA…» nunca se responde).
export function pending(comments, cta, ledger, own, { testers = null, since = 0 } = {}) {
  const norm = (u) => String(u ?? "").toLowerCase().replace(/^@/, "");
  const seen = new Set(), mine = new Set([own].flat().filter(Boolean).map(norm)), allow = testers && new Set(testers.map(norm));
  return comments.filter((c) => {
    const k = key(c.id), u = userKey(c, cta), done = ledger[k] === true || ledger[k] >= MAX_FAILS;
    if (!c.from?.id || mine.has(norm(c.from.id)) || mine.has(norm(c.from.username)) || !matches(c.text, cta.keyword) || done || ledger[u] || seen.has(u)) return false;
    if (since && !(Date.parse(c.timestamp) >= since)) return false; // fuera de la ventana de Meta (o sin fecha)
    if (allow && !allow.has(norm(c.from.username))) return false;
    seen.add(u); return true;
  }).sort((a, b) => (ledger[key(a.id)] || 0) - (ledger[key(b.id)] || 0)); // los que nunca fallaron, primero: un fallo permanente no tapa a nadie
}

async function ig(fetchFn, url, init) {
  const r = await fetchFn(url, init);
  let body; try { body = JSON.parse(await r.text()); } catch { body = {}; }
  return { ok: r.ok && !body.error, status: r.status, error: body.error, body };
}
// Errores de toda la pasada (token, límites, Meta caída): se para sin culpar al comentario
// (#200–#299 = permisos de la app; #10 no entra: Meta también lo usa para un comentario fuera de plazo)
export const systemic = (res) => res.status >= 500 || res.status === 429 || [1, 2, 4, 17, 32, 190, 613].includes(res.error?.code) || (res.error?.code >= 200 && res.error?.code < 300);
const explain = (res, env) => redact(`${res.status} ${res.error?.code ?? ""}/${res.error?.error_subcode ?? ""} ${res.error?.message ?? ""}`, { ...process.env, ...env }).trim();

export async function runConnect({ root = ROOT, env = process.env, fetchFn = fetch, now = Date.now(), log = console.log } = {}) {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, "config/engine.json"), "utf8")).connect ?? {};
  const mode = cfg.mode ?? "off";
  if (!["test", "live"].includes(mode)) return log("[CONNECT] desactivado (connect.mode = off)"), { sent: 0 };
  if (fs.existsSync(path.join(root, "data/STOP"))) return log("[CONNECT] data/STOP: no se envía nada"), { sent: 0 };
  const ver = env.IG_API_VERSION ?? "v24.0", tok = env.IG_ACCESS_TOKEN, me = env.IG_USER_ID;
  if (!tok || !me) throw new Error("faltan IG_ACCESS_TOKEN / IG_USER_ID");
  if (!cfg.dm || !cfg.public_replies?.length) throw new Error("falta connect.dm o connect.public_replies en config/engine.json");
  const why = (res) => explain(res, env); // tapa también el token recibido por parámetro (los tests y el CLI no comparten env)
  const G = `https://graph.instagram.com/${ver}`, q = (o) => new URLSearchParams({ ...o, access_token: tok }).toString();
  const post = (url, o) => ig(fetchFn, url, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(o) });
  const LEDGER = path.join(root, "data/connect.json");
  const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : {};
  const save = () => fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1));
  const since = now - (cfg.window_days ?? 6) * DAY; // Meta da 7 días; uno de margen por los retrasos del cron
  const opts = { testers: mode === "test" ? cfg.testers ?? [] : null, since };
  const runsDir = path.join(root, "data/runs");
  const who = await ig(fetchFn, `${G}/me?${q({ fields: "user_id,username" })}`);
  if (!who.ok) throw new Error(`[CONNECT] token de Instagram no válido: ${why(who)}`);
  const own = [me, who.body.user_id, who.body.id, who.body.username];
  let sent = 0, failed = 0, streak = 0;
  const abort = (msg) => { save(); throw new Error(`[CONNECT] ${msg}`); };

  reels: for (const f of fs.readdirSync(runsDir).filter((x) => x.endsWith(".json")).sort()) {
    const run = JSON.parse(fs.readFileSync(path.join(runsDir, f), "utf8"));
    const media = run.platforms?.instagram?.id;
    // El plazo de Meta cuenta desde el comentario (lo filtra pending); un Reel viejo puede recibir comentarios nuevos.
    // ponytail: solo Reels de los últimos connect.reel_days (90) para no sondear todo el histórico cada 15 min
    if (!media || !run.episode || !(Date.parse(run.date) >= now - (cfg.reel_days ?? 90) * DAY)) continue;
    const cta = JSON.parse(fs.readFileSync(path.join(root, "episodes", run.episode, "episode.json"), "utf8")).publication?.cta;
    if (!cta?.keyword || !cta.resource_checked || !cta.resource_url) continue;

    const comments = [];
    let url = `${G}/${media}/comments?${q({ fields: "id,text,timestamp,from", limit: "50" })}`;
    for (let page = 0; url && page < 20; page++) { // ponytail: 1.000 comentarios por vídeo y pasada; subir si un vídeo los pasa
      const res = await ig(fetchFn, url);
      if (!res.ok && systemic(res)) abort(`no se pudieron leer los comentarios de ${run.date}: ${why(res)}`);
      if (!res.ok) { log(`[CONNECT] se salta el Reel de ${run.date} (¿borrado?): ${why(res)}`); failed++; continue reels; } // no tapa a los demás
      comments.push(...(res.body.data ?? []));
      url = res.body.paging?.next;
    }

    for (const c of pending(comments, cta, ledger, own, opts)) {
      if (sent >= (cfg.max_per_run ?? 50)) break; // ponytail: tope fijo por pasada (cada 15 min); ajustar si Meta cambia los límites
      const k = key(c.id);
      const res = await post(`${G}/${me}/messages`, { recipient: { comment_id: c.id }, message: { text: message(cta, cfg.dm) } });
      if (res.ok) {
        ledger[k] = true; ledger[userKey(c, cta)] = true; sent++; streak = 0; save(); // tras cada envío: un corte no pierde lo hecho
        const pr = await ig(fetchFn, `${G}/${c.id}/replies`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: q({ message: publicReply(c.id, cfg.public_replies) }) });
        if (!pr.ok) log(`[CONNECT] DM enviado, pero falló la respuesta pública: ${why(pr)}`); // no se reintenta: mejor sin respuesta que repetida
        continue;
      }
      if (systemic(res)) abort(`Meta corta la pasada: ${why(res)}`);
      ledger[k] = (typeof ledger[k] === "number" ? ledger[k] : 0) + 1; failed++;
      // Abandonado el comentario, se da por atendida a la persona para ese recurso: si el DM sí salió y se perdió el
      // registro, Meta rechaza el repetido sin decir por qué, y otro comentario suyo no debe recibirlo dos veces.
      // ponytail: quien tenga 5 fallos reales y vuelva a comentar no recibe el DM; consultar /conversations si pasa.
      if (ledger[k] >= MAX_FAILS) ledger[userKey(c, cta)] = true;
      save();
      log(`[CONNECT] no se pudo responder a un comentario (${ledger[k]}/${MAX_FAILS}): ${why(res)}`);
      // Tres fallos seguidos huelen a problema general: se para y avisa. La cuenta se queda (y pending prueba antes a
      // quien nunca falló), así que un comentario roto llega a MAX_FAILS y no bloquea a los válidos en las pasadas siguientes.
      if (++streak >= 3) abort(`3 fallos seguidos, posible problema general: ${why(res)}`);
    }
  }
  save();
  log(`[CONNECT] modo ${mode}: ${sent} DMs enviados, ${failed} fallos`);
  return { sent, failed };
}

if (process.argv[1]?.endsWith("connect.mjs")) {
  try { await runConnect(); } catch (e) {
    // Una alerta (issue) al día como mucho: el workflow corre cada 15 min
    const { alert } = await import("./steps.mjs");
    const mark = path.join(ROOT, `data/alerts/connect-${new Date().toISOString().slice(0, 10)}`);
    if (!fs.existsSync(mark)) { await alert(`CONNECT (DM automático) falla: ${e.message}`); fs.mkdirSync(path.dirname(mark), { recursive: true }); fs.writeFileSync(mark, ""); }
    console.error(redact(e.message)); process.exitCode = 1;
  }
}
