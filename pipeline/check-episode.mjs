// Comprobación automática de un episodio antes de voz y render: esquema del guion, reglas editoriales y que la
// escena compila y se registra en Remotion. Uso: node pipeline/check-episode.mjs <id> [--no-bundle] [--no-hooks]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

export const AI_TEXT = /(generad|hech|cread)[oa]s? con (IA|inteligencia artificial)/i;

export function checkSpec(ep, hookNumbers) {
  const e = [];
  const req = (c, m) => { if (!c) e.push(m); };
  req(/^[a-z0-9-]+$/.test(ep.id ?? ""), "id inválido (solo a-z, 0-9 y guiones)");
  req(Array.isArray(ep.lines) && ep.lines.length >= 5 && ep.lines.length <= 16, "lines: entre 5 y 16 frases");
  const words = (ep.lines ?? []).join(" ").split(/\s+/).length;
  req(words >= 60 && words <= 150, `guion de ${words} palabras (60-150 para 25-45 s)`);
  req((ep.lines ?? []).every((l) => !/[—–]/.test(l)), "sin rayas largas en el guion");
  req(!/^(hola|buenas|hoy vamos)/i.test(ep.lines?.[0] ?? ""), "el gancho no puede empezar saludando");
  req((ep.hooks ?? []).length === 3 && ep.hooks.filter((h) => h.chosen).length === 1, "3 ganchos y exactamente 1 elegido");
  if (hookNumbers) req((ep.hooks ?? []).every((h) => hookNumbers.has(Number(h.n))),"cada gancho debe venir de assets/hooks/hooks.md (número válido)");
  req(ep.hooks?.find((h) => h.chosen)?.text === ep.lines?.[0], "la primera frase debe ser el gancho elegido");
  req((ep.claims ?? []).length > 0 && ep.claims.every((c) => c.status === "verified" && c.source), "todas las afirmaciones verificadas y con fuente");
  for (const [i, l] of (ep.lines ?? []).entries()) if (/\d/.test(l) && !ep.say?.[String(i)] && /\d{3,}/.test(l)) e.push(`frase ${i}: cifra sin versión hablada en "say"`);
  const p = ep.publication ?? {};
  req(p.instagram?.caption && p.tiktok?.caption, "captions de Instagram y TikTok");
  req(p.instagram?.caption !== p.tiktok?.caption, "captions distintas por red");
  req(p.instagram?.ai_label === true && p.tiktok?.ai_label === true, "declaración de IA en ambas redes");
  req(AI_TEXT.test(p.instagram?.caption ?? ""), "la caption de Instagram debe decirlo en texto (p. ej. «Voz generada con IA.»): la API no tiene campo de IA");
  req(!p.cta || (p.cta.resource_url && p.cta.resource_checked), "CTA solo con recurso creado y comprobado");
  return e;
}

// Defensa adicional al aislamiento de jobs: la escena la escribe un modelo que ha leído webs no confiables y webpack
// puede ejecutar loaders en Node. Solo .tsx en la carpeta, imports de una lista cerrada y nada de código dinámico.
// GAP admite comentarios entre la palabra clave y la cadena (`from /*x*/ "..."` también es un import).
const GAP = String.raw`(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*`;
const SPEC = new RegExp(String.raw`\b(?:from|import)${GAP}(['"])(.*?)\1`, "g");
const IMPORT_OK = /^(react|remotion|three|@remotion\/[a-z-]+|@react-three\/(fiber|drei)|\.\.?\/[A-Za-z0-9_-]+)$/; // relativos: solo ./X o ../kit
const BANNED = new RegExp(String.raw`\brequire\b|\bimport${GAP}[(.]|\beval\b|\bFunction${GAP}\(|\bprocess\b|child_process|__(non_)?webpack_require__|\bfetch\b|XMLHttpRequest|WebSocket`);
export function sceneSafety(dir, scene) {
  const e = [];
  for (const f of fs.readdirSync(dir)) if (!/^[A-Za-z0-9_-]+\.tsx$/.test(f) || !fs.lstatSync(path.join(dir, f)).isFile()) e.push(`archivo no permitido en remotion/src/episodes: ${f}`);
  if (!scene) return e;
  const src = fs.readFileSync(path.join(dir, scene), "utf8");
  for (const m of src.matchAll(SPEC)) if (!IMPORT_OK.test(m[2])) e.push(`import no permitido en la escena: ${m[2].slice(0, 80)}`);
  if (BANNED.test(src)) e.push("la escena usa código no permitido (require, import dinámico, eval, process, red)");
  return e;
}

