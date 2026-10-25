// Ratopín · poses de la prueba de movimiento de 5 s, dibujo a dibujo (D = 0…59, 12 dibujos/s). Sin React: lo usan
// la composición (MotionTest5s.tsx) y los tests de node (tests/ratopin-motion5s.test.mjs). Todo sale en px del cuerpo
// (las piernas, que no se mueven); el torso gira y respira alrededor del cinturón y arrastra hombros, cuello y bolsillo.
// Brazos: IK en los contactos (la mano en el muslo, la mano en el móvil, la llave en la abrazadera) y FK entre contactos
// (se interpolan los ángulos, así la muñeca viaja en arco y el codo nunca cambia de lado).
import type { Expr } from "./face";
import type { MouthState } from "./mouth";
import { track, sub, wave, noise, ik2, rotate, type Key } from "./anim.ts";
import * as R from "./rig-v1.ts";

type V = readonly [number, number];
export const CHAR = { x: 71, y: 1198, s: 0.75 };        // posición y escala de Ratopín en el plano (px de vídeo)
export const BG_K = 1.45;                                 // fondo ampliado desde la esquina superior derecha
const CLAMP_FRAME: V = [1080 + (812 * (1080 / 941) - 1080) * BG_K, 585 * (1920 / 1672) * BG_K];
const toChar = ([x, y]: V): V => [(x - CHAR.x) / CHAR.s, (y - CHAR.y) / CHAR.s];
export const CLAMP = toChar(CLAMP_FRAME);

const deg = (a: V) => (Math.atan2(a[1], a[0]) * 180) / Math.PI;
const dirv = (a: number): V => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
const add = (p: V, d: V, k = 1): V => [p[0] + d[0] * k, p[1] + d[1] * k];
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Torso: giro `lean` (grados) y respiración `sy` alrededor del cinturón; `sr` = giro de la manga cercana sobre su costura
// (la tela acompaña al brazo cuando se levanta).
export type Torso = { lean: number; sy: number; sr: number };
export const fromTorso = ([x, y]: V, t: Torso): V => {
  const [px, py] = R.TORSO_PIVOT;
  const [lx, ly] = rotate([x - px, (y - py) * t.sy], t.lean);
  return [px + lx, py + ly];
};
// Punto de la manga cercana (px del torso) con la manga girada.
export const fromSleeve = (p: V, t: Torso): V => {
  const [qx, qy] = R.SLEEVE_PIVOT, [rx, ry] = rotate([p[0] - qx, p[1] - qy], t.sr);
  return fromTorso([qx + rx, qy + ry], t);
};
const shoulderOf = (rig: R.ArmRig, t: Torso) => (rig === R.NEAR ? fromSleeve(rig.shoulder, t) : fromTorso(rig.shoulder, t));

// Ángulos de un brazo (grados, del cuerpo): a1 brazo, a2 antebrazo, h dirección de la mano.
type ArmAngles = { a1: number; a2: number; h: number };
const ik = (rig: R.ArmRig, t: Torso, wrist: V, bend: 1 | -1) => {
  const S = shoulderOf(rig, t);
  const [a1, a2] = ik2(S[0], S[1], wrist[0], wrist[1], rig.l1, rig.l2, bend);
  return { a1, a2 };
};
// fore < 1 = escorzo: el antebrazo apunta hacia la cámara y se ve más corto (solo al cruzar por delante del brazo).
const fk = (rig: R.ArmRig, t: Torso, a: ArmAngles, fore = 1) => {
  const S = shoulderOf(rig, t);
  const E = add(S, dirv(a.a1), rig.l1);
  return { S, E, W: add(E, dirv(a.a2), rig.l2 * fore) };
};
// Interpolación FK entre dos juegos de ángulos guardados respecto al torso.
const lerpAngles = (p: ArmAngles, q: ArmAngles, k: number): ArmAngles => ({
  a1: p.a1 + wrap(q.a1 - p.a1) * k, a2: p.a2 + wrap(q.a2 - p.a2) * k, h: p.h + wrap(q.h - p.h) * k,
});
const rel = (a: ArmAngles, t: Torso): ArmAngles => ({ a1: a.a1 - t.lean, a2: a.a2 - t.lean, h: a.h - t.lean });
const abs = (a: ArmAngles, t: Torso): ArmAngles => ({ a1: a.a1 + t.lean, a2: a.a2 + t.lean, h: a.h + t.lean });

