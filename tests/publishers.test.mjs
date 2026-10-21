// Publicadores con una API falsa: flujo completo, reintento tras corte sin duplicar, tokens fuera de los errores.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { publishInstagram, publishTikTok } from "../pipeline/publishers.mjs";

const video = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ce-")), "v.mp4");
fs.writeFileSync(video, Buffer.alloc(1024));
const env = { IG_ACCESS_TOKEN: "SECRETO123", IG_USER_ID: "1789", TIKTOK_ACCESS_TOKEN: "TTSECRETO" };
const res = (body, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });

// API de Instagram simulada con estado
const fakeIG = ({ failPublishOnce = false } = {}) => {
  const calls = []; let status = "IN_PROGRESS"; let published = 0; let failed = false;
  const fetchFn = async (url, init = {}) => {
    const u = url.split("?")[0]; calls.push(`${init.method ?? "GET"} ${u.replace(/.*\/(v24\.0)\//, "")}`);
    if (u.endsWith("/1789/media") && init.method === "POST") {
      if (!new URLSearchParams(init.body).get("video_url")?.startsWith("https://")) return res({ error: { code: 100, message: "The parameter video_url is required" } }, 400);
      status = "FINISHED"; return res({ id: "C1" });
    }
    if (u.endsWith("/C1")) return res({ status_code: published ? "PUBLISHED" : status });
    if (u.endsWith("/media_publish")) {
      if (failPublishOnce && !failed) { failed = true; published++; throw new Error("socket hang up"); } // publica pero se corta la respuesta
      published++; return res({ id: "M1" });
    }
    if (u.endsWith("/1789/media")) return res({ data: published ? [{ id: "M1", caption: "Hola Venus", permalink: "https://instagram.com/reel/M1" }] : [] });
    if (u.endsWith("/M1")) return res({ permalink: "https://instagram.com/reel/M1" });
    return res({ error: { code: 100, message: `no simulado ${u}` } }, 400);
  };
  return { fetchFn, calls, published: () => published };
};

test("Instagram: contenedor → subida → FINISHED → publicar → enlace", async () => {
  const api = fakeIG(); const ps = {};
  const r = await publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "Hola Venus", ps, save: () => {}, env, fetchFn: api.fetchFn, pollMs: 0 });
  assert.deepEqual(r, { id: "M1", permalink: "https://instagram.com/reel/M1" });
  assert.equal(api.published(), 1);
});

test("Instagram: si se corta tras publicar, el reintento NO publica otra vez", async () => {
  const api = fakeIG({ failPublishOnce: true }); const ps = {};
  await assert.rejects(publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "Hola Venus", ps, save: () => {}, env, fetchFn: api.fetchFn, pollMs: 0 }));
  assert.equal(ps.containerId, "C1");
  const r = await publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "Hola Venus", ps, save: () => {}, env, fetchFn: api.fetchFn, pollMs: 0 });
  assert.equal(r.id, "M1");
  assert.equal(api.published(), 1);
});

test("Instagram: sin credenciales falla con un mensaje claro", async () => {
  await assert.rejects(publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "x", ps: {}, save: () => {}, env: {} }), /sin autorizar/);
});

test("los errores de la API no exponen el token", async () => {
  const fetchFn = async () => res({ error: { code: 190, message: "token caducado access_token=SECRETO123" } }, 401);
  await assert.rejects(publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "x", ps: {}, save: () => {}, env, fetchFn }), (e) => !e.message.includes("SECRETO123") && /401/.test(e.message));
});

test("TikTok: rechaza una privacidad que la cuenta no permite (cliente sin auditar)", async () => {
  const fetchFn = async () => res({ data: { privacy_level_options: ["SELF_ONLY"] }, error: { code: "ok" } });
  await assert.rejects(publishTikTok({ video, caption: "x", ps: {}, save: () => {}, env, fetchFn, privacy: "PUBLIC_TO_EVERYONE" }), /no permite la privacidad/);
});

