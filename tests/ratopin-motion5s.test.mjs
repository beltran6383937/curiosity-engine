// Criterios de aceptación de la prueba de 5 s que se pueden comprobar sin mirar (ratopin-universe/tests/motion-5s).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rotate } from "../remotion/src/ratopin/anim.ts";
import { pose, CLAMP, GRIP, fromTorso, fromSleeve } from "../remotion/src/ratopin/motion5s.ts";
import * as R from "../remotion/src/ratopin/rig-v1.ts";

const DS = Array.from({ length: 60 }, (_, d) => d);
const P = DS.map(pose);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dist = (a, b) => Math.hypot(...sub(a, b));
const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

test("la boca de la llave no se despega de la abrazadera en ningún dibujo", () => {
  for (const d of DS) {
    const { far } = P[d];
    const jaw = [far.W[0] + rotate(R.JAW[far.hand], far.rot)[0], far.W[1] + rotate(R.JAW[far.hand], far.rot)[1]];
    assert.ok(dist(jaw, CLAMP) < 0.5, `D${d}: llave a ${dist(jaw, CLAMP).toFixed(1)} px`);
  }
});

test("los huesos no cambian de largo (nada de brazos de goma) y las muñecas llegan", () => {
  for (const d of DS) {
    for (const [arm, j] of [[R.NEAR, P[d].near], [R.FAR, P[d].far]]) {
      assert.ok(Math.abs(dist(j.S, j.E) - arm.l1) < 0.01, `D${d}: brazo ${dist(j.S, j.E).toFixed(2)}`);
      assert.ok(Math.abs(dist(j.E, j.W) - arm.l2 * (j.fore ?? 1)) < 0.01, // fore < 1 = escorzo intencionado
        `D${d}: antebrazo ${dist(j.E, j.W).toFixed(2)}`);
      const S = arm === R.NEAR ? fromSleeve(arm.shoulder, P[d].torso) : fromTorso(arm.shoulder, P[d].torso); // el cercano va con la manga
      assert.equal(j.S.toString(), S.toString(), `D${d}: el hombro se sale de la manga`);
    }
  }
});

test("el brazo cercano sale siempre por la boca de la manga (sin atravesar la tela)", () => {
  for (const d of DS) {
    const up = wrap(P[d].near.a.a1 - P[d].torso.lean);
    assert.ok(up > 60 && up < 165, `D${d}: el brazo apunta a ${up.toFixed(0)}°`);
  }
});

test("las muñecas doblan dentro de lo que dobla una muñeca de verdad", () => {
  for (const d of DS) {
    for (const [name, j] of [["cercana", P[d].near], ["lejana", P[d].far]]) {
      const flex = wrap(j.a.h - ang(j.E, j.W));
      assert.ok(Math.abs(flex) <= 60, `D${d}: muñeca ${name} doblada ${flex.toFixed(0)}°`);
    }
  }
});

test("el codo lejano no cambia de lado", () => {
  const side = (j) => Math.sign(wrap(ang(j.E, j.W) - ang(j.S, j.E)));
  for (const d of DS) assert.equal(side(P[d].far), side(P[0].far), `D${d}`);
});

test("un solo móvil: quieto en el bolsillo, y al agarrarlo pasa a la mano sin saltar", () => {
  for (const d of DS.slice(9, 40)) {
    const home = fromTorso(GRIP, P[d].torso);
    assert.ok(dist(P[d].phone.at, home) < 4, `D${d}: el móvil se sale del bolsillo`);
  }
  assert.ok(dist(P[41].near.W, fromTorso(GRIP, P[41].torso)) < 3, "la mano coge el móvil donde está");
  assert.ok(Math.abs(P[41].phone.rot - P[40].phone.rot) < 1, "al agarrarlo no gira de golpe");
  for (const d of DS.slice(41)) assert.ok(dist(P[d].phone.at, P[d].near.W) < 3, `D${d}: el móvil se despega de la mano`);
});

test("espaciado: ni la mano ni el móvil saltan más de 100 px entre dibujos (la subida es la acción rápida)", () => {
  for (const d of DS.slice(1)) {
    for (const k of ["near", "phone"]) {
      const a = k === "near" ? P[d].near.W : P[d].phone.at, b = k === "near" ? P[d - 1].near.W : P[d - 1].phone.at;
      assert.ok(dist(a, b) <= 100, `${k} D${d - 1}→D${d}: ${dist(a, b).toFixed(0)} px`);
    }
  }
});

test("el giro de cabeza pasa por todas las vistas, un dibujo cada una", () => {
  const seq = P.map((p) => p.head.name).filter((h, i, a) => h !== a[i - 1]);
  assert.deepEqual(seq, ["H1", "H2", "H3", "H4", "H5"]);
  for (const h of ["H2", "H3", "H4"]) assert.equal(P.filter((p) => p.head.name === h).length, 1, h);
});

test("el suspiro es contenido: sin sonrisas ni bocas abiertas de verdad entre 1,7 y 2,4 s", () => {
  for (const d of DS.slice(20, 30)) {
    const m = P[d].mouth;
    assert.ok(m && m.corner <= 0.01 && m.open <= 0.2, `D${d}: ${JSON.stringify(m)}`);
  }
});

test("al leer quién llama la mandíbula cae y se queda abierta", () => {
  assert.equal(P[51].mouth.open, 0);
  for (const d of DS.slice(54)) assert.ok(P[d].mouth.open >= 0.85, `D${d}: ${P[d].mouth.open}`);
});

test("solo dibujos de la biblioteca del rig: todos los PNG existen", () => {
  const files = [...Object.values(R.NEAR_HANDS), ...Object.values(R.FAR_HANDS), ...Object.values(R.HEADS)].map((d) => d.src)
    .concat(Object.values(R.FACES).map((f) => f.mask))
    .concat(["piernas", "torso", "sisa", "cinturon", "manga-cerca", "hueco-lejos", "cuello-trasero", ...R.TAIL.map((_, i) => `cola-${i + 1}`)].map((n) => `${R.E}${n}.png`));
  for (const f of files) assert.ok(existsSync(new URL(`../public/${f}`, import.meta.url)), f);
});