// ── Torso a lo largo del plano
export const torsoAt = (D: number): Torso => ({
  // respiración + inspiración (D20–23) y espiración (D24–29) del suspiro + respingo al vibrar
  sy: 1 + wave(D, 30, 0.008) + track([[19, 0], [23, 0.028], [29, -0.012], [33, 0]], D) + track([[8, 0], [10, 0.012, "out"], [14, 0]], D),
  // se inclina un poco hacia el móvil al cogerlo y al final se echa atrás, incrédulo
  lean: track([[30, 0], [34, 0.8], [41, -1.6], [47, -0.6], [53, -0.7], [54, 1.4, "out"], [57, 1.7], [59, 1.4]], D), // retrocede en el remate
  // la manga se cierra un poco al ir al bolsillo y se levanta con el brazo al subir el móvil (con retraso: es tela)
  sr: track([[33, 0], [40, -2], [46, -1.5], [48, 1.5, "in"], [51, 6, "out"], [53, 6.8], [57, 7.6, "out"], [59, 7.3]], D), // manga corta: gira poco
});

// ── Móvil en el bolsillo del peto (px del torso): anchor de la mano de agarre y giro con los que el móvil queda dentro.
const POCKET_ROT = -11;                             // el móvil, derecho en el bolsillo (−11° + 11,5° del dibujo): no roza los tirantes
const PHONE_BOTTOM = (() => {                       // centro del canto de abajo del móvil, respecto al anchor sin girar
  const [cx, cy] = R.PHONE.c, [, h] = R.PHONE.size;
  const b = add([cx, cy], rotate([0, h / 2], R.PHONE.deg));
  return [b[0] - R.NEAR_HANDS.agarre.anchor[0], b[1] - R.NEAR_HANDS.agarre.anchor[1]] as V;
})();
const POCKET_BOTTOM: V = [635, 274];                // dónde descansa el canto de abajo: hondo y centrado entre los tirantes
export const GRIP: V = (() => { const b = rotate(PHONE_BOTTOM, POCKET_ROT); return [POCKET_BOTTOM[0] - b[0], POCKET_BOTTOM[1] - b[1]]; })();
const PHONE_UP = dirv(R.PHONE.deg + POCKET_ROT - 90 - 22); // sale del bolsillo hacia arriba y hacia el cuerpo
const PULL = 84;                                     // lo que sube hasta salir del todo

// ── Brazo cercano
const REST: V = [596, 470];                         // la muñeca, apoyada en el muslo
const FINAL: V = [204, 140];                        // px del torso: el móvil delante de la cara
const FINAL_ROT = -26;                              // giro del dibujo de la mano: muñeca casi recta (18°), móvil algo inclinado
const handH = (name: R.NearHand, rot: number) => rot + R.NEAR_HANDS[name].dir; // giro del dibujo → dirección del muñón

const restWrist = (D: number): V => [REST[0] + wave(D, 30, 2.5), REST[1] + wave(D, 30, 1.5, 0.25) - track([[8, 0], [10, 7, "out"], [16, 0]], D)];
const restAngles = (D: number, wrist = restWrist(D)): ArmAngles => {
  const t = torsoAt(D), a = ik(R.NEAR, t, wrist, 1);
  return { ...a, h: a.a2 + 18 };                    // la mano cae relajada sobre el muslo
};
const anticWrist = (D: number): V => {
  const k = track([[30, 0], [33, 1, "inOut"]], D);
  return add(restWrist(D), [-26, -6], k);           // antes de ir al móvil: recoge la mano hacia sí (anticipación)
};
const gripAngles = (D: number, lift = 0): ArmAngles => {
  const t = torsoAt(D);
  const g = fromTorso(add(GRIP, PHONE_UP, lift), t);
  const a = ik(R.NEAR, t, g, 1);
  return { ...a, h: handH("agarre", POCKET_ROT - (lift / PULL) * 10 + t.lean) }; // al sacarlo ya lo va girando
};
const approachAngles = (D: number): ArmAngles => {
  const t = torsoAt(D);
  const a = ik(R.NEAR, t, fromTorso(add(GRIP, [-16, 14]), t), 1);
  return { ...a, h: a.a2 - 4 };                     // la mano llega ya alineada con el móvil: al cerrar no gira
};
const finalAngles = (D: number): ArmAngles => {
  const t = torsoAt(D);
  const a = ik(R.NEAR, t, fromTorso(FINAL, t), -1);
  return { ...a, h: handH("agarre", FINAL_ROT + t.lean) };
};

