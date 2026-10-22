// Reglas del episodio y puerta horaria: plantilla 100 válida, declaración de IA en texto y ventana según publish_time.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkSpec, hookNumbers } from "../pipeline/check-episode.mjs";
import os from "node:os";
import path from "node:path";
import { windowFor, started, nextDay } from "../pipeline/madrid-gate.mjs";
import { madrid, saveRun, loadRun } from "../pipeline/orchestrator.mjs";

const pilot = () => JSON.parse(fs.readFileSync(new URL("../episodes/venus-pilot/episode.json", import.meta.url), "utf8"));

// hooks.md es contenido de pago: no está en el repo público (en Actions llega del secreto HOOKS_MD)
const noHooks = !fs.existsSync(new URL("../assets/hooks/hooks.md", import.meta.url)) && "assets/hooks/hooks.md no está (privado)";

test("el banco de ganchos incluye la plantilla 100 y el piloto es válido", { skip: noHooks }, () => {
  const h = hookNumbers(); assert.equal(h.size, 100); assert.ok(h.has(100));
  assert.deepEqual(checkSpec(pilot(), h), []);
});

test("sin «generada con IA» en la caption de Instagram, el episodio no pasa", () => {
  const ep = pilot(); ep.publication.instagram.caption = ep.publication.instagram.caption.replace(/Voz generada con IA\./, "");
  assert.ok(checkSpec(ep, new Set(Array.from({ length: 100 }, (_, i) => i + 1))).some((e) => /caption de Instagram/.test(e)));
});

test("la ventana de publicación sigue a publish_time", () => {
  assert.deepEqual(windowFor(["--publish-window"], { publish_time: "07:00" }), [360, 600]);
  assert.deepEqual(windowFor(["--publish-window"], { publish_time: "08:30" }), [450, 690]);
  assert.deepEqual(windowFor(["--window", "04:00-05:15"], {}), [240, 315]);
});

// Cron real de publish.yml (horas UTC leídas del workflow) cruzado con la ventana, en verano y en invierno
const [h0, h1] = fs.readFileSync(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8").match(/cron: "57 (\d+)-(\d+) \* \* \*"/).slice(1).map(Number);
const HOURS = Array.from({ length: h1 - h0 + 1 }, (_, i) => h0 + i);
const passes = (day, publish_time) => {
  const [a, b] = windowFor(["--publish-window"], { publish_time });
  return HOURS.map((h) => madrid(new Date(`${day}T${String(h).padStart(2, "0")}:57:00Z`))).filter((m) => m.minutes >= a && m.minutes <= b).map((m) => m.minutes);
};
test("con el cron horario hay una pasada justo antes de la hora y reintentos después (verano e invierno)", () => {
  for (const day of ["2026-10-21", "2026-11-10"]) for (const pt of [JSON.parse(fs.readFileSync(new URL("../config/engine.json", import.meta.url), "utf8")).publish_time, "08:00", "09:00"]) {
    const p = Number(pt.slice(0, 2)) * 60 + Number(pt.slice(3)); const got = passes(day, pt);
    assert.equal(got.filter((x) => x < p && x >= p - 60).length, 1, `${day} ${pt}: una pasada previa`);
    assert.ok(got.filter((x) => x > p).length >= 2, `${day} ${pt}: al menos 2 reintentos`);
  }
});

// Cron real de produce.yml (vídeo de mañana): con la primera pasada retrasada o perdida, alguna de respaldo cae en la ventana
const PROD = fs.readFileSync(new URL("../.github/workflows/produce.yml", import.meta.url), "utf8");
const prodCrons = [...PROD.matchAll(/cron: "(\d+) (\d+) \* \* \*"/g)].map((m) => [Number(m[2]), Number(m[1])]);
const [pa, pb] = windowFor(["--window", PROD.match(/--window (\S+)/)[1]], {});
test("produce: si se pierde la pasada de las 10:30 quedan al menos 3 de respaldo en la ventana (verano e invierno)", () => {
  for (const day of ["2026-10-21", "2026-11-10"]) {
    const ins = prodCrons.map(([h, mi]) => madrid(new Date(`${day}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00Z`)).minutes).filter((x) => x >= pa && x <= pb);
    assert.ok(ins.some((x) => x >= 600 && x <= 660), `${day}: una pasada a media mañana`);
    assert.ok(ins.filter((x) => x > 660).length >= 3, `${day}: respaldos`);
    assert.ok(Math.max(...ins) <= 21 * 60, `${day}: la última empieza antes de las 21:00`);
  }
});

test("--once: el día cuenta como empezado solo cuando la producción ha registrado algún paso", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ce-gate-"));
  assert.equal(started(root, "2026-10-22"), false);
  saveRun(root, { ...loadRun(root, "2026-10-22"), state: "NONE" });   // p. ej. un publish sin vídeo
  assert.equal(started(root, "2026-10-22"), false);
  const r = loadRun(root, "2026-10-22"); r.steps.RESEARCHING = { status: "running", attempts: 1 }; saveRun(root, r);
  assert.equal(started(root, "2026-10-22"), true);
});

test("--next: el run de produce es el del día siguiente (también en fin de mes y cambio de hora)", () => {
  assert.equal(nextDay("2026-10-22"), "2026-10-23");
  assert.equal(nextDay("2026-10-31"), "2026-11-01");
  assert.equal(nextDay("2026-10-24"), "2026-10-25");
  assert.equal(nextDay("2026-12-31"), "2027-01-01");
});
