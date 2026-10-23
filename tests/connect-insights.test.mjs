import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { matches, pending, message, publicReply, key, runConnect, MAX_FAILS } from "../pipeline/connect.mjs";

process.env.CONNECT_HMAC_KEY = "k".repeat(32);
import { summarize } from "../pipeline/insights.mjs";

const cta = { keyword: "LLAMADA", resource_url: "https://example.com/demo", resource_checked: true };
const cfg = JSON.parse(fs.readFileSync(new URL("../config/engine.json", import.meta.url), "utf8")).connect;

test("la palabra clave se detecta sola, en cualquier caja, y no dentro de otra palabra", () => {
  assert.ok(matches("llamada!", "LLAMADA")); assert.ok(matches("Quiero la LLAMADA porfa", "LLAMADA"));
  assert.ok(!matches("llamadas", "LLAMADA")); assert.ok(!matches("", "LLAMADA"));
});

test("responde una sola vez por persona y nunca a la propia cuenta (por id o por username)", () => {
  const cs = [
    { id: "c1", text: "LLAMADA", from: { id: "u1", username: "ana" } },
    { id: "c2", text: "llamada otra vez", from: { id: "u1", username: "ana" } },
    { id: "c3", text: "Comenta LLAMADA", from: { id: "otro-id", username: "PerezAndQuintano" } },
    { id: "c4", text: "qué chulo", from: { id: "u2" } },
    { id: "c5", text: "LLAMADA", from: { id: "me" } },
  ];
  assert.deepEqual(pending(cs, cta, {}, ["me", "perezandquintano"]).map((c) => c.id), ["c1"]);
  const ledger = { [key("c1")]: true, [key(`user:u1:${cta.resource_url}`)]: true };
  assert.deepEqual(pending(cs, cta, ledger, "me").filter((c) => c.from.id === "u1"), []);
});

test("modo test: solo testers; ventana de Meta; abandona tras MAX_FAILS fallos", () => {
  const now = Date.parse("2026-10-23T12:00:00Z");
  const cs = [
    { id: "a", text: "llamada", timestamp: "2026-10-23T08:31:00+0000", from: { id: "1", username: "Tester_PQ" } },
    { id: "b", text: "llamada", timestamp: "2026-10-23T08:31:00+0000", from: { id: "2", username: "desconocido" } },
    { id: "c", text: "llamada", timestamp: "2026-10-10T08:31:00+0000", from: { id: "3", username: "tester_pq2" } },
    { id: "d", text: "llamada", from: { id: "4", username: "tester_pq3" } },
  ];
  const opts = { testers: ["@tester_pq", "tester_pq2", "tester_pq3"], since: now - 6 * 86400000 };
  assert.deepEqual(pending(cs, cta, {}, "me", opts).map((c) => c.id), ["a"]); // c: viejo · d: sin fecha · b: no es tester
  assert.deepEqual(pending(cs, cta, { [key("a")]: MAX_FAILS - 1 }, "me", opts).map((c) => c.id), ["a"]);
  assert.deepEqual(pending(cs, cta, { [key("a")]: MAX_FAILS }, "me", opts), []);
});

test("el DM de la config: recurso y palabra clave, se identifica como automático y cabe en Instagram (1000 bytes)", () => {
  const m = message(cta, cfg.dm);
  assert.match(m, /example\.com\/demo/); assert.match(m, /«LLAMADA»/); assert.match(m, /automático/); assert.match(m, /perezandquintano\.es/);
  assert.ok(!/\{(url|keyword)\}/.test(m)); assert.ok(Buffer.byteLength(m) <= 1000, `${Buffer.byteLength(m)} bytes`);
  assert.ok(/datos ficticios/.test(m) && !/precio|€/i.test(m)); // verdad de producto: demo rotulada, sin precios
  assert.equal(cfg.mode, "off"); // no se activa sin App Review (o en test con testers)
  assert.equal(publicReply("x", cfg.public_replies), publicReply("x", cfg.public_replies));
  assert.ok(cfg.public_replies.every((r) => !matches(r, cta.keyword))); // la respuesta pública no se responde a sí misma
});

