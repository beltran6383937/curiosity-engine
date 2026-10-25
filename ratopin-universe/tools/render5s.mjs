// Renderiza la prueba de 5 s: MP4 con cámara y temblor de línea, y la secuencia PNG sin cámara ni temblor para verificar.py.
// Uso: node ratopin-universe/tools/render5s.mjs [carpeta=work/ratopin]   (CE_BROWSER = Chrome/Chromium si no es el de Playwright)
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, renderFrames } from "@remotion/renderer";
import path from "node:path";
import { guardWebpack } from "../../pipeline/check-episode.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const out = path.resolve(root, process.argv[2] || "work/ratopin");
const browserExecutable = process.env.CE_BROWSER || (process.platform === "win32" ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1248/chrome-win64/chrome.exe` : undefined);
// 1 pestaña: con 2 (y ~2,5 GB de RAM libres) salieron fotogramas con capas en blanco
// (25-10: 10 de 120 sin piernas con 2 pestañas, 0 con 1). verificar.py lo detecta con la zona fija de las botas.
const concurrency = 1;
// Mismo guardián que pipeline/render.mjs: el bundle incluye todos los episodios escritos por el modelo.
const serveUrl = await bundle({ entryPoint: path.join(root, "remotion/src/index.tsx"), publicDir: path.join(root, "public"), webpackOverride: guardWebpack });

const film = { camera: true, boil: true };
const composition = await selectComposition({ serveUrl, id: "RatopinMotion5s", inputProps: film, browserExecutable });
await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, pixelFormat: "yuv420p", inputProps: film, browserExecutable, concurrency,
  outputLocation: path.join(out, "ratopin-motion-5s.mp4") });
console.log(path.join(out, "ratopin-motion-5s.mp4"));

const check = { camera: false, boil: false };
await renderFrames({ composition: { ...composition, props: check }, serveUrl, inputProps: check, browserExecutable, concurrency,
  imageFormat: "png", outputDir: path.join(out, "frames"), onStart: () => {}, onFrameUpdate: () => {} });
console.log(path.join(out, "frames"));
