// ATLAS · orquestador diario. Máquina de estados persistida en data/runs/<fecha>.json: cada paso es idempotente
// (si ya está "done" no se repite) y el run se reanuda tras un fallo o reinicio sin rehacer lo terminado.
// Publicación: solo con estado READY, a partir de la hora objetivo (Europe/Madrid), una vez por red y nunca con STOP.
// CLI: pipeline/atlas.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { redact } from "./publishers.mjs";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const STEPS = ["RESEARCHING", "SCRIPTING", "VOICE", "RENDERING", "QUALITY_CHECK", "VISUAL_REVIEW"];
export const PLATFORMS = ["instagram", "tiktok"];

// Hora de Madrid sin desfases de horario de verano: Intl resuelve CET/CEST.
export const madrid = (d = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d).filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
};

export const loadConfig = (root = ROOT) => JSON.parse(fs.readFileSync(path.join(root, "config/engine.json"), "utf8"));
export const stopped = (root = ROOT, env = process.env) => env.CE_STOP === "1" || fs.existsSync(path.join(root, "data/STOP"));

export const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d ?? "") && !Number.isNaN(Date.parse(d));
export const runPath = (root, date) => {
  if (!validDate(date)) throw new Error(`fecha inválida: ${String(date).slice(0, 40)} (YYYY-MM-DD)`); // también evita rutas fuera de data/runs
  return path.join(root, "data/runs", `${date}.json`);
};
export const loadRun = (root, date) => {
  const f = runPath(root, date);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  return { date, state: "PENDING", episode: null, steps: {}, platforms: Object.fromEntries(PLATFORMS.map((p) => [p, { status: "pending", attempts: 0 }])), log: [] };
};
export const saveRun = (root, run) => {
  const f = runPath(root, run.date);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + ".tmp", JSON.stringify(run, null, 1)); // escritura atómica: un corte no deja el JSON a medias
  fs.renameSync(f + ".tmp", f);
};
const note = (run, msg) => { run.log.push({ at: new Date().toISOString(), msg }); console.log(`[ATLAS] ${msg}`); };

// steps: { NAME: async (run) => void } · publishers: { instagram: async (run) => {id, permalink}, ... } · alert: async (msg) => void
// stages: pasos que puede hacer ESTE job (aislamiento: el modelo, la compilación y los tokens van en jobs distintos).
// Al llegar a un paso pendiente que no es suyo, el job para sin gastar intento; lo hace el job siguiente.
export async function tick({ root = ROOT, date, now = new Date(), steps, publishers, alert = async () => {}, env = process.env, maxAttempts = 3, maxPublishAttempts = 3, publish = true, stages }) {
  const cfg = loadConfig(root);
  const m = madrid(now);
  date ??= m.date;
  const run = loadRun(root, date);
  if (stopped(root, env)) { note(run, "STOP activo: no se produce ni se publica"); run.state = "STOPPED"; saveRun(root, run); return run; }
  if (run.state === "NEEDS_ATTENTION") return run; // esperando a una persona; no insistir

  for (const name of STEPS) {
    const st = (run.steps[name] ??= { status: "pending", attempts: 0 });
    if (st.status === "done") continue;
    if (stages && !stages.includes(name)) { run.state = name; saveRun(root, run); return run; }
    run.state = name; st.attempts++; st.startedAt = new Date().toISOString(); saveRun(root, run);
    try {
      await steps[name](run);
      st.status = "done"; st.doneAt = new Date().toISOString(); delete st.error;
      note(run, `${name} ok`);
      saveRun(root, run);
    } catch (e) {
      st.status = "failed"; st.error = redact(String(e?.message ?? e)).slice(0, 500); // data/ se sube a git
      if (st.attempts >= maxAttempts) { run.state = "NEEDS_ATTENTION"; await alert(`${date}: ${name} falló ${st.attempts} veces: ${st.error}`); }
      else run.state = "FAILED";
      note(run, `${name} falló (${st.attempts}/${maxAttempts}): ${st.error}`);
      saveRun(root, run);
      return run;
    }
  }
  run.state = "READY";
  if (!publish) { saveRun(root, run); return run; }
  const [hh, mm] = cfg.publish_time.split(":").map(Number);
  const due = m.date > date || (m.date === date && m.minutes >= hh * 60 + mm); // las fechas ISO se comparan como texto
  if (!due) { note(run, `listo; se publica a las ${cfg.publish_time} (Madrid)`); saveRun(root, run); return run; }

  for (const p of PLATFORMS) {
    const ps = run.platforms[p];
    if (!cfg.platforms[p]?.enabled) { if (ps.status !== "published") ps.status = "disabled"; continue; }
    if (ps.status === "disabled") ps.status = "pending"; // se reactivó en la config
    if (ps.status === "published" || ps.attempts >= maxPublishAttempts) continue;
    if (stopped(root, env)) { note(run, "STOP activado durante la publicación: no se publica"); run.state = "STOPPED"; saveRun(root, run); return run; }
    run.state = "PUBLISHING"; ps.attempts++; saveRun(root, run);
    try {
      const r = await publishers[p](run, ps); // el publicador guarda ps.containerId antes de publicar para no duplicar al reintentar
      Object.assign(ps, { status: "published", ...r, publishedAt: new Date().toISOString() }); delete ps.error;
      note(run, `${p} publicado: ${r.permalink ?? r.id}`);
    } catch (e) {
      ps.status = "failed"; ps.error = redact(String(e?.message ?? e)).slice(0, 500);
      note(run, `${p} falló (${ps.attempts}/${maxPublishAttempts}): ${ps.error}`);
      if (ps.attempts === 1 || ps.attempts >= maxPublishAttempts) await alert(`${date}: publicación en ${p} falló (intento ${ps.attempts}/${maxPublishAttempts}): ${ps.error}`);
    }
    saveRun(root, run);
  }
  const all = PLATFORMS.every((p) => ["published", "disabled"].includes(run.platforms[p].status));
  const exhausted = PLATFORMS.some((p) => cfg.platforms[p]?.enabled && run.platforms[p].status !== "published" && run.platforms[p].attempts >= maxPublishAttempts);
  run.state = all ? "PUBLISHED" : exhausted ? "NEEDS_ATTENTION" : run.state === "PUBLISHING" ? "PUBLISHING" : run.state; // agotado: lo recupera una persona
  saveRun(root, run);
  return run;
}

// Pasos reales: cada uno lanza su herramienta. La investigación y el guion los hace Claude Code headless con los agentes de agents/.
export const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
