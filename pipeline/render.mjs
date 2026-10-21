// CUT · render final de un episodio: H.264 CRF 18 + AAC, 1080×1920 a 30 fps. Un solo bundle.
// WebGL: ANGLE en Windows (GPU integrada), SwiftShader ("swangle") en servidores Linux sin GPU.
// Uso: node pipeline/render.mjs <id> [salida.mp4]
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { guardWebpack } from "./check-episode.mjs";
import { selectComposition, renderMedia } from "@remotion/renderer";

const ROOT = path.resolve(import.meta.dirname, "..");
const [id, outArg] = process.argv.slice(2);
const out = outArg ?? path.join(ROOT, "work", id, `${id}.mp4`);
const browserExecutable = process.env.CE_BROWSER || (process.platform === "win32" ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe` : undefined);
const chromiumOptions = { gl: process.env.CE_GL || (process.platform === "win32" ? "angle" : "swangle") };
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "remotion/src/index.tsx"), publicDir: path.join(ROOT, "public"), webpackOverride: guardWebpack });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
let last = -1;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, audioCodec: "aac", audioBitrate: "192k", pixelFormat: "yuv420p", outputLocation: out, browserExecutable, chromiumOptions,
  concurrency: Number(process.env.CE_CONCURRENCY || 2),
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(`render ${id}: ${p * 10} %`); } } });
// Remotion parte de fotogramas JPEG y FFmpeg elige yuvj420p (rango completo): en algunos móviles salen negros lavados.
// Pasada final a yuv420p de rango limitado BT.709 + faststart (el vídeo empieza a reproducirse antes de bajarse entero).
export const finalize = (src, dst) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p",
  "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-profile:v", "high", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
  "-c:a", "copy", "-movflags", "+faststart", dst]);
finalize(out, out + ".tmp.mp4"); fs.renameSync(out + ".tmp.mp4", out);
console.log(`ok ${out} (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