// ---------- runConnect con la API de Meta simulada ----------
function setup({ mode = "live", stop = false, ledger, runDate = "2026-10-23" } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "connect-"));
  fs.mkdirSync(path.join(root, "config")); fs.mkdirSync(path.join(root, "data/runs"), { recursive: true }); fs.mkdirSync(path.join(root, "episodes/ep1"), { recursive: true });
  fs.writeFileSync(path.join(root, "config/engine.json"), JSON.stringify({ connect: { ...cfg, mode, testers: ["tester"] } }));
  fs.writeFileSync(path.join(root, `data/runs/${runDate}.json`), JSON.stringify({ date: runDate, episode: "ep1", platforms: { instagram: { id: "M1" } } }));
  fs.writeFileSync(path.join(root, "episodes/ep1/episode.json"), JSON.stringify({ publication: { cta } }));
  if (stop) fs.writeFileSync(path.join(root, "data/STOP"), "x");
  if (ledger) fs.writeFileSync(path.join(root, "data/connect.json"), JSON.stringify(ledger));
  return root;
}
const C = (id, user, text = "LLAMADA") => ({ id, text, timestamp: "2026-10-23T09:00:00+0000", from: { id: `id-${user}`, username: user } });
function meta({ pages = [[C("c1", "ana"), C("c2", "luis")]], dm = () => ({}) } = {}) {
  const calls = [];
  const res = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
  const fetchFn = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes("/me?")) return res(200, { user_id: "ME", username: "perezandquintano" });
    if (url.includes("/M1/comments")) { const p = Number(new URL(url).searchParams.get("p") ?? 0); return res(200, { data: pages[p], paging: pages[p + 1] ? { next: `https://graph.instagram.com/v24.0/M1/comments?p=${p + 1}` } : {} }); }
    if (url.endsWith("/messages")) { const b = JSON.parse(init.body); const r = dm(b.recipient.comment_id); return r.error ? res(r.status ?? 400, { error: r.error }) : res(200, { recipient_id: "x", message_id: "m" }); }
    if (url.includes("/replies")) return res(200, { id: "r" });
    return res(404, { error: { code: 100, message: url } });
  };
  return { fetchFn, calls, dms: () => calls.filter((c) => c.url.endsWith("/messages")), replies: () => calls.filter((c) => c.url.includes("/replies")) };
}
const env = { IG_ACCESS_TOKEN: "IGTOKEN123456", IG_USER_ID: "ME" };
const now = Date.parse("2026-10-23T12:00:00Z");
const quiet = () => {};
const ledgerOf = (root) => JSON.parse(fs.readFileSync(path.join(root, "data/connect.json"), "utf8"));

test("live: DM + respuesta pública a cada comentario (con paginación), y la segunda pasada no repite nada", async () => {
  const root = setup(), m = meta({ pages: [[C("c1", "ana")], [C("c2", "luis"), C("c3", "ana")]] });
  assert.equal((await runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet })).sent, 2);
  assert.equal(m.dms().length, 2); assert.equal(m.replies().length, 2);
  const body = JSON.parse(m.dms()[0].init.body);
  assert.deepEqual(body.recipient, { comment_id: "c1" }); assert.match(body.message.text, /example\.com\/demo/);
  assert.equal(m.dms()[0].init.headers.Authorization, "Bearer IGTOKEN123456"); assert.ok(!m.dms()[0].init.body.includes("IGTOKEN"));
  const saved = fs.readFileSync(path.join(root, "data/connect.json"), "utf8");
  assert.ok(!/c1|ana|id-ana/.test(saved)); // el registro es público: solo huellas HMAC
  const again = meta({ pages: [[C("c1", "ana")], [C("c2", "luis"), C("c3", "ana")]] });
  assert.equal((await runConnect({ root, env, fetchFn: again.fetchFn, now, log: quiet })).sent, 0);
  assert.equal(again.dms().length, 0);
});

test("test: solo responde a testers · off y STOP no llaman a Meta", async () => {
  const m = meta({ pages: [[C("c1", "ana"), C("c2", "Tester")]] });
  await runConnect({ root: setup({ mode: "test" }), env, fetchFn: m.fetchFn, now, log: quiet });
  assert.deepEqual(m.dms().map((c) => JSON.parse(c.init.body).recipient.comment_id), ["c2"]);
  for (const root of [setup({ mode: "off" }), setup({ stop: true })]) {
    const n = meta(); await runConnect({ root, env, fetchFn: n.fetchFn, now, log: quiet }); assert.equal(n.calls.length, 0);
  }
});

test("Reel de hace 2 semanas con comentario de hoy: se responde · Reel de hace más de 90 días: no se consulta", async () => {
  const m = meta();
  assert.equal((await runConnect({ root: setup({ runDate: "2026-10-09" }), env, fetchFn: m.fetchFn, now, log: quiet })).sent, 2);
  const old = meta();
  await runConnect({ root: setup({ runDate: "2026-07-01" }), env, fetchFn: old.fetchFn, now, log: quiet });
  assert.ok(!old.calls.some((c) => c.url.includes("/comments")));
});