function nearArm(D: number) {
  const t = torsoAt(D);
  let a: ArmAngles, fore = 1;
  if (D <= 30) a = restAngles(D);
  else if (D <= 33) { const r = restAngles(D, anticWrist(D)); a = { ...r, h: r.a2 + mix(18, 10, track([[30, 0], [33, 1]], D)) }; }
  else if (D <= 40) {
    // FK del final de la anticipación a la aproximación: arranca rápido y frena al llegar (slow in)
    const p = rel(restAngles(33, anticWrist(33)), torsoAt(33)), q = rel(approachAngles(40), torsoAt(40));
    p.h = p.a2 + 10;
    a = abs(lerpAngles(p, q, track([[33, 0], [36, 0.55, "in"], [40, 1, "out"]], D)), t);
  } else if (D <= 43) a = gripAngles(D, track([[41, 0], [42, -2], [43, 0]], D)); // aprieta
  else if (D <= 46) a = gripAngles(D, track([[43, 0], [46, PULL, "in"]], D));  // tira: el bolsillo frena al principio
  else {
    // FK del tirón a la cara, pasándose un poco y asentándose; luego lo aparta, incrédulo, temblando
    const p = rel(gripAngles(46, PULL), torsoAt(46)), q = rel(finalAngles(53), torsoAt(53));
    const k = track([[46, 0], [47, 0.13, "in"], [48, 0.34, "linear"], [49, 0.56, "linear"], [50, 0.78, "linear"], [51, 0.97, "linear"], [52, 1.04, "out"], [54, 1, "inOut"]], D);
    const back = track([[53, 0], [57, 1, "out"], [59, 0.9]], D);
    const r = lerpAngles(p, q, k);
    r.a1 -= back * 4 + wave(D, 3, 0.5 * back); r.a2 -= back * 10 + wave(D, 2.5, 0.8 * back); r.h -= back * 10;
    a = abs(r, t);
    // Al pasar el antebrazo por delante del brazo apunta hacia la cámara: escorzo (más corto) en vez de taparlo.
    const cross = Math.abs(wrap(a.a2 - a.a1));
    fore = 1 - 0.42 * Math.max(0, Math.min(1, (cross - 135) / 40)) ** 1.5;
  }
  const j = fk(R.NEAR, t, a, fore);
  const hand = sub([[0, "reposo"], [33, "abierta"], [38, "coger"], [41, "agarre"]] as const, D) as R.NearHand;
  return { ...j, a, hand, fore, rot: a.h - R.NEAR_HANDS[hand].dir };
}

// ── Brazo lejano: la boca de la llave no se mueve de la abrazadera; la llave gira (tirones) y el brazo la sigue.
function farArm(D: number) {
  const t = torsoAt(D);
  // tirones cortos y secos, sin doblar de más la muñeca; el puño no cambia de dibujo (antes parpadeaba entre dos)
  const phi = track([[0, -41], [3, -48, "in"], [5, -41.5, "out"], [9, -48.5, "in"], [11, -42, "out"], [13, -45, "back"], [59, -44.5]], D);
  const hand: R.FarHand = "llave";
  const W = add(CLAMP, rotate(R.JAW[hand], phi), -1);
  const a = ik(R.FAR, t, W, 1);
  const j = fk(R.FAR, t, { ...a, h: 0 });
  return { ...j, a: { ...a, h: phi + R.FAR_HANDS[hand].dir }, hand, rot: phi, phi };
}

// Final del muñón: desde la muñeca, en la dirección de la mano.
export const stubEnd = (W: V, h: number, hand: R.Hand): V => add(W, dirv(h), hand.stub);