// Segunda barrera, en el propio webpack: ninguna petición con loader en línea (`!`) llega a resolverse.
export const guardWebpack = (config) => ({ ...config, plugins: [...(config.plugins ?? []), { apply(compiler) {
  compiler.hooks.normalModuleFactory.tap("ce-sin-loaders-en-linea", (nmf) => nmf.hooks.beforeResolve.tap("ce-sin-loaders-en-linea", (d) => {
    if (d.request.includes("!")) throw new Error(`loader en línea bloqueado: ${d.request.slice(0, 120)}`);
  }));
} }] });

export const hookNumbers = () => new Set([...fs.readFileSync(path.join(ROOT, "assets/hooks/hooks.md"), "utf8").matchAll(/^(\d{2,3}) · /gm)].map((m) => Number(m[1])));

if (process.argv[1]?.endsWith("check-episode.mjs")) {
  const id = process.argv[2];
  const ep = JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", id, "episode.json"), "utf8"));
  // --no-hooks: job "build", sin el banco de ganchos (es de pago y no sale del job "write", donde ya se comprobó)
  const errors = checkSpec(ep, process.argv.includes("--no-hooks") ? null : hookNumbers());
  // P&Q AI Content Engine (desde el 23-10-2026): pilar de la mezcla y las 5 ideas puntuadas antes del guion
  if (/^\d{4}-\d{2}-\d{2}$/.test(id) && id >= "2026-10-23") {
    const mix = JSON.parse(fs.readFileSync(path.join(ROOT, "config/engine.json"), "utf8")).mix ?? {};
    if (!(ep.category in mix)) errors.push(`category «${ep.category}» no es un pilar de config/engine.json (${Object.keys(mix).join(", ")})`);
    if (!fs.existsSync(path.join(ROOT, "episodes", id, "ideas.md"))) errors.push("falta episodes/<id>/ideas.md (5 ideas × 3 ganchos puntuadas)");
    if (!fs.existsSync(path.join(ROOT, "episodes", id, "storyboard.md"))) errors.push("falta episodes/<id>/storyboard.md");
  }
  const scenes = fs.readdirSync(path.join(ROOT, "remotion/src/episodes")).filter((f) => fs.readFileSync(path.join(ROOT, "remotion/src/episodes", f), "utf8").includes(`export const id = "${id}"`));
  const scene = scenes[0];
  if (!scene) errors.push(`no hay escena con export const id = "${id}" en remotion/src/episodes`);
  if (scenes.length > 1) errors.push(`id duplicado en varias escenas (${scenes.join(", ")}): Remotion no arrancaría`);
  errors.push(...sceneSafety(path.join(ROOT, "remotion/src/episodes"), scene));
  if (!errors.length && !process.argv.includes("--no-bundle")) {
    const { bundle } = await import("@remotion/bundler");
    const { getCompositions } = await import("@remotion/renderer");
    try {
      const serveUrl = await bundle({ entryPoint: path.join(ROOT, "remotion/src/index.tsx"), publicDir: path.join(ROOT, "public"), webpackOverride: guardWebpack });
      const comps = await getCompositions(serveUrl, { browserExecutable: process.env.CE_BROWSER || (process.platform === "win32" ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe` : undefined) });
      if (!comps.some((c) => c.id === id)) errors.push(`la composición ${id} no se registra en Remotion`);
    } catch (err) { errors.push(`la escena no compila: ${String(err.message).slice(0, 400)}`); }
  }
  if (errors.length) { console.error(`✖ ${id}\n - ${errors.join("\n - ")}`); process.exitCode = 1; }
  else console.log(`✔ ${id}: episodio válido (${scene})`);
}