test("error de un comentario: cuenta el fallo y sigue con los demás", async () => {
  const root = setup(), m = meta({ dm: (id) => (id === "c1" ? { error: { code: 100, message: "comment deleted" } } : {}) });
  const r = await runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet });
  assert.equal(r.sent, 1); assert.equal(r.failed, 1);
  assert.equal(ledgerOf(root)[key("c1")], 1); assert.equal(m.replies().length, 1); // sin DM no hay respuesta pública
});

test("token caducado o límite de Meta: corta la pasada sin culpar a los comentarios", async () => {
  const root = setup(), m = meta({ dm: () => ({ status: 400, error: { code: 190, message: "Error validating access token: IGTOKEN123456" } }) });
  await assert.rejects(runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet }), (e) => !e.message.includes("IGTOKEN123456"));
  assert.equal(m.dms().length, 1); assert.equal(ledgerOf(root)[key("c1")], undefined);
});

test("3 fallos seguidos: se para y avisa, pero los fallos cuentan y en la siguiente pasada va primero quien nunca falló", async () => {
  const pages = [[C("c1", "a"), C("c2", "b"), C("c3", "c"), C("c4", "d")]];
  const broken = new Set(["c1", "c2", "c3"]), dm = (id) => (broken.has(id) ? { error: { code: 100, message: "no se puede" } } : {});
  const root = setup();
  const m = meta({ pages, dm });
  await assert.rejects(runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet }), /3 fallos seguidos/);
  for (const id of ["c1", "c2", "c3"]) assert.equal(ledgerOf(root)[key(id)], 1);
  const m2 = meta({ pages, dm });
  await runConnect({ root, env, fetchFn: m2.fetchFn, now, log: quiet }).catch(() => {});
  assert.equal(JSON.parse(m2.dms()[0].init.body).recipient.comment_id, "c4"); // el válido ya no espera detrás de los rotos
  assert.equal(ledgerOf(root)[key("c4")], true);
  for (let i = 0; i < MAX_FAILS; i++) await runConnect({ root, env, fetchFn: meta({ pages, dm }).fetchFn, now, log: quiet }).catch(() => {});
  const last = meta({ pages, dm }); await runConnect({ root, env, fetchFn: last.fetchFn, now, log: quiet });
  assert.equal(last.dms().length, 0); // los rotos llegan a MAX_FAILS y se abandonan
});

test("un Reel borrado (#100 al leer comentarios) no impide responder en los demás", async () => {
  const root = setup();
  fs.writeFileSync(path.join(root, "data/runs/2026-10-22.json"), JSON.stringify({ date: "2026-10-22", episode: "ep1", platforms: { instagram: { id: "GONE" } } }));
  const m = meta();
  const r = await runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet });
  assert.equal(r.sent, 2); assert.equal(r.failed, 1);
});

test("comentario abandonado: otro comentario de la misma persona no recibe el recurso (pudo llegarle ya)", async () => {
  const root = setup({ ledger: { [key("c1")]: MAX_FAILS - 1 } });
  const pages = [[C("c1", "ana"), C("c9", "ana")]];
  const dm = (id) => (id === "c1" ? { error: { code: 100, message: "ya respondido" } } : {});
  await runConnect({ root, env, fetchFn: meta({ pages, dm }).fetchFn, now, log: quiet });
  const m = meta({ pages, dm }); await runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet });
  assert.equal(m.dms().length, 0);
});

test("permisos de la app (#200) cortan la pasada sin contar fallos", async () => {
  const root = setup(), m = meta({ dm: () => ({ status: 403, error: { code: 200, message: "Permissions error" } }) });
  await assert.rejects(runConnect({ root, env, fetchFn: m.fetchFn, now, log: quiet }), /corta la pasada/);
  assert.equal(m.dms().length, 1); assert.equal(ledgerOf(root)[key("c1")], undefined);
});

test("el resumen avisa de muestras pequeñas y no inventa métricas", () => {
  const s = summarize([{ views: 100, ig_reels_avg_watch_time: 9000, category: "espacio", hook: 69, duration_bucket: ">35s" }]);
  assert.equal(s.by_category.espacio.views, 100); assert.match(s.note, /hipótesis/);
  assert.equal(summarize([]).n, 0);
});