export const pose = (D: number) => {
  const torso = torsoAt(D);
  const near = nearArm(D), far = farArm(D);
  const buzz = D >= 8;
  const startle = track([[8, 0], [10, 1, "out"], [16, 0.35], [24, 0]], D);

  // Móvil: en el bolsillo hasta que la mano lo agarra (D41); desde ahí va con la mano (mismo dibujo, mismo tamaño).
  const inHand = D >= 41;
  const shake = buzz ? [noise(D * 5.3, 3) * (inHand ? 1.2 : 2.2), noise(D * 4.1, 5) * (inHand ? 1 : 1.6)] as V : [0, 0] as V;
  const phone = inHand
    ? { at: add(near.W, shake), rot: near.rot }
    : { at: add(fromTorso(GRIP, torso), shake), rot: POCKET_ROT + torso.lean };
  const pocket = R.POCKET.map((p) => fromTorso(p, torso));

  // ── Cabeza: H1 mirando la abrazadera → baja la vista al bolsillo → suspiro → gira (H2…H5, un dibujo cada una, con
  // anticipación y el arco del giro hacia abajo) → sigue al móvil
  const head = sub([[0, "H1"], [32, "H2"], [33, "H3"], [34, "H4"], [35, "H5"]] as const, D);
  const headR = track([[0, -5], [8, -5], [10, -8, "out"], [14, -6], [16, 3, "inOut"], [20, 0], [23, -4, "inOut"], [29, 4, "inOut"],
    [31, 6, "in"], [33, 1, "linear"], [35, -3, "out"], [37, 2, "inOut"], [41, 5], [46, 3], [50, -2, "inOut"], [53, -1], [54, -6, "out"], [56, -7, "back"], [59, -6]] as Key[], D)
    + wave(D, 16, 0.5);
  const headY = track([[30, 0], [31, 3], [33, 9, "inOut"], [35, 2, "out"], [36, 0]], D)   // el giro baja en arco
    + track([[19, 0], [23, -4], [29, 2], [32, 0]], D) + track([[8, 0], [10, -6, "out"], [14, 0]], D)
    + track([[52, 0], [53, 7, "in"], [54, -9, "out"], [57, 0, "inOut"]], D);              // se encoge y salta
  // Remate (anticipation-payoff): lee con cara de póker (D50–52, da tiempo a leer el bocadillo) → se encoge (D53,
  // aplastamiento) → estirón de golpe (D54) y asentamiento.
  const headX = track([[53, 0], [54, 6, "out"], [57, 10, "back"], [59, 8]], D);           // se echa atrás
  const headSy = track([[52, 1], [53, 0.93, "in"], [54, 1.08, "out"], [56, 0.99, "inOut"], [58, 1.01], [59, 1]], D);
  const hr = R.HEADS[head];
  const headAt = fromTorso([R.HEAD_AT[0] + headX, R.HEAD_AT[1] + hr.drop + headY], torso);

  const look = (k: Key[][]) => [track(k[0], D), track(k[1], D)] as const;
  const e: Expr = {
    look: look([
      [[0, 0.7], [9, 0.7], [11, 0.2, "out"], [14, 0.1], [17, 0.2], [19, 0.6], [24, 0.2], [29, 0], [31, -0.8, "out"], [35, -0.3], [38, 0.5, "inOut"], [42, 0.4], [47, -0.6], [52, -0.7], [59, -0.7]],
      [[0, -0.6], [9, -0.5], [11, 0.1, "out"], [14, 0.95, "inOut"], [17, 0.9], [19, -0.95, "inOut"], [24, -0.5], [29, 0.2], [31, 0.3], [35, 0.6], [38, 0.95, "inOut"], [42, 0.9], [47, 0.3], [52, 0.1, "inOut"], [59, 0.1]],
    ]),
    pupil: track([[8, 1], [10, 0.8, "out"], [14, 1], [53, 1], [54, 0.55, "out"], [59, 0.6]], D),
    // párpados: ojos en blanco con los párpados a media asta, suspiro, parpadeo al girar
    lid: track([[16, 0], [19, 0.3, "inOut"], [23, 0.38], [27, 0.45], [29, 0.1, "inOut"], [31, 0.15], [32, 0.85], [33, 1], [34, 0.7], [35, 0.15], [36, 0], [52, 0], [53, 0.35, "in"], [54, 0, "out"]], D), // entorna los ojos justo antes del susto
    brow: track([[0, 5], [8, 5], [10, -12, "out"], [14, -4], [16, 2], [19, -6, "inOut"], [27, -4], [30, 3], [52, 4], [53, 9, "in"], [54, -22, "out"], [56, -17], [59, -16]], D),
    browTilt: track([[0, 9], [8, 9], [10, -4, "out"], [14, 4], [19, -8, "inOut"], [27, -6], [30, 8], [52, 8], [53, 12, "in"], [54, -8, "out"], [56, -6], [59, -6]], D),
  };
  // Boca (mouth.tsx; H2–H4 llevan la de su dibujo): trabaja contento (la sonrisa del dibujo) → al vibrar se le va la
  // sonrisa → suspira con la boca apenas abierta → fastidio al coger el móvil → al leer quién llama, la mandíbula cae
  // (con exceso) y se queda abierta. El susto se prepara: pausa leyendo, se encoge y estalla (anticipation-payoff).
  const mouth: MouthState | null = head === "H1" || head === "H5" ? {
    corner: track([[10, 1], [12, 0.3, "out"], [18, 0], [23, -0.2], [27, -0.3], [31, -0.5], [44, -0.4], [52, -0.4], [53, -0.7], [54, -0.3], [56, -0.6], [59, -0.6]], D),
    open: track([[23, 0], [24, 0.14, "out"], [27, 0.1], [29, 0], [53, 0], [54, 1.12, "out"], [56, 0.9, "inOut"], [58, 0.97], [59, 0.95]], D), // de cerrada a abierta en un dibujo: el golpe
    wide: track([[53, 1], [54, 0.6, "out"], [59, 0.65]], D),         // susto: «O», no carcajada
  } : null;

  const tail = R.TAIL.map((_, i) => (i === 0 ? 132 + startle * 28 : [0, 22, 18, 16][i] * (1 - startle * 0.8)) + wave(D, 22, [3, 5, 8, 12][i], -i * 0.12));

  return {
    torso, near, far, phone, pocket, inPocket: D < 47, buzz, ringing: buzz,
    head: { name: head, at: headAt, r: headR + torso.lean, sy: headSy }, e, mouth, tail,
  };
};
