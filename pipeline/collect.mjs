// Paso de testigo entre los jobs de produce.yml: cada job descarga el artefacto del anterior en una carpeta aparte y
// solo copia al repo lo esperado para el día, con nombre válido, archivo normal y tamaño acotado (nada de .claude/,
// pipeline/ ni enlaces). En los jobs anteriores escribió el modelo o se compiló su código; aquí no se ejecuta nada de eso.
// Uso: node pipeline/collect.mjs <dir-del-artefacto> <YYYY-MM-DD> <último paso propio: SCRIPTING|QUALITY_CHECK|VISUAL_REVIEW>
import fs from "node:fs";
import path from "node:path";
import { ROOT, STEPS, validDate, loadRun, saveRun } from "./orchestrator.mjs";
import { sceneSafety } from "./check-episode.mjs";

const MB = 1024 * 1024;
const file = (src, rel, max) => {
  const f = path.join(src, rel);
  if (!fs.existsSync(f)) return null;
  const st = fs.lstatSync(f);
  if (!st.isFile()) throw new Error(`no es un archivo normal: ${rel}`);
  if (st.size > max) throw new Error(`demasiado grande: ${rel} (${st.size} B)`);
  return f;
};

// lastOwned: último paso que pudieron hacer los jobs que generaron el artefacto. Los pasos posteriores (y las redes)
// se toman del repo, nunca del artefacto: el job build no puede dar por hecha la revisión visual ni una publicación.
export function collect(src, date, dest, lastOwned) {
  if (!validDate(date)) throw new Error("fecha inválida (YYYY-MM-DD)");
  if (!STEPS.includes(lastOwned)) throw new Error(`paso desconocido: ${lastOwned}`);
  const runRel = `data/runs/${date}.json`;
  const runF = file(src, runRel, MB);
  if (!runF) throw new Error(`falta ${runRel} en el artefacto`);
  const run = JSON.parse(fs.readFileSync(runF, "utf8"));
  if (run.date !== date) throw new Error("el run no corresponde a la fecha");
  const ep = run.episode;
  if (ep != null && !/^[a-z0-9-]{1,64}$/.test(ep)) throw new Error("id de episodio inválido");
  const trusted = loadRun(dest, date);
  run.steps ??= {};
  for (const s of STEPS.slice(STEPS.indexOf(lastOwned) + 1)) { if (trusted.steps[s]) run.steps[s] = trusted.steps[s]; else delete run.steps[s]; }
  run.platforms = trusted.platforms;
  if (lastOwned !== "VISUAL_REVIEW") run.quality = trusted.quality;
  const next = STEPS.find((s) => run.steps[s]?.status !== "done");
  if (next && ["READY", "PUBLISHING", "PUBLISHED"].includes(run.state)) run.state = next;

  const want = [[`data/candidates/${date}.json`, MB], ["data/alerts/pending.md", MB], ["data/queue/ideas.md", MB]]; // la cola de ideas la mantiene NOVA
  if (ep) {
    want.push([`public/audio/${ep}.json`, MB], [`public/audio/${ep}.qa.json`, MB], [`public/audio/${ep}.mp3`, 10 * MB],
      [`public/music/${ep}.wav`, 30 * MB], [`work/${ep}/${ep}.mp4`, 64 * MB], [`work/${ep}/quality.json`, MB]);
    const framesDir = path.join(src, "work/frames", ep); // para el job "review" (work/ no se versiona)
    if (fs.existsSync(framesDir)) for (const n of fs.readdirSync(framesDir).slice(0, 40)) if (/^(t\d{1,3}\.\d|hoja)\.png$/.test(n)) want.push([`work/frames/${ep}/${n}`, 10 * MB]);
    const epDir = path.join(src, "episodes", ep);
    if (fs.existsSync(epDir)) for (const n of fs.readdirSync(epDir).slice(0, 20)) {
      if (!/^[\w.-]+\.(json|md|txt)$/.test(n)) throw new Error(`archivo no permitido en episodes/${ep}: ${n}`);
      want.push([`episodes/${ep}/${n}`, MB]);
    }
    const sceneDir = path.join(src, "remotion/src/episodes");
    if (fs.existsSync(sceneDir)) {
      const scenes = fs.readdirSync(sceneDir).filter((n) => /^[A-Za-z0-9_-]+\.tsx$/.test(n) && file(src, `remotion/src/episodes/${n}`, MB)
        && fs.readFileSync(path.join(sceneDir, n), "utf8").includes(`export const id = "${ep}"`));
      if (scenes.length > 1) throw new Error(`varias escenas con el id ${ep}`);
      if (scenes[0]) {
        const bad = sceneSafety(sceneDir, scenes[0]);
        if (bad.length) throw new Error(`escena rechazada: ${bad.join(" | ")}`);
        want.push([`remotion/src/episodes/${scenes[0]}`, MB]);
      }
    }
  }
  saveRun(dest, run);
  const copied = [runRel];
  for (const [rel, max] of want) {
    const f = file(src, rel, max);
    if (!f) continue;
    fs.mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true });
    fs.copyFileSync(f, path.join(dest, rel));
    copied.push(rel);
  }
  return copied;
}

if (process.argv[1]?.endsWith("collect.mjs")) {
  const [src, date, lastOwned] = process.argv.slice(2);
  for (const rel of collect(path.resolve(src), date, ROOT, lastOwned)) console.log(`[collect] ${rel}`);
}
