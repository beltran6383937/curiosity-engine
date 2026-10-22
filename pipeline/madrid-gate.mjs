// Puerta de los cron de GitHub (UTC): imprime go=true|false y date=<YYYY-MM-DD de Madrid> para $GITHUB_OUTPUT.
// go=false si estamos fuera de la ventana horaria de Madrid o si existe data/STOP. --force ignora la ventana (no el STOP).
// --once: go=false si la producción de hoy ya empezó (data/runs/<fecha>.json con algún paso). Así los cron de respaldo
// de produce.yml cubren el cron que GitHub retrasa horas o se salta, sin producir dos veces. --force también lo ignora.
// --next: el run es el de MAÑANA (produce.yml hace la víspera el vídeo que publish.yml saca a primera hora).
// --window HH:MM-HH:MM fija la ventana; --publish-window la calcula de publish_time (de 60 min antes a 3 h después):
// los cron horarios de publish.yml siguen a la config sin tocar el workflow, y las pasadas de después reintentan
// (fallo pasajero o vídeo que llega tarde).
import { madrid, stopped, loadConfig, loadRun, ROOT } from "./orchestrator.mjs";
const toMin = (x) => { const [h, m] = x.split(":").map(Number); return h * 60 + m; };
export function windowFor(argv, cfg) {
  if (argv.includes("--publish-window")) { const p = toMin(cfg.publish_time); return [p - 60, p + 180]; }
  const i = argv.indexOf("--window");
  return (i >= 0 ? argv[i + 1] : "00:00-23:59").split("-").map(toMin);
}
export const started = (root, date) => Object.keys(loadRun(root, date).steps ?? {}).length > 0;
export const nextDay = (date) => new Date(Date.parse(`${date}T12:00:00Z`) + 864e5).toISOString().slice(0, 10);
if (process.argv[1]?.endsWith("madrid-gate.mjs")) {
  const [a, b] = windowFor(process.argv, loadConfig());
  const m = madrid();
  const inWindow = m.minutes >= a && m.minutes <= b;
  const force = process.argv.includes("--force");
  const date = process.argv.includes("--next") ? nextDay(m.date) : m.date;
  const done = process.argv.includes("--once") && started(ROOT, date);
  const go = !stopped() && (force || (inWindow && !done));
  console.log(`go=${go}`); console.log(`date=${date}`);
  console.error(`[gate] run ${date} · Madrid ${m.date} ${String(Math.floor(m.minutes / 60)).padStart(2, "0")}:${String(m.minutes % 60).padStart(2, "0")} · ventana ${inWindow} · ya empezado ${done} · STOP ${stopped()} → ${go}`);
}
