// Renderiza un fotograma de una composición a PNG (hojas de prueba). Uso: node ratopin-universe/tools/still.mjs <id> <salida.png> [fotograma]
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "node:path";
import { guardWebpack } from "../../pipeline/check-episode.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const [id, out, frame = "0"] = process.argv.slice(2);
const browserExecutable = process.env.CE_BROWSER || (process.platform === "win32" ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1248/chrome-win64/chrome.exe` : undefined);
const serveUrl = await bundle({ entryPoint: path.join(root, "remotion/src/index.tsx"), publicDir: path.join(root, "public"), webpackOverride: guardWebpack });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
await renderStill({ composition, serveUrl, output: path.resolve(out), frame: Number(frame), browserExecutable });
console.log(path.resolve(out));
