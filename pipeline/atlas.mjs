// CLI de ATLAS. Uso: node pipeline/atlas.mjs [--date YYYY-MM-DD] [--dry-run] [--no-publish | --publish-only] [--stages A,B]
// --no-publish: produce hasta READY (job de las 04:30) · --publish-only: no produce nada, solo publica lo que esté READY.
// --dry-run produce todo pero sustituye la publicación por un simulacro (no toca las redes).
// --stages: solo esos pasos (cada job de produce.yml hace los suyos); al llegar a uno ajeno termina con éxito.
import { tick, validDate, STEPS } from "./orchestrator.mjs";
import { realSteps, realPublishers, alert } from "./steps.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const dry = process.argv.includes("--dry-run");
if (arg("--date") !== undefined && !validDate(arg("--date"))) { console.error("--date debe ser YYYY-MM-DD"); process.exit(2); }
const stages = arg("--stages")?.split(",");
if (stages && !stages.every((s) => STEPS.includes(s))) { console.error(`--stages: pasos válidos ${STEPS.join(",")}`); process.exit(2); }
const publishers = dry ? { instagram: async () => ({ id: "dry-run" }), tiktok: async () => ({ id: "dry-run" }) } : realPublishers;
const only = process.argv.includes("--publish-only");
const steps = only ? Object.fromEntries(Object.keys(realSteps).map((k) => [k, async () => { throw new Error(`${k} no terminado: el job de publicación no produce`); }])) : realSteps;
const foreign = (s) => stages && STEPS.includes(s) && !stages.includes(s); // paso pendiente de otro job
// Varias pasadas dentro del mismo job: un paso fallido se reintenta ya (no al día siguiente), con el tope de intentos de ATLAS.
let run;
for (let i = 0; i < 6; i++) {
  run = await tick({ date: arg("--date"), steps, publishers, alert, stages, publish: !stages && !process.argv.includes("--no-publish") });
  if (["READY", "PUBLISHED", "NEEDS_ATTENTION", "STOPPED"].includes(run.state) || foreign(run.state) || only) break;
}
console.log(`[ATLAS] estado final: ${run.state}`);
// El job de publicación falla (rojo en GitHub) si no queda todo publicado; el de producción, si no llega a READY
// (o, con --stages, si no termina sus pasos).
process.exitCode = only ? (["PUBLISHED", "STOPPED"].includes(run.state) ? 0 : 1)
  : stages ? (["READY", "STOPPED"].includes(run.state) || foreign(run.state) ? 0 : 1)
  : (["FAILED", "NEEDS_ATTENTION"].includes(run.state) ? 1 : 0);
