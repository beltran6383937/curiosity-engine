// Renovación de tokens con APIs falsas: TikTok rota el refresh y se guarda; sin PAT se avisa; los errores no llevan tokens.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renew } from "../pipeline/tokens.mjs";

const res = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const cfg = (ig, tt) => ({ platforms: { instagram: { enabled: ig }, tiktok: { enabled: tt } } });
const base = { TIKTOK_CLIENT_KEY: "k", TIKTOK_CLIENT_SECRET: "s", TIKTOK_REFRESH_TOKEN: "R1", IG_ACCESS_TOKEN: "IGOLD" };
const harness = (env, c, fetchFn) => {
  const secrets = {}, vars = {}, alerts = [];
  const p = renew({ env, cfg: c, fetchFn, setSecret: (n, v) => { secrets[n] = v; }, exportVar: (n, v) => { vars[n] = v; }, alert: async (m) => { alerts.push(m); } });
  return p.then((notes) => ({ notes, secrets, vars, alerts }));
};

test("TikTok: renueva el acceso y guarda el refresh rotado", async () => {
  const r = await harness({ ...base, GH_ADMIN_TOKEN: "pat" }, cfg(false, true), async (url, init) => {
    assert.match(url, /oauth\/token/); assert.match(String(init.body), /grant_type=refresh_token/);
    return res({ access_token: "A2", refresh_token: "R2", refresh_expires_in: 365 * 86400 });
  });
  assert.deepEqual(r.vars, { TIKTOK_ACCESS_TOKEN: "A2" });
  assert.deepEqual(r.secrets, { TIKTOK_REFRESH_TOKEN: "R2" });
  assert.deepEqual(r.alerts, []);
});

test("TikTok: refresh rotado sin PAT → alerta (mañana fallaría)", async () => {
  const r = await harness(base, cfg(false, true), async () => res({ access_token: "A2", refresh_token: "R2", refresh_expires_in: 365 * 86400 }));
  assert.equal(r.vars.TIKTOK_ACCESS_TOKEN, "A2");
  assert.deepEqual(r.secrets, {});
  assert.match(r.alerts[0], /GH_ADMIN_TOKEN/);
});

test("TikTok: refresh a punto de caducar → alerta para reautorizar", async () => {
  const r = await harness({ ...base, GH_ADMIN_TOKEN: "pat" }, cfg(false, true), async () => res({ access_token: "A2", refresh_token: "R1", refresh_expires_in: 10 * 86400 }));
  assert.match(r.alerts[0], /caduca en 10 días/);
});

test("Instagram: renueva y guarda el secreto; error sin filtrar el token", async () => {
  const ok = await harness({ ...base, GH_ADMIN_TOKEN: "pat" }, cfg(true, false), async (url) => { assert.match(url, /refresh_access_token/); return res({ access_token: "IGNEW", expires_in: 60 * 86400 }); });
  assert.deepEqual(ok.secrets, { IG_ACCESS_TOKEN: "IGNEW" });
  assert.deepEqual(ok.vars, { IG_ACCESS_TOKEN: "IGNEW" });
  const bad = await harness({ ...base, GH_ADMIN_TOKEN: "pat" }, cfg(true, false), async () => res({ error: { message: "Invalid OAuth access_token=IGOLD" } }, 400));
  assert.equal(bad.alerts.length, 1);
  assert.ok(!bad.alerts[0].includes("IGOLD"), bad.alerts[0]);
});

test("redes desactivadas: no llama a ninguna API", async () => {
  const r = await harness({ ...base, GH_ADMIN_TOKEN: "pat" }, cfg(false, false), async () => { throw new Error("no debería llamar"); });
  assert.deepEqual(r, { notes: [], secrets: {}, vars: {}, alerts: [] });
});

test("sin poder renovar, el token fijo pasa al paso de publicación", async () => {
  const r = await harness({ IG_ACCESS_TOKEN: "IGOLD", TIKTOK_ACCESS_TOKEN: "TTOLD" }, cfg(true, true), async () => { throw new Error("no debería llamar"); });
  assert.deepEqual(r.vars, { TIKTOK_ACCESS_TOKEN: "TTOLD", IG_ACCESS_TOKEN: "IGOLD" });
  assert.equal(r.notes.length, 2);
});
