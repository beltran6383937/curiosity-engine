// Fugas a git/issues: redact tapa credenciales en cualquier formato y la upload_url de TikTok nunca llega al estado.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { redact, publishTikTok } from "../pipeline/publishers.mjs";

test("redact tapa credenciales en query, form, JSON, cabeceras y por valor del entorno", () => {
  const env = { TIKTOK_REFRESH_TOKEN: "rft.SECRETVALUE123", OTHER: "visible-value" };
  const s = redact('a?access_token=AAA111&x=1 refresh_token=BBB222 {"access_token":"CCC333","client_secret":"DDD444"} bearer EEE555 OAuth FFF666 raw rft.SECRETVALUE123 visible-value', env);
  for (const leak of ["AAA111", "BBB222", "CCC333", "DDD444", "EEE555", "FFF666", "rft.SECRETVALUE123"]) assert.ok(!s.includes(leak), leak);
  assert.ok(s.includes("visible-value") && s.includes("x=1"));
});

test("TikTok: si la subida revienta por red, la upload_url no queda en el estado guardado", async () => {
  const video = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ce-")), "v.mp4"); fs.writeFileSync(video, "x");
  const ps = {}, snapshots = [];
  const res = (b) => ({ ok: true, status: 200, text: async () => JSON.stringify(b) });
  const fetchFn = async (url) => {
    if (url.endsWith("/creator_info/query/")) return res({ data: { privacy_level_options: ["SELF_ONLY"] }, error: { code: "ok" } });
    if (url.endsWith("/video/init/")) return res({ data: { publish_id: "P1", upload_url: "https://open-upload.tiktokapis.com/upload?sig=SECRET" }, error: { code: "ok" } });
    throw new Error("fetch failed");
  };
  await assert.rejects(publishTikTok({ video, caption: "c", ps, save: () => snapshots.push(JSON.stringify(ps)), env: { TIKTOK_ACCESS_TOKEN: "t" }, fetchFn }));
  assert.ok([...snapshots, JSON.stringify(ps)].every((x) => !x.includes("sig=SECRET")));
});
