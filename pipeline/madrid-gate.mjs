// Puerta de los cron de GitHub (UTC): imprime go=true|false y date=<YYYY-MM-DD de Madrid> para $GITHUB_OUTPUT.
// go=false si estamos fuera de la ventana horaria de Madrid o si existe data/STOP. --force ignora la ventana (no el STOP).
// --window HH:MM-HH:MM fija la ventana; --publish-window la calcula de publish_time (de 60 min antes a 3 h después):
// los cron horarios de publish.yml siguen a la config sin tocar el workflow, y las pasadas de después reintentan
// (fallo pasajero o vídeo que llega tarde).
import { madrid, stopped, loadConfig } from "./orchestrator.mjs";
const toMin = (x) => { const [h, m] = x.split(":").map(Number); return h * 60 + m; };
export function windowFor(argv, cfg) {
  if (argv.includes("--publish-window")) { const p = toMin(cfg.publish_time); return [p - 60, p + 180]; }
  const i = argv.indexOf("--window");
  return (i >= 0 ? argv[i + 1] : "00:00-23:59").split("-").map(toMin);
}
if (process.argv[1]?.endsWith("madrid-gate.mjs")) {
  const [a, b] = windowFor(process.argv, loadConfig());
  const m = madrid();
  const inWindow = m.minutes >= a && m.minutes <= b;
  const go = !stopped() && (inWindow || process.argv.includes("--force"));
  console.log(`go=${go}`); console.log(`date=${m.date}`);
  console.error(`[gate] Madrid ${m.date} ${String(Math.floor(m.minutes / 60)).padStart(2, "0")}:${String(m.minutes % 60).padStart(2, "0")} · ventana ${inWindow} · STOP ${stopped()} → ${go}`);
}
