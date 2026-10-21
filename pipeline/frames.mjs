// SENTINEL · fotogramas de control (QA visual) de una composición: un solo bundle, varios PNG.
// Uso: node pipeline/frames.mjs venus-pilot [s1,s2,…]   (segundos; por defecto, el inicio de cada frase + 0,6 s)
// Salida: out/fotogramas/<ID>/t<seg>.png + hoja.png (todos en una hoja de contactos, con el ffmpeg del sistema)
import { bundle } from "@remotion/bundler";
import { guardWebpack } from "./check-episode.mjs";
import { selectComposition, renderStill } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [ids, list] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, "..");
// WebGL por ANGLE (las escenas 3D de src/curio lo necesitan) y el Chromium de Playwright, como en el render.
const browserExecutable = process.env.CE_BROWSER || (process.platform === "win32" ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe` : undefined);
const chromiumOptions = { gl: process.env.CE_GL || (process.platform === "win32" ? "angle" : "swangle") };
const serveUrl = await bundle({ entryPoint: path.join(root, "remotion/src/index.tsx"), publicDir: path.join(root, "public"), webpackOverride: guardWebpack });
for (const id of ids.split(",")) {
  const comp = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
  const lines = comp.props.timing ?? comp.props.lines ?? [];
  const secs = list ? list.split(",").map(Number) : lines.map((l) => l.start + 0.6);
  const dir = path.join(root, "work/frames", id); mkdirSync(dir, { recursive: true });
  const files = [];
  for (const s of secs) {
    const frame = Math.min(comp.durationInFrames - 1, Math.round(s * comp.fps));
    files.push(path.join(dir, `t${s.toFixed(1)}.png`));
    await renderStill({ composition: comp, serveUrl, frame, output: files.at(-1), imageFormat: "png", scale: 0.5, browserExecutable, chromiumOptions });
  }
  const cols = Math.min(5, files.length), rows = Math.ceil(files.length / cols);
  const pad = Array(cols * rows - files.length).fill("color=c=black:s=270x480:d=1");
  const fc = [...files.map((_, i) => `[${i}:v]scale=270:480[v${i}];`), ...pad.map((_, k) => `[${files.length + k}:v]null[v${files.length + k}];`)].join("")
    + files.concat(pad).map((_, i) => `[v${i}]`).join("") + `xstack=inputs=${cols * rows}:grid=${cols}x${rows}`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...files.flatMap((f) => ["-i", f]), ...pad.flatMap((p) => ["-f", "lavfi", "-i", p]), "-filter_complex", fc, "-frames:v", "1", path.join(dir, "hoja.png")]);
  console.log(`ok ${id}: ${secs.length} fotogramas en ${dir} (duración ${(comp.durationInFrames / comp.fps).toFixed(1)} s)`);
}
