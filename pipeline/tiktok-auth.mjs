// Autorización única de TikTok (Login Kit para escritorio + PKCE): abre el consentimiento, recibe el código en
// http://localhost:8723/callback, lo cambia por tokens y los guarda en .env (nunca los imprime).
// Requiere TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET en .env. Uso: node pipeline/tiktok-auth.mjs
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { execFile } from "node:child_process";
import { parseEnv } from "node:util";

const ENV = path.resolve(import.meta.dirname, "../.env");
const REDIRECT = "http://localhost:8723/callback";
const SCOPES = "user.info.basic,video.publish,video.upload";

const readEnv = () => parseEnv(fs.readFileSync(ENV, "utf8")); // sintaxis .env estándar (comillas, comentarios)
export function upsertEnv(text, vars) {
  let out = text;
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`^${k}=.*$`, "m");
    out = re.test(out) ? out.replace(re, `${k}=${v}`) : out.replace(/\n?$/, `\n${k}=${v}\n`);
  }
  return out;
}

const env = readEnv();
if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) { console.error("Faltan TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET en .env"); process.exit(1); }
const verifier = crypto.randomBytes(48).toString("base64url");
const challenge = crypto.createHash("sha256").update(verifier).digest("hex"); // TikTok escritorio: SHA-256 en hex
const state = crypto.randomBytes(16).toString("hex");
const url = "https://www.tiktok.com/v2/auth/authorize/?" + new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, scope: SCOPES, response_type: "code", redirect_uri: REDIRECT, state, code_challenge: challenge, code_challenge_method: "S256" });

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
let busy = false; // un solo intercambio: el código y el verifier valen una vez
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT), q = u.searchParams;
  const reply = (status, msg) => res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(`<p style="font:16px sans-serif">${esc(msg)}</p>`);
  if (req.method !== "GET" || u.pathname !== "/callback") return reply(404, "No encontrado.");
  if (q.get("state") !== state) return reply(400, "Estado no válido."); // no cierra: una petición ajena no tumba el flujo
  if (busy) return reply(409, "La autorización ya está en curso.");
  busy = true;
  const done = (msg) => { reply(200, msg); clearTimeout(timer); server.close(); };
  if (!q.get("code")) return done(`TikTok no devolvió código: ${q.get("error_description") || q.get("error") || "?"}`);
  try {
    const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, code: q.get("code"), grant_type: "authorization_code", redirect_uri: REDIRECT, code_verifier: verifier }),
    }).then((x) => x.json());
    if (!r.access_token) { console.error("Intercambio fallido:", r.error, r.error_description); return done("Falló el intercambio del código (mira la terminal)."); }
    fs.writeFileSync(ENV, upsertEnv(fs.readFileSync(ENV, "utf8"), { TIKTOK_ACCESS_TOKEN: r.access_token, TIKTOK_REFRESH_TOKEN: r.refresh_token, TIKTOK_OPEN_ID: r.open_id }));
    console.log(`OK: tokens guardados en .env · scopes: ${r.scope} · access ${Math.round(r.expires_in / 3600)} h · refresh ${Math.round(r.refresh_expires_in / 86400)} d`);
    done("Listo. Ya puedes cerrar esta pestaña.");
  } catch (e) { console.error("Intercambio fallido:", e.message); done("Falló el intercambio del código (mira la terminal)."); }
});
const timer = setTimeout(() => { console.error("Sin respuesta en 5 min: vuelve a lanzar el script."); server.close(); process.exitCode = 1; }, 5 * 60e3);
server.listen(8723, "127.0.0.1", () => {
  console.log("Esperando autorización en", REDIRECT);
  if (process.platform === "win32") execFile("cmd", ["/c", "start", "", url.replace(/&/g, "^&")]); else console.log(url);
});
