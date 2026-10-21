// Renovación de tokens antes de publicar (job "publish"). Nunca imprime un token: los enmascara en el log de
// GitHub y los pasa al resto del job por $GITHUB_ENV. Los que hay que conservar se guardan como secretos con
// GH_ADMIN_TOKEN (PAT de grano fino, solo este repo, permiso "Secrets: write").
//  · TikTok: el de acceso dura 24 h → se pide uno nuevo en cada publicación con el de refresco (365 días, puede rotar).
//  · Instagram: el de larga duración dura 60 días → se renueva cada vez (debe tener más de 24 h) y se guarda.
// Uso: node pipeline/tokens.mjs
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { loadConfig } from "./orchestrator.mjs";
import { redact } from "./publishers.mjs";

const json = async (r, what) => {
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.error) throw new Error(redact(`${what} ${r.status}: ${body.error_description ?? body.error?.message ?? body.error ?? "error"}`));
  return body;
};

export async function refreshTikTok({ env = process.env, fetchFn = fetch } = {}) {
  const r = await fetchFn("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, grant_type: "refresh_token", refresh_token: env.TIKTOK_REFRESH_TOKEN }),
  });
  const b = await json(r, "TikTok refresh");
  return { access: b.access_token, refresh: b.refresh_token, rotated: !!b.refresh_token && b.refresh_token !== env.TIKTOK_REFRESH_TOKEN, refreshExpiresDays: Math.floor((b.refresh_expires_in ?? 0) / 86400) };
}

export async function refreshIg({ env = process.env, fetchFn = fetch } = {}) {
  const ver = env.IG_API_VERSION ?? "v24.0";
  const r = await fetchFn(`https://graph.instagram.com/${ver}/refresh_access_token?grant_type=ig_refresh_token&access_token=${env.IG_ACCESS_TOKEN}`);
  const b = await json(r, "Instagram refresh");
  return { access: b.access_token, expiresDays: Math.floor((b.expires_in ?? 0) / 86400) };
}

// Ejecuta la renovación de las redes activas. Devuelve avisos (no lanza) para que un fallo aquí no tape el de publicación.
export async function renew({ env = process.env, cfg = loadConfig(), fetchFn = fetch, setSecret, exportVar, alert = async () => {} } = {}) {
  const notes = [];
  const canSave = !!env.GH_ADMIN_TOKEN;
  const exported = new Set(), out = exportVar;
  exportVar = (n, v) => { exported.add(n); out(n, v); };
  if (cfg.platforms.tiktok?.enabled) {
    if (!env.TIKTOK_REFRESH_TOKEN || !env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) notes.push("TikTok: faltan TIKTOK_CLIENT_KEY/SECRET/REFRESH_TOKEN; se usa TIKTOK_ACCESS_TOKEN tal cual (caduca en 24 h)");
    else try {
      const t = await refreshTikTok({ env, fetchFn });
      exportVar("TIKTOK_ACCESS_TOKEN", t.access);
      if (t.rotated) {
        if (canSave) setSecret("TIKTOK_REFRESH_TOKEN", t.refresh);
        else await alert("TikTok ha rotado el token de refresco y no hay GH_ADMIN_TOKEN para guardarlo: mañana fallará la publicación");
      }
      if (t.refreshExpiresDays && t.refreshExpiresDays < 30) await alert(`TikTok: el token de refresco caduca en ${t.refreshExpiresDays} días; hay que volver a autorizar la app`);
      notes.push("TikTok: token de acceso renovado");
    } catch (e) { await alert(`no se pudo renovar el token de TikTok: ${e.message}`); }
  }
  if (cfg.platforms.instagram?.enabled) {
    if (!canSave) notes.push("Instagram: sin GH_ADMIN_TOKEN no se renueva (el token caduca a los 60 días de crearlo)");
    else try {
      const t = await refreshIg({ env, fetchFn });
      exportVar("IG_ACCESS_TOKEN", t.access);
      setSecret("IG_ACCESS_TOKEN", t.access);
      notes.push(`Instagram: token renovado (${t.expiresDays} días)`);
    } catch (e) { await alert(`no se pudo renovar el token de Instagram: ${e.message}`); }
  }
  // Lo que no se haya renovado pasa tal cual al paso de publicación (los secretos fijos no llegan de otro modo)
  for (const [p, name] of [["tiktok", "TIKTOK_ACCESS_TOKEN"], ["instagram", "IG_ACCESS_TOKEN"]]) if (cfg.platforms[p]?.enabled && !exported.has(name) && env[name]) exportVar(name, env[name]);
  return notes;
}

if (process.argv[1]?.endsWith("tokens.mjs")) {
  const { alert } = await import("./steps.mjs");
  // El valor va por stdin (nunca en la línea de comandos, que puede verse en la lista de procesos)
  const setSecret = (name, value) => (process.env.GITHUB_ACTIONS && console.log(`::add-mask::${value}`), execFileSync("gh", ["secret", "set", name], { input: value, env: { ...process.env, GH_TOKEN: process.env.GH_ADMIN_TOKEN }, stdio: ["pipe", "inherit", "inherit"] }));
  // Fuera de GitHub Actions no se exporta ni se imprime nada
  const exportVar = (name, value) => {
    if (!process.env.GITHUB_ENV) return;
    console.log(`::add-mask::${value}`);
    fs.appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
  };
  for (const n of await renew({ setSecret, exportVar, alert })) console.log(`[tokens] ${n}`);
}
