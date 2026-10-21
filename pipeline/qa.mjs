// SENTINEL · control de calidad técnico + editorial de un vídeo renderizado. Bloqueos duros + puntuación 0-100.
// La revisión visual de fotogramas (Claude con visión) se suma aparte en el informe (visual: {...}).
// Uso: node pipeline/qa.mjs <episode.json> <video.mp4> [salida.json]
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 64 << 20 }).stderr;

export function probe(video) {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", video], { encoding: "utf8" }));
  const v = j.streams.find((s) => s.codec_type === "video"), a = j.streams.find((s) => s.codec_type === "audio");
  const [n, d] = (v?.avg_frame_rate ?? "0/1").split("/").map(Number);
  return { width: v?.width, height: v?.height, vcodec: v?.codec_name, pix: v?.pix_fmt, fps: d ? n / d : 0, acodec: a?.codec_name, duration: Number(j.format.duration), size: Number(j.format.size) };
}
export function loudness(video) {
  const s = ff(["-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const I = s.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop(), P = s.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
  return { lufs: I ? Number(I.match(/-?[\d.]+/)[0]) : null, peak: P ? Number(P.match(/-?[\d.]+/)[0]) : null };
}
// Pares inicio/fin en orden; un inicio sin fin (dura hasta el final del archivo) se cierra con Infinity.
export const spans = (s, a, b) => {
  const ev = [...s.matchAll(new RegExp(`(${a}|${b}):\\s*(-?[\\d.]+)`, "g"))].map((m) => [m[1], Number(m[2])]);
  const out = []; let open = null;
  for (const [k, v] of ev) { if (k === a) open = v; else if (open !== null) { out.push([open, v]); open = null; } }
  if (open !== null) out.push([open, Infinity]);
  return out;
};
export const blacks = (video) => spans(ff(["-i", video, "-vf", "blackdetect=d=0.3:pic_th=0.97:pix_th=0.08", "-an", "-f", "null", "-"]), "black_start", "black_end");
export const freezes = (video) => spans(ff(["-i", video, "-vf", "freezedetect=n=0.0008:d=2", "-an", "-f", "null", "-"]), "freeze_start", "freeze_end");
export const silences = (video) => spans(ff(["-i", video, "-af", "silencedetect=noise=-45dB:d=1.2", "-vn", "-f", "null", "-"]), "silence_start", "silence_end");

// Evaluación pura (testeable): devuelve { score, blockers, warnings, checks }
export function evaluate({ ep, p, loud, black, freeze, silence, voiceQa, cfg = { duration_s: { min: 20, max: 60 }, quality_threshold: 90 } }) {
  const blockers = [], warnings = [], checks = {};
  let score = 100;
  const need = (ok, label, msg) => { checks[label] = ok; if (!ok) blockers.push(msg); };
  const want = (ok, label, msg, cost) => { checks[label] = ok; if (!ok) { warnings.push(msg); score -= cost; } };
  need(p.width === 1080 && p.height === 1920, "formato_9x16", `resolución ${p.width}×${p.height} (se exige 1080×1920)`);
  need(p.vcodec === "h264" && p.acodec === "aac", "codecs", `códecs ${p.vcodec}/${p.acodec} (se exige h264/aac)`);
  need(p.duration >= cfg.duration_s.min - 5 && p.duration <= 90, "duracion_publicable", `duración ${p.duration.toFixed(1)} s fuera de rango`);
  want(p.duration <= cfg.duration_s.max + 5, "duracion_objetivo", `duración ${p.duration.toFixed(1)} s por encima del objetivo`, 5);
  need(p.size < 64 * 1024 * 1024, "tamano", `archivo de ${(p.size / 1048576).toFixed(1)} MB (máx. 64 MB, límite de subida en un trozo de TikTok)`);
  need(Math.abs(p.fps - 30) < 0.5 || Math.abs(p.fps - 60) < 0.5, "fps", `fps ${p.fps}`);
  need(p.pix === "yuv420p", "pix_fmt", `formato de píxel ${p.pix} (se exige yuv420p para móviles)`);
  need(loud.lufs !== null && loud.lufs > -20 && loud.lufs < -10, "sonoridad", `sonoridad ${loud.lufs} LUFS (objetivo −14)`);
  want(Math.abs(loud.lufs + 14) <= 1.5, "sonoridad_fina", `sonoridad ${loud.lufs} LUFS, lejos de −14`, 3);
  want(loud.peak !== null && loud.peak <= -0.5, "pico", `pico ${loud.peak} dBFS (riesgo de saturación)`, 4);
  const midBlack = black.filter(([s, e]) => s > 0.6 || e - s > 0.8);
  need(midBlack.length === 0, "sin_negros", `fotogramas negros en ${midBlack.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)} s`).join(", ")}`);
  const fz = freeze.map(([s, e]) => [s, Math.min(e, p.duration)]);
  const fmt = (xs) => xs.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)} s`).join(", ");
  need(fz.every(([s, e]) => e - s <= 3), "sin_congelados_largos", `imagen congelada más de 3 s en ${fmt(fz)}`);
  want(fz.length === 0, "sin_congelados", `imagen congelada en ${fmt(fz)}`, 6);
  const midSil = silence.map(([s, e]) => [s, Math.min(e, p.duration)]).filter(([s, e]) => s > 0.5 && (s < p.duration - 2.5 || e - s > 3));
  want(midSil.length === 0, "sin_silencios", `silencios en ${midSil.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)} s`).join(", ")}`, 5);
  need(voiceQa && voiceQa.ratio >= 0.9, "voz_coincide", `la voz coincide con el guion solo un ${Math.round((voiceQa?.ratio ?? 0) * 100)} %`);
  want(voiceQa && voiceQa.ratio >= 0.95, "voz_coincide_95", `coincidencia de voz ${Math.round((voiceQa?.ratio ?? 0) * 100)} % (< 95 %)`, 4);
  const bad = (ep.claims ?? []).filter((c) => c.status !== "verified" || !c.source);
  need((ep.claims ?? []).length > 0 && bad.length === 0, "datos_verificados", `afirmaciones sin verificar: ${bad.map((c) => c.claim).join(" | ") || "no hay claims"}`);
  need((ep.hooks ?? []).length >= 3 && ep.hooks.some((h) => h.chosen), "tres_ganchos", "faltan 3 ganchos o el elegido");
  const pub = ep.publication ?? {};
  need(!pub.cta || (pub.cta.resource_url && pub.cta.resource_checked), "cta_con_recurso", "CTA sin recurso creado y comprobado");
  need(pub.instagram?.ai_label === true && pub.tiktok?.ai_label === true, "etiqueta_ia", "falta la declaración de contenido con IA");
  need(/(generad|hech|cread)[oa]s? con (IA|inteligencia artificial)/i.test(pub.instagram?.caption ?? ""), "etiqueta_ia_texto", "la caption de Instagram no declara la IA en texto (la API no tiene campo de IA)");
  want((pub.instagram?.caption ?? "").length > 40 && (pub.instagram.caption.match(/#/g) ?? []).length <= 5, "caption_ig", "caption de Instagram corta o con exceso de hashtags", 3);
  score = Math.max(0, score);
  return { score, pass: blockers.length === 0 && score >= cfg.quality_threshold, blockers, warnings, checks };
}

export function runQa(epPath, video, root = path.resolve(import.meta.dirname, "..")) {
  const ep = JSON.parse(fs.readFileSync(epPath, "utf8"));
  const cfg = JSON.parse(fs.readFileSync(path.join(root, "config/engine.json"), "utf8"));
  const vq = path.join(root, "public/audio", `${ep.id}.qa.json`);
  const p = probe(video);
  const r = evaluate({ ep, p, loud: loudness(video), black: blacks(video), freeze: freezes(video), silence: silences(video), voiceQa: fs.existsSync(vq) ? JSON.parse(fs.readFileSync(vq, "utf8")) : null, cfg });
  return { episode: ep.id, video: path.basename(video), at: new Date().toISOString(), probe: p, ...r };
}

if (process.argv[1]?.endsWith("qa.mjs")) {
  const [epPath, video, out] = process.argv.slice(2);
  const r = runQa(epPath, video);
  if (out) fs.writeFileSync(out, JSON.stringify(r, null, 1));
  console.log(JSON.stringify({ score: r.score, pass: r.pass, blockers: r.blockers, warnings: r.warnings }, null, 1));
  process.exitCode = r.pass ? 0 : 1;
}
