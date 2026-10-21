// Pruebas de ATLAS: hora de Madrid (verano/invierno), idempotencia, reanudación, STOP, hora de publicación,
// fallo de una red sin afectar a la otra, y no duplicar publicaciones al reintentar.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { tick, madrid, loadRun, STEPS } from "../pipeline/orchestrator.mjs";

const sandbox = (over = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ce-"));
  fs.mkdirSync(path.join(root, "config"));
  fs.writeFileSync(path.join(root, "config/engine.json"), JSON.stringify({ publish_time: "07:00", platforms: { instagram: { enabled: true }, tiktok: { enabled: true } }, ...over }));
  return root;
};
const counter = () => { const n = {}; const steps = Object.fromEntries(STEPS.map((s) => [s, async () => { n[s] = (n[s] ?? 0) + 1; }])); return { n, steps }; };
const pubs = (calls, fail = {}) => ({
  instagram: async () => { calls.push("ig"); if (fail.ig) throw new Error("red caída"); return { id: "ig1", permalink: "https://instagram.com/reel/x" }; },
  tiktok: async () => { calls.push("tt"); if (fail.tt) throw new Error("token caducado"); return { id: "tt1" }; },
});
const at = (iso) => new Date(iso);

test("madrid() respeta horario de verano e invierno", () => {
  assert.deepEqual(madrid(at("2026-10-20T05:00:00Z")), { date: "2026-10-20", minutes: 7 * 60 }); // CEST UTC+2
  assert.deepEqual(madrid(at("2026-11-02T06:00:00Z")), { date: "2026-11-02", minutes: 7 * 60 }); // CET UTC+1
  assert.equal(madrid(at("2026-10-20T23:30:00Z")).date, "2026-10-21");
});

test("no publica antes de las 07:00 de Madrid, pero deja el vídeo READY", async () => {
  const root = sandbox(); const { steps } = counter(); const calls = [];
  const run = await tick({ root, date: "2026-10-21", now: at("2026-10-21T04:30:00Z"), steps, publishers: pubs(calls) });
  assert.equal(run.state, "READY"); assert.deepEqual(calls, []);
});

test("un vídeo preparado para mañana no se publica hoy", async () => {
  const root = sandbox(); const { steps } = counter(); const calls = [];
  const run = await tick({ root, date: "2026-10-22", now: at("2026-10-21T12:00:00Z"), steps, publishers: pubs(calls) });
  assert.equal(run.state, "READY"); assert.deepEqual(calls, []);
});

test("publica a las 07:00 en ambas redes y una segunda pasada no repite nada", async () => {
  const root = sandbox(); const { n, steps } = counter(); const calls = [];
  const opts = { root, date: "2026-10-21", now: at("2026-10-21T05:01:00Z"), steps, publishers: pubs(calls) };
  assert.equal((await tick(opts)).state, "PUBLISHED");
  assert.equal((await tick(opts)).state, "PUBLISHED");
  assert.deepEqual(calls, ["ig", "tt"]);
  assert.ok(STEPS.every((s) => n[s] === 1));
});

test("un paso que falla se reanuda sin repetir los anteriores y escala tras 3 intentos", async () => {
  const root = sandbox(); const { n, steps } = counter(); const alerts = [];
  steps.VOICE = async () => { n.VOICE = (n.VOICE ?? 0) + 1; throw new Error("motor de voz caído"); };
  const opts = { root, date: "2026-10-21", now: at("2026-10-21T03:00:00Z"), steps, publishers: pubs([]), alert: async (m) => alerts.push(m) };
  assert.equal((await tick(opts)).state, "FAILED");
  await tick(opts);
  const run = await tick(opts);
  assert.equal(run.state, "NEEDS_ATTENTION");
  assert.equal(n.RESEARCHING, 1); assert.equal(n.VOICE, 3); assert.equal(alerts.length, 1);
  assert.equal((await tick(opts)).state, "NEEDS_ATTENTION"); // no insiste
  assert.equal(n.VOICE, 3);
});

test("STOP impide producir y publicar", async () => {
  const root = sandbox(); const { n, steps } = counter(); const calls = [];
  fs.mkdirSync(path.join(root, "data")); fs.writeFileSync(path.join(root, "data/STOP"), "");
  const run = await tick({ root, date: "2026-10-21", now: at("2026-10-21T06:00:00Z"), steps, publishers: pubs(calls) });
  assert.equal(run.state, "STOPPED"); assert.deepEqual(calls, []); assert.equal(Object.keys(n).length, 0);
});

