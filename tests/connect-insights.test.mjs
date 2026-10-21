import { test } from "node:test";
import assert from "node:assert/strict";
import { matches, pending, message, key } from "../pipeline/connect.mjs";

process.env.CONNECT_HMAC_KEY = "k".repeat(32);
import { summarize } from "../pipeline/insights.mjs";

const cta = { keyword: "PLANETA", resource_title: "Gráfico de Venus", resource_url: "https://example.com/venus.png" };

test("la palabra clave se detecta sola, en cualquier caja, y no dentro de otra palabra", () => {
  assert.ok(matches("planeta!", "PLANETA")); assert.ok(matches("Quiero el PLANETA porfa", "PLANETA"));
  assert.ok(!matches("planetario", "PLANETA")); assert.ok(!matches("", "PLANETA"));
});

test("responde una sola vez por persona y nunca a la propia cuenta", () => {
  const cs = [
    { id: "c1", text: "PLANETA", from: { id: "u1" }, media: "m" },
    { id: "c2", text: "planeta otra vez", from: { id: "u1" }, media: "m" },
    { id: "c3", text: "PLANETA", from: { id: "me" }, media: "m" },
    { id: "c4", text: "qué chulo", from: { id: "u2" }, media: "m" },
  ];
  const first = pending(cs, cta, {}, "me");
  assert.deepEqual(first.map((c) => c.id), ["c1"]); // u1 comentó dos veces: un solo mensaje
  const ledger = { [key("c1")]: true, [key("user:m:u1")]: true };
  assert.deepEqual(pending(cs, cta, ledger, "me"), []);
});

test("el mensaje se identifica como automático e incluye el recurso", () => {
  const m = message(cta); assert.match(m, /automática/); assert.match(m, /example\.com\/venus\.png/);
});

test("el resumen avisa de muestras pequeñas y no inventa métricas", () => {
  const s = summarize([{ views: 100, ig_reels_avg_watch_time: 9000, category: "espacio", hook: 69, duration_bucket: ">35s" }]);
  assert.equal(s.by_category.espacio.views, 100); assert.match(s.note, /hipótesis/);
  assert.equal(summarize([]).n, 0);
});