test("TikTok: init → PUT → PUBLISH_COMPLETE, con etiqueta de IA", async () => {
  let initBody;
  const fetchFn = async (url, init = {}) => {
    if (url.endsWith("/creator_info/query/")) return res({ data: { privacy_level_options: ["SELF_ONLY"] }, error: { code: "ok" } });
    if (url.endsWith("/video/init/")) { initBody = JSON.parse(init.body); return res({ data: { publish_id: "P1", upload_url: "https://up.tiktok/x" }, error: { code: "ok" } }); }
    if (url.startsWith("https://up.tiktok")) return res({});
    if (url.endsWith("/status/fetch/")) return res({ data: { status: "PUBLISH_COMPLETE", publicaly_available_post_id: [] }, error: { code: "ok" } });
  };
  const ps = {};
  const r = await publishTikTok({ video, caption: "Venus", ps, save: () => {}, env, fetchFn, pollMs: 0 });
  assert.equal(r.id, "P1"); assert.equal(initBody.post_info.is_aigc, true); assert.equal(initBody.post_info.privacy_level, "SELF_ONLY");
  assert.equal(initBody.source_info.total_chunk_count, 1);
});

test("TikTok bandeja: init en /inbox sin texto ni creator_info → SEND_TO_USER_INBOX", async () => {
  let initUrl, initBody, creator = 0;
  const fetchFn = async (url, init = {}) => {
    if (url.endsWith("/creator_info/query/")) { creator++; return res({ data: { privacy_level_options: [] }, error: { code: "ok" } }); }
    if (url.endsWith("/video/init/")) { initUrl = url; initBody = JSON.parse(init.body); return res({ data: { publish_id: "B1", upload_url: "https://up.tiktok/x" }, error: { code: "ok" } }); }
    if (url.startsWith("https://up.tiktok")) return res({});
    if (url.endsWith("/status/fetch/")) return res({ data: { status: "SEND_TO_USER_INBOX" }, error: { code: "ok" } });
  };
  const r = await publishTikTok({ video, caption: "Venus", ps: {}, save: () => {}, env, fetchFn, mode: "inbox", pollMs: 0 });
  assert.deepEqual(r, { id: "B1", inbox: true }); assert.match(initUrl, /\/inbox\/video\/init\/$/);
  assert.equal(initBody.post_info, undefined); assert.equal(initBody.source_info.total_chunk_count, 1); assert.equal(creator, 0);
});

test("Instagram: con el estado perdido (ps vacío) no repite un post que ya existe", async () => {
  const api = fakeIG(); await publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "Hola Venus", ps: {}, save: () => {}, env, fetchFn: api.fetchFn, pollMs: 0 });
  const r = await publishInstagram({ videoUrl: "https://x.test/v.mp4", caption: "Hola Venus", ps: {}, save: () => {}, env, fetchFn: api.fetchFn, pollMs: 0 });
  assert.equal(r.id, "M1"); assert.equal(api.published(), 1);
});

test("TikTok: si la publicación falla, el siguiente intento empieza de cero (no se queda atascado)", async () => {
  let n = 0; const ps = {};
  const fetchFn = async (url) => {
    if (url.endsWith("/creator_info/query/")) return res({ data: { privacy_level_options: ["SELF_ONLY"] }, error: { code: "ok" } });
    if (url.endsWith("/video/init/")) { n++; return res({ data: { publish_id: `P${n}`, upload_url: "https://up.tiktok/x" }, error: { code: "ok" } }); }
    if (url.startsWith("https://up.tiktok")) return res({});
    if (url.endsWith("/status/fetch/")) return res({ data: n === 1 ? { status: "FAILED", fail_reason: "file_format_check_failed" } : { status: "PUBLISH_COMPLETE" }, error: { code: "ok" } });
  };
  await assert.rejects(publishTikTok({ video, caption: "V", ps, save: () => {}, env, fetchFn, pollMs: 0 }), /file_format/);
  assert.equal(ps.publishId, undefined);
  const r = await publishTikTok({ video, caption: "V", ps, save: () => {}, env, fetchFn, pollMs: 0 });
  assert.equal(r.id, "P2");
});
