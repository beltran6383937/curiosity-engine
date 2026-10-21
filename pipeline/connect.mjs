// CONNECT · palabra clave en comentarios → respuesta privada con el recurso prometido (Instagram, API oficial).
// Sondea los comentarios de los Reels con CTA (sin webhooks públicos que proteger) y responde UNA vez por persona.
// Requisitos de Meta: instagram_business_manage_comments + instagram_business_manage_messages con acceso avanzado
// (App Review) para responder a cualquier usuario. Desactivado hasta entonces (config: connect.enabled).
// Uso: node pipeline/connect.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const LEDGER = path.join(ROOT, "data/connect.json");

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const matches = (text, keyword) => new RegExp(`(^|[^\\p{L}])${escRe(keyword)}([^\\p{L}]|$)`, "iu").test(text ?? "");
export const message = (cta) => `¡Aquí lo tienes! 🚀 ${cta.resource_title}: ${cta.resource_url}\n\n(Respuesta automática de P&Q a tu comentario «${cta.keyword}».)`;

// data/ se sube al repositorio: el registro guarda solo huellas SHA-256 de los ids, nunca ids de usuarios ni comentarios.
// data/ es público: los ids de Instagram se guardan como HMAC con un secreto (CONNECT_HMAC_KEY, secreto de GitHub);
// un hash sin clave se revierte probando ids conocidos.
export const key = (s, secret = process.env.CONNECT_HMAC_KEY) => {
  if (!secret || secret.length < 32) throw new Error("falta CONNECT_HMAC_KEY (32+ caracteres aleatorios)");
  return crypto.createHmac("sha256", secret).update(String(s)).digest("hex").slice(0, 32);
};
// Pura y testeable: decide a quién responder. ledger = { key(commentId): true, key("user:<mediaId>:<userId>"): true }
export function pending(comments, cta, ledger, ownUserId) {
  const seen = new Set();
  return comments.filter((c) => { const u = key(`user:${c.media}:${c.from?.id}`); if (!matches(c.text, cta.keyword) || c.from?.id === ownUserId || ledger[key(c.id)] || ledger[u] || seen.has(u)) return false; seen.add(u); return true; });
}

export async function runConnect({ env = process.env, fetchFn = fetch, maxPerRun = 50 } = {}) {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config/engine.json"), "utf8"));
  if (!cfg.connect?.enabled) return console.log("[CONNECT] desactivado (pendiente de App Review de Meta)");
  const ver = env.IG_API_VERSION ?? "v24.0", tok = env.IG_ACCESS_TOKEN, me = env.IG_USER_ID;
  const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : {};
  let sent = 0;
  for (const f of fs.readdirSync(path.join(ROOT, "data/runs")).filter((x) => x.endsWith(".json"))) {
    const run = JSON.parse(fs.readFileSync(path.join(ROOT, "data/runs", f), "utf8"));
    const media = run.platforms?.instagram?.id; if (!media || !run.episode) continue;
    const cta = JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", run.episode, "episode.json"), "utf8")).publication?.cta;
    if (!cta?.resource_checked) continue;
    const r = await fetchFn(`https://graph.instagram.com/${ver}/${media}/comments?fields=id,text,from&limit=100&access_token=${tok}`);
    const comments = ((await r.json()).data ?? []).map((c) => ({ ...c, media }));
    for (const c of pending(comments, cta, ledger, me)) {
      if (sent >= maxPerRun) break; // ponytail: tope fijo por pasada; ajustar si Meta cambia los límites de mensajería
      const res = await fetchFn(`https://graph.instagram.com/${ver}/${me}/messages`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: { comment_id: c.id }, message: { text: message(cta) } }) });
      if (res.ok) { ledger[key(c.id)] = true; ledger[key(`user:${media}:${c.from?.id}`)] = true; sent++; fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1)); } // se guarda tras cada envío: un corte no duplica DMs
      else console.error(`[CONNECT] no se pudo responder a un comentario: ${res.status}`);
    }
  }
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1));
  console.log(`[CONNECT] ${sent} respuestas enviadas`);
}

if (process.argv[1]?.endsWith("connect.mjs")) await runConnect();
