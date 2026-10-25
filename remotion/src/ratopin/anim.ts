// Ratopín · pistas de animación. Una pista = poses clave [dibujo, valor, curva de llegada]; track() da el valor en
// cualquier dibujo (12 dibujos/s). Sin dependencias: lo importan la composición de Remotion y los tests de node.

export type Ease = "linear" | "in" | "out" | "inOut" | "back" | "hold";
export type Key = readonly [drawing: number, value: number, ease?: Ease];

const C1 = 1.70158 * 1.2;
export const ease: Record<Ease, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => 1 + (C1 + 1) * (t - 1) ** 3 + C1 * (t - 1) ** 2, // se pasa ~10 % y vuelve: exceso + asentamiento
  hold: (t) => (t < 1 ? 0 : 1),
};

export function track(keys: readonly Key[], d: number): number {
  if (d <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [d1, v1, e = "inOut"] = keys[i];
    const [d0, v0] = keys[i - 1];
    if (d <= d1) return v0 + (v1 - v0) * ease[e]((d - d0) / (d1 - d0));
  }
  return keys[keys.length - 1][1];
}

// Sustitución de dibujos (cabezas, manos, bocas): el último dibujo cuyo inicio ya ha pasado.
export function sub<T>(keys: readonly (readonly [number, T])[], d: number): T {
  let v = keys[0][1];
  for (const [k, id] of keys) if (d >= k) v = id;
  return v;
}

// Capas que nunca paran (respiración, cola, bigotes).
export const wave = (d: number, period: number, amp: number, phase = 0) => amp * Math.sin(2 * Math.PI * (d / period + phase));

// Brazo de dos huesos (cinemática inversa): dado el hombro, el objetivo de la muñeca y los largos, devuelve los ángulos
// absolutos (grados) de brazo y antebrazo. bend = lado hacia el que dobla el codo. Si no llega, estira hacia el objetivo.
export function ik2(sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, bend: 1 | -1): [number, number] {
  const dx = tx - sx, dy = ty - sy;
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-6), l1 + l2 - 1e-6);
  const a = Math.acos(Math.min(Math.max((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1), 1));
  const a1 = Math.atan2(dy, dx) + bend * a;
  const ex = sx + l1 * Math.cos(a1), ey = sy + l1 * Math.sin(a1);
  return [(a1 * 180) / Math.PI, (Math.atan2(ty - ey, tx - ex) * 180) / Math.PI];
}

export const rotate = ([x, y]: readonly [number, number], deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};

// Trayectoria en arco (Bézier cuadrática): los gestos viajan en curva, no en línea recta.
export const arc = (p0: readonly [number, number], c: readonly [number, number], p1: readonly [number, number], t: number): [number, number] => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
};

// Ruido suave determinista para la cámara en mano (value noise 1D con interpolación suave).
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export function noise(x: number, seed = 0): number {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash(i + seed * 101) * (1 - u) + hash(i + 1 + seed * 101) * u) * 2 - 1;
}
