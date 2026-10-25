// Publica un MP4 como Reel en el Instagram de Beltrán (solo con su OK explícito). Instagram exige una URL pública:
// antes se sube el vídeo a una release del repo (gh release create <tag> <mp4>). Uso:
// node ratopin-universe/tools/subir-instagram.mjs <tag> <archivo.mp4> <caption.txt>
import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { publishInstagram } from "../../pipeline/publishers.mjs";

const [tag, mp4, capFile] = process.argv.slice(2);
if (!tag || !mp4 || !capFile) { console.error("Uso: node ratopin-universe/tools/subir-instagram.mjs <tag> <archivo.mp4> <caption.txt>"); process.exit(1); }
const env = parseEnv(fs.readFileSync(path.resolve(import.meta.dirname, "../../.env"), "utf8"));
const STATE = path.resolve(import.meta.dirname, `../../work/ig-${tag}.json`);   // evita publicar dos veces si se reintenta
const ps = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};
const save = () => fs.writeFileSync(STATE, JSON.stringify(ps));
const r = await publishInstagram({ videoUrl: `https://github.com/beltran6383937/curiosity-engine/releases/download/${tag}/${path.basename(mp4)}`,
  caption: fs.readFileSync(capFile, "utf8").trim(), ps, save, env });
console.log("Publicado en Instagram:", r.permalink ?? r.id, r.note ?? "");
