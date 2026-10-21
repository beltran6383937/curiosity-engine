// Paso de testigo entre jobs: solo entran rutas esperadas del día; nada de .claude/, pipeline/, enlaces ni escenas peligrosas.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { collect } from "../pipeline/collect.mjs";

const put = (root, rel, body) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), body); };
const artifact = (scene = 'import React from "react";\nexport const id = "ep-1";') => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), "ce-src-"));
  put(src, "data/runs/2026-10-21.json", JSON.stringify({ date: "2026-10-21", episode: "ep-1" }));
  put(src, "episodes/ep-1/episode.json", "{}");
  put(src, "remotion/src/episodes/Eep1.tsx", scene);
  put(src, "work/ep-1/ep-1.mp4", "v");
  put(src, ".claude/settings.json", '{"hooks":{}}');
  put(src, "pipeline/steps.mjs", "malicioso");
  return src;
};

test("collect copia lo esperado y descarta el resto", () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "ce-dst-"));
  const got = collect(artifact(), "2026-10-21", dest, "VISUAL_REVIEW");
  assert.deepEqual(got.sort(), ["data/runs/2026-10-21.json", "episodes/ep-1/episode.json", "remotion/src/episodes/Eep1.tsx", "work/ep-1/ep-1.mp4"]);
  assert.ok(!fs.existsSync(path.join(dest, ".claude")) && !fs.existsSync(path.join(dest, "pipeline")));
});

test("collect rechaza escenas con código peligroso, ids raros y fechas que no cuadran", () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "ce-dst-"));
  assert.throws(() => collect(artifact('import x from /*c*/ "!!./a.cjs!./b";\nexport const id = "ep-1";'), "2026-10-21", dest, "SCRIPTING"), /escena rechazada/);
  const src = artifact();
  assert.throws(() => collect(src, "2026-10-22", dest, "SCRIPTING"), /falta/);
  put(src, "data/runs/2026-10-21.json", JSON.stringify({ date: "2026-10-21", episode: "../../x" }));
  assert.throws(() => collect(src, "2026-10-21", dest, "SCRIPTING"), /inválido/);
});

test("el job build no puede dar por hecha la revisión visual ni una publicación", () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "ce-dst-"));
  const src = artifact(); const done = { status: "done", attempts: 1 };
  put(src, "data/runs/2026-10-21.json", JSON.stringify({ date: "2026-10-21", episode: "ep-1", state: "READY", quality: 100,
    steps: { RESEARCHING: done, SCRIPTING: done, VOICE: done, RENDERING: done, QUALITY_CHECK: done, VISUAL_REVIEW: done },
    platforms: { instagram: { status: "published" }, tiktok: { status: "published" } } }));
  collect(src, "2026-10-21", dest, "QUALITY_CHECK");
  const run = JSON.parse(fs.readFileSync(path.join(dest, "data/runs/2026-10-21.json"), "utf8"));
  assert.equal(run.steps.VISUAL_REVIEW, undefined); assert.equal(run.state, "VISUAL_REVIEW"); assert.equal(run.quality, undefined);
  assert.equal(run.platforms.instagram.status, "pending");
});

test("sceneSafety: un import con comentario o una ruta profunda no pasan", async () => {
  const { sceneSafety } = await import("../pipeline/check-episode.mjs");
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "ce-sc-"));
  for (const bad of ['import S from /*x*/ "!!../../a!./b";', 'import S from // x\n "../../../episodes/e/l.txt";', 'const m = import /**/ ("x");']) {
    fs.writeFileSync(path.join(d, "A.tsx"), bad); assert.ok(sceneSafety(d, "A.tsx").length > 0, bad);
  }
  fs.writeFileSync(path.join(d, "A.tsx"), 'import React from "react";\nimport { k } from "../kit";\n{/* comentario */}');
  assert.deepEqual(sceneSafety(d, "A.tsx"), []);
});
