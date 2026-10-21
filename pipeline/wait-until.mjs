// Espera hasta HH:MM de Madrid (por defecto publish_time de config/engine.json; máx. 60 min; si ya pasó, sale al instante).
// Uso: node pipeline/wait-until.mjs [HH:MM]
import { madrid, loadConfig } from "./orchestrator.mjs";
const at = process.argv[2] ?? loadConfig().publish_time;
const [h, mi] = at.split(":").map(Number);
const left = (h * 60 + mi - madrid().minutes) * 60e3 - new Date().getSeconds() * 1e3;
if (left > 0 && left <= 60 * 60e3) { console.log(`esperando ${Math.round(left / 1e3)} s hasta las ${at}`); await new Promise((r) => setTimeout(r, left)); }
