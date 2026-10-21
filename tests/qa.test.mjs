// SENTINEL detecta errores conocidos (bloqueantes) y deja pasar un vídeo correcto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, spans } from "../pipeline/qa.mjs";

const good = () => ({
  ep: { claims: [{ claim: "x", source: "https://nasa.gov", status: "verified" }], hooks: [{ chosen: true }, {}, {}],
    publication: { cta: null, instagram: { ai_label: true, caption: "Un texto de caption suficientemente largo para pasar. Voz generada con IA. #a #b" }, tiktok: { ai_label: true } } },
  p: { width: 1080, height: 1920, vcodec: "h264", acodec: "aac", duration: 38, size: 20e6, fps: 30, pix: "yuv420p" },
  loud: { lufs: -14.1, peak: -1.5 }, black: [], freeze: [], silence: [], voiceQa: { ratio: 0.97 },
});

test("un vídeo correcto pasa con 100", () => {
  const r = evaluate(good());
  assert.equal(r.pass, true); assert.equal(r.score, 100); assert.deepEqual(r.blockers, []);
});

const blocks = (mut, re) => { const c = good(); mut(c); const r = evaluate(c); assert.equal(r.pass, false); assert.ok(r.blockers.some((b) => re.test(b)), r.blockers.join(" / ")); };

test("bloquea resolución incorrecta", () => blocks((c) => { c.p.width = 1920; c.p.height = 1080; }, /resolución/));
test("bloquea dato sin verificar", () => blocks((c) => { c.ep.claims.push({ claim: "Venus tiene lunas", status: "unverified" }); }, /sin verificar/));
test("bloquea CTA sin recurso", () => blocks((c) => { c.ep.publication.cta = { keyword: "PLANETA" }; }, /CTA/));
test("bloquea falta de etiqueta de IA", () => blocks((c) => { c.ep.publication.tiktok.ai_label = false; }, /IA/));
test("bloquea negro a mitad de vídeo pero tolera el fundido inicial", () => {
  const c = good(); c.black = [[0, 0.4]]; assert.equal(evaluate(c).pass, true);
  blocks((x) => { x.black = [[12.0, 13.1]]; }, /negros/);
});
test("bloquea voz que no coincide con el guion", () => blocks((c) => { c.voiceQa = { ratio: 0.7 }; }, /voz/));
test("bloquea audio saturado de sonoridad", () => blocks((c) => { c.loud.lufs = -5; }, /sonoridad/));
test("avisos restan puntos: congelado + silencio", () => {
  const c = good(); c.freeze = [[10, 13]]; c.silence = [[20, 22]];
  const r = evaluate(c); assert.equal(r.score, 89); assert.equal(r.pass, false);
});

test("un congelado que llega hasta el final (sin freeze_end) se detecta y bloquea", () => {
  const log = "[freezedetect] lavfi.freezedetect.freeze_start: 0.5\n[freezedetect] lavfi.freezedetect.freeze_duration: 2";
  const fz = spans(log, "lavfi.freezedetect.freeze_start", "lavfi.freezedetect.freeze_end");
  assert.deepEqual(fz, [[0.5, Infinity]]);
  blocks((c) => { c.freeze = fz; }, /congelada más de 3 s/);
});
test("bloquea archivos de más de 64 MB y formatos de píxel no compatibles", () => {
  blocks((c) => { c.p.size = 70 * 1024 * 1024; }, /64 MB/);
  blocks((c) => { c.p.pix = "yuv444p"; }, /píxel/);
});

test("bloquea si la caption de Instagram no declara la IA en texto (aunque ai_label sea true)", () => {
  blocks((c) => { c.ep.publication.instagram.caption = c.ep.publication.instagram.caption.replace("Voz generada con IA. ", ""); }, /declara la IA en texto/);
});