test("si TikTok falla, Instagram queda publicado y no se republica al reintentar", async () => {
  const root = sandbox(); const { steps } = counter(); const calls = [];
  const opts = { root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs(calls, { tt: true }) };
  await tick(opts); await tick(opts);
  const run = loadRun(root, "2026-10-21");
  assert.equal(run.platforms.instagram.status, "published");
  assert.equal(run.platforms.tiktok.status, "failed");
  assert.deepEqual(calls, ["ig", "tt", "tt"]);
});

test("una red desactivada no bloquea el estado PUBLISHED", async () => {
  const root = sandbox({ platforms: { instagram: { enabled: true }, tiktok: { enabled: false } } }); const { steps } = counter(); const calls = [];
  const run = await tick({ root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs(calls) });
  assert.equal(run.state, "PUBLISHED"); assert.deepEqual(calls, ["ig"]); assert.equal(run.platforms.tiktok.status, "disabled");
});

test("una red desactivada y reactivada el mismo día vuelve a publicar", async () => {
  const root = sandbox({ platforms: { instagram: { enabled: true }, tiktok: { enabled: false } } }); const { steps } = counter(); const calls = [];
  const opts = { root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs(calls) };
  await tick(opts);
  fs.writeFileSync(path.join(root, "config/engine.json"), JSON.stringify({ publish_time: "07:00", platforms: { instagram: { enabled: true }, tiktok: { enabled: true } } }));
  const run = await tick(opts);
  assert.equal(run.state, "PUBLISHED"); assert.deepEqual(calls, ["ig", "tt"]);
});

test("avisa al primer fallo de publicación (no solo al tercero)", async () => {
  const root = sandbox(); const { steps } = counter(); const alerts = [];
  await tick({ root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs([], { ig: true }), alert: async (m) => alerts.push(m) });
  assert.equal(alerts.length, 1); assert.match(alerts[0], /instagram/);
});

test("rechaza fechas inválidas (evita escribir fuera de data/runs)", async () => {
  const root = sandbox(); const { steps } = counter();
  await assert.rejects(tick({ root, date: "../../x", steps, publishers: pubs([]) }), /fecha inválida/);
});

test("publicación agotada en una red → NEEDS_ATTENTION (no se queda READY sin avanzar)", async () => {
  const root = sandbox(); const { steps } = counter(); const calls = [];
  let run;
  for (let i = 0; i < 4; i++) run = await tick({ root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs(calls, { tt: true }) });
  assert.equal(run.state, "NEEDS_ATTENTION");
  assert.equal(run.platforms.instagram.status, "published");
  assert.equal(calls.filter((c) => c === "tt").length, 3);
});

test("STOP retirado: el run STOPPED continúa y publica", async () => {
  const root = sandbox(); const { steps } = counter(); const calls = [];
  fs.mkdirSync(path.join(root, "data"), { recursive: true }); fs.writeFileSync(path.join(root, "data/STOP"), "x");
  assert.equal((await tick({ root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs(calls) })).state, "STOPPED");
  fs.rmSync(path.join(root, "data/STOP"));
  assert.equal((await tick({ root, date: "2026-10-21", now: at("2026-10-21T05:10:00Z"), steps, publishers: pubs(calls) })).state, "PUBLISHED");
});

test("stages: cada job hace solo sus pasos y para sin gastar intento en el primero ajeno", async () => {
  const root = sandbox(); const { n, steps } = counter(); const calls = [];
  const opts = { root, date: "2026-10-21", now: at("2026-10-21T06:00:00Z"), steps, publishers: pubs(calls), publish: false };
  let run = await tick({ ...opts, stages: ["RESEARCHING", "SCRIPTING"] });
  assert.equal(run.state, "VOICE"); assert.equal(n.VOICE, undefined); assert.equal(run.steps.VOICE.attempts, 0);
  run = await tick({ ...opts, stages: ["VOICE", "RENDERING", "QUALITY_CHECK"] });
  assert.equal(run.state, "VISUAL_REVIEW"); assert.equal(n.RESEARCHING, 1);
  run = await tick({ ...opts, stages: ["VISUAL_REVIEW"] });
  assert.equal(run.state, "READY"); assert.deepEqual(calls, []);
});
