// INSIGHT · métricas reales (solo las que da la API) a las 24 h y 72 h de cada publicación, y resumen para NOVA.
// Instagram: views, reach, likes, comments, shares, saved, total_interactions, ig_reels_avg_watch_time.
// TikTok: requiere el scope video.list (pendiente); hasta entonces no se inventa nada.
// Uso: node pipeline/insights.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IG_METRICS = "views,reach,likes,comments,shares,saved,total_interactions,ig_reels_avg_watch_time";

export async function fetchIg(mediaId, { env = process.env, fetchFn = fetch } = {}) {
  const ver = env.IG_API_VERSION ?? "v24.0";
  const r = await fetchFn(`https://graph.instagram.com/${ver}/${mediaId}/insights?metric=${IG_METRICS}&access_token=${env.IG_ACCESS_TOKEN}`);
  const j = await r.json();
  if (!r.ok) throw new Error(`insights ${r.status}: ${j.error?.message ?? "error"}`.replace(/access_token=[^&\s]+/, "access_token=***"));
  return Object.fromEntries(j.data.map((m) => [m.name, m.values?.[0]?.value ?? m.total_value?.value ?? null]));
}

// Agrega por dimensión (categoría, plantilla de gancho, duración): medias de views y de tiempo medio de visionado.
export function summarize(rows) {
  const by = (key) => {
    const g = {};
    for (const r of rows) { const k = r[key] ?? "?"; (g[k] ??= []).push(r); }
    return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, { n: v.length, views: Math.round(v.reduce((a, x) => a + (x.views ?? 0), 0) / v.length), avg_watch_ms: Math.round(v.reduce((a, x) => a + (x.ig_reels_avg_watch_time ?? 0), 0) / v.length) }]));
  };
  return { updated: new Date().toISOString(), n: rows.length, note: rows.length < 10 ? "muestra pequeña: hipótesis, no conclusiones" : "", by_category: by("category"), by_hook: by("hook"), by_duration: by("duration_bucket") };
}

if (process.argv[1]?.endsWith("insights.mjs")) {
  const dir = path.join(ROOT, "data/runs");
  const rows = [];
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".json")) : []) {
    const run = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const ig = run.platforms?.instagram;
    if (ig?.status !== "published" || !ig.id) continue;
    const age = (Date.now() - Date.parse(ig.publishedAt)) / 36e5;
    run.metrics ??= {};
    for (const h of [24, 72]) if (age >= h && !run.metrics[`ig_${h}h`] && process.env.IG_ACCESS_TOKEN) {
      try { run.metrics[`ig_${h}h`] = await fetchIg(ig.id); } catch (e) { console.error(`[INSIGHT] ${run.date}: ${e.message}`); }
    }
    fs.writeFileSync(path.join(dir, f), JSON.stringify(run, null, 1));
    const ep = JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", run.episode, "episode.json"), "utf8"));
    const m = run.metrics.ig_72h ?? run.metrics.ig_24h;
    if (m) rows.push({ ...m, category: ep.category, hook: ep.hooks.find((x) => x.chosen)?.n, duration_bucket: run.duration == null ? "?" : run.duration > 35 ? ">35s" : "≤35s" });
  }
  fs.writeFileSync(path.join(ROOT, "data/insights.json"), JSON.stringify(summarize(rows), null, 1));
  console.log(`[INSIGHT] ${rows.length} vídeos con métricas`);
}
