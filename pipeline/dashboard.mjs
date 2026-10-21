// Panel privado estático generado desde data/ (sin servidor ni secretos): estado, próxima publicación, biblioteca,
// métricas y configuración. La parada de emergencia es el workflow "stop" de GitHub (autenticado por GitHub).
// Uso: node pipeline/dashboard.mjs → dashboard/index.html
import fs from "node:fs";
import path from "node:path";
import { madrid, stopped, loadConfig } from "./orchestrator.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const dir = path.join(ROOT, "data/runs");
const runs = (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : []).sort().reverse().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const cfg = loadConfig(), m = madrid(), stop = stopped();
const ep = (id) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", id, "episode.json"), "utf8")); } catch { return {}; } };
const badge = (s) => `<span class="b b-${esc(String(s).toLowerCase())}">${esc(s)}</span>`;
const link = (p) => p?.permalink ? `<a href="${esc(p.permalink)}" rel="noopener">${esc(p.status)}</a>` : badge(p?.status ?? "—");
const rows = runs.map((r) => { const e = ep(r.episode); const mt = r.metrics?.ig_72h ?? r.metrics?.ig_24h; return `<tr><td>${esc(r.date)}</td><td>${esc(e.title ?? r.episode ?? "—")}</td><td>${esc(e.category ?? "")}</td><td>${badge(r.state)}</td><td>${esc(r.quality ?? "")}</td><td>${link(r.platforms?.instagram)}</td><td>${link(r.platforms?.tiktok)}</td><td>${mt ? `${esc(mt.views)} vis · ${esc(mt.saved)} guard.` : "—"}</td></tr>`; }).join("");
const last = runs[0];
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Curiosity Engine</title>
<style>:root{--bg:#0b0a12;--card:#15131f;--ink:#efeaf8;--mut:#9a93b0;--acc:#ffc86b;--ok:#6be3a4;--bad:#ff7a6b}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#f6f4fb;--card:#fff;--ink:#16131f;--mut:#5d5670;--acc:#a86a00;--ok:#127a46;--bad:#b42318}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}main{max-width:1080px;margin:auto;padding:24px 16px}
h1{font-size:22px;margin:0 0 4px}p.m{color:var(--mut);margin:0 0 20px}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}
.c{background:var(--card);border-radius:14px;padding:14px 16px}.c b{display:block;font-size:12px;color:var(--mut);font-weight:600;letter-spacing:.04em;text-transform:uppercase}.c span.v{font-size:20px;font-weight:700}
.t{overflow-x:auto;background:var(--card);border-radius:14px}table{border-collapse:collapse;width:100%;min-width:720px}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #ffffff12}th{color:var(--mut);font-size:12px;text-transform:uppercase}
.b{padding:2px 8px;border-radius:99px;font-size:12px;background:#ffffff14}.b-published{color:var(--ok)}.b-failed,.b-needs_attention,.b-stopped{color:var(--bad)}a{color:var(--acc)}</style></head>
<body><main><h1>Curiosity Engine</h1><p class="m">Generado ${esc(m.date)} · hora de Madrid · fuente: data/ del repositorio</p>
<div class="g"><div class="c"><b>Estado</b><span class="v">${stop ? "DETENIDO" : esc(last?.state ?? "sin runs")}</span></div>
<div class="c"><b>Próxima publicación</b><span class="v">${esc(cfg.publish_time)} Madrid</span></div>
<div class="c"><b>Instagram</b><span class="v">${cfg.platforms.instagram.enabled ? "activo" : "pendiente de autorizar"}</span></div>
<div class="c"><b>TikTok</b><span class="v">${cfg.platforms.tiktok.enabled ? `activo (${esc(cfg.platforms.tiktok.privacy)})` : "pendiente de auditoría"}</span></div>
<div class="c"><b>Coste del día</b><span class="v">0 €</span></div><div class="c"><b>Mezcla de temas</b><span class="v">${Object.entries(cfg.mix).map(([k, v]) => `${esc(k)} ${Math.round(v * 100)}%`).join(" · ")}</span></div></div>
<div class="t"><table><thead><tr><th>Fecha</th><th>Vídeo</th><th>Categoría</th><th>Estado</th><th>Calidad</th><th>Instagram</th><th>TikTok</th><th>Métricas</th></tr></thead><tbody>${rows || `<tr><td colspan="8">Todavía no hay vídeos.</td></tr>`}</tbody></table></div>
<p class="m" style="margin-top:20px">Detener publicaciones: GitHub → Actions → <b>stop</b> → Run workflow. Configuración: config/engine.json.</p></main></body></html>`;
fs.mkdirSync(path.join(ROOT, "dashboard"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "dashboard/index.html"), html);
console.log("ok dashboard/index.html");
