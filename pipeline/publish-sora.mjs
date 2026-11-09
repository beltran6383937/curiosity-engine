// SORA: publica un Reel ya aprobado. Instagram (video_url pública de la release) y TikTok (bandeja de entrada, NO público).
// Uso: node pipeline/publish-sora.mjs --video f.mp4 --video-url URL --caption caption.txt [--tiktok] [--solo-tiktok] [--out res.json] [--dry]
// --solo-tiktok: no toca Instagram (ya publicado); sube solo --video a la bandeja de TikTok (debe pesar <64 MB).
// Idempotente: publishInstagram detecta por caption si ya está publicado. No imprime tokens (call() los tapa).
import fs from "node:fs";
import { publishInstagram, publishTikTok } from "./publishers.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : undefined; };
const video = arg("--video"), videoUrl = arg("--video-url"), captionFile = arg("--caption");
const soloTiktok = process.argv.includes("--solo-tiktok");
if (!video || !captionFile || (!videoUrl && !soloTiktok)) throw new Error("faltan --video, --video-url o --caption");
const caption = fs.readFileSync(captionFile, "utf8").trim();
if (!caption) throw new Error("caption vacía");
const out = { instagram: null, tiktok: null, errors: [] };

if (process.argv.includes("--dry")) { console.log("DRY", JSON.stringify({ video, videoUrl, captionChars: caption.length, tiktok: process.argv.includes("--tiktok") || soloTiktok, soloTiktok })); process.exit(0); }

if (!soloTiktok) {
  try { out.instagram = await publishInstagram({ videoUrl, caption, ps: {}, save() {} }); console.log("INSTAGRAM OK", JSON.stringify(out.instagram)); }
  catch (e) { out.errors.push("instagram: " + e.message); console.error("INSTAGRAM ERROR", e.message); }
}

if (process.argv.includes("--tiktok") || soloTiktok) {
  try { out.tiktok = await publishTikTok({ video, caption, ps: {}, save() {}, mode: "inbox" }); console.log("TIKTOK OK (bandeja)", JSON.stringify(out.tiktok)); }
  catch (e) { out.errors.push("tiktok: " + e.message); console.error("TIKTOK ERROR", e.message); }
}
fs.writeFileSync(arg("--out") ?? "publish-sora.json", JSON.stringify(out));
if (!soloTiktok && !out.instagram) process.exitCode = 1;   // Instagram es lo obligatorio; TikTok es en la medida de lo posible
if (soloTiktok && !out.tiktok) process.exitCode = 1;
