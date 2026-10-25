// Sube un MP4 a la BANDEJA de TikTok de Beltrán (borrador: él lo termina en la app y marca «Contenido generado por IA").
// Renueva el token con el de refresco y guarda los nuevos en .env sin imprimirlos. Uso: node ratopin-universe/tools/subir-tiktok.mjs <video.mp4>
import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { refreshTikTok } from "../../pipeline/tokens.mjs";
import { publishTikTok } from "../../pipeline/publishers.mjs";

const ENV = path.resolve(import.meta.dirname, "../../.env");
const video = path.resolve(process.argv[2] ?? "");
if (!fs.existsSync(video)) { console.error("Uso: node ratopin-universe/tools/subir-tiktok.mjs <video.mp4>"); process.exit(1); }
const text = fs.readFileSync(ENV, "utf8"), env = parseEnv(text);
const t = await refreshTikTok({ env });
let out = text;
const nuevos = { TIKTOK_ACCESS_TOKEN: t.access, ...(t.refresh ? { TIKTOK_REFRESH_TOKEN: t.refresh } : {}) };
for (const [k, v] of Object.entries(nuevos)) {
  const re = new RegExp(`^${k}=.*$`, "gm");
  out = re.test(out) ? out.replace(re, () => `${k}=${v}`) : out.replace(/\n?$/, `\n${k}=${v}\n`);
}
// solo se guarda si el .env resultante da exactamente los tokens nuevos y el resto de claves sin tocar
const antes = parseEnv(text), despues = parseEnv(out);
const ok = Object.keys({ ...antes, ...despues }).every((k) => despues[k] === (k in nuevos ? nuevos[k] : antes[k]));
if (ok) fs.writeFileSync(ENV, out);
else console.error("AVISO: no se pudo guardar el token renovado en .env sin tocar otras claves; revísalo a mano.");
const ps = {};
const r = await publishTikTok({ video, caption: "", ps, save: () => {}, env: { ...env, TIKTOK_ACCESS_TOKEN: t.access }, mode: "inbox" });
console.log(r.inbox ? "En la bandeja de TikTok (borrador)." : `Estado: ${JSON.stringify(r)}`, t.rotated ? "· token de refresco rotado (guardado en .env)" : "");
