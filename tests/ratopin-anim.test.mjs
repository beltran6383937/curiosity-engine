import { test } from "node:test";
import assert from "node:assert/strict";
import { track, sub, ease, noise, ik2, arc } from "../remotion/src/ratopin/anim.ts";

test("ik2: la muñeca cae en el objetivo y los huesos no cambian de largo", () => {
  const rad = (g) => (g * Math.PI) / 180;
  for (const [tx, ty, bend] of [[120, 80, 1], [-50, 150, -1], [200, -30, 1]]) {
    const [a1, a2] = ik2(10, 20, tx, ty, 140, 120, bend);
    const ex = 10 + 140 * Math.cos(rad(a1)), ey = 20 + 140 * Math.sin(rad(a1));
    const wx = ex + 120 * Math.cos(rad(a2)), wy = ey + 120 * Math.sin(rad(a2));
    assert.ok(Math.hypot(wx - tx, wy - ty) < 1e-6, `objetivo ${tx},${ty}`);
  }
  const [s1, s2] = ik2(0, 0, 1000, 0, 140, 120, 1); // fuera de alcance: brazo estirado hacia el objetivo
  assert.ok(Math.abs(s1) < 0.5 && Math.abs(s2) < 0.5);
});

test("arc: empieza y acaba en sus extremos y pasa por el lado del control", () => {
  assert.deepEqual(arc([0, 0], [50, 100], [100, 0], 0), [0, 0]);
  assert.deepEqual(arc([0, 0], [50, 100], [100, 0], 1), [100, 0]);
  assert.ok(arc([0, 0], [50, 100], [100, 0], 0.5)[1] > 40);
});

test("track: valores en las poses clave y entre medias", () => {
  const k = [[0, 0], [10, 100, "linear"], [20, 100, "hold"]];
  assert.equal(track(k, -5), 0);
  assert.equal(track(k, 0), 0);
  assert.equal(track(k, 5), 50);
  assert.equal(track(k, 10), 100);
  assert.equal(track(k, 99), 100);
});

test("back: se pasa del valor final y termina exactamente en él", () => {
  const xs = Array.from({ length: 101 }, (_, i) => ease.back(i / 100));
  assert.ok(Math.max(...xs) > 1.05, "debe haber exceso");
  assert.ok(Math.abs(ease.back(1) - 1) < 1e-9 && Math.abs(ease.back(0)) < 1e-9);
});

test("inOut: arranca y frena suave (espaciado más corto en los extremos)", () => {
  const step = (t) => ease.inOut(t + 0.05) - ease.inOut(t);
  assert.ok(step(0) < step(0.45) && step(0.95) < step(0.45));
});

test("sub: dibujo de sustitución vigente", () => {
  const k = [[0, "H1"], [30, "H2"], [32, "H3"]];
  assert.equal(sub(k, 0), "H1");
  assert.equal(sub(k, 31), "H2");
  assert.equal(sub(k, 59), "H3");
});

test("noise: determinista, continuo y acotado", () => {
  assert.equal(noise(3.3, 1), noise(3.3, 1));
  for (let x = 0; x < 20; x += 0.1) {
    assert.ok(Math.abs(noise(x)) <= 1);
    assert.ok(Math.abs(noise(x + 0.01) - noise(x)) < 0.05);
  }
});
