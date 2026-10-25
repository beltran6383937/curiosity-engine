// Renderiza la Tuerca: node ratopin-universe/tools/render-tuerca.mjs [Tuerca5s|TuercaEp1] [salida.mp4]
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "node:path";
import { guardWebpack } from "../../pipeline/check-episode.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const id = process.argv[2] || "Tuerca5s";
const out = path.resolve(root, process.argv[3] || (id === "Tuerca5s" ? "work/tuerca/tuerca-5s.mp4" : "work/tuerca/tuerca-ep1.mp4"));
const browserExecutable = process.env.CE_BROWSER || (process.platform === "win32" ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1248/chrome-win64/chrome.exe` : undefined);
const serveUrl = await bundle({ entryPoint: path.join(root, "remotion/src/index.tsx"), publicDir: path.join(root, "public"), webpackOverride: guardWebpack });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
// 1 pestaña: con 2 y poca RAM salieron fotogramas con capas en blanco (ver render5s.mjs)
await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, pixelFormat: "yuv420p", audioCodec: "aac", browserExecutable, concurrency: 1, outputLocation: out });
console.log(out);
