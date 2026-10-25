// Ratopín · brazo dibujado por código: una sola silueta continua del hombro a la muñeca (sin piezas ni juntas).
// Cada hueso es la envolvente de dos círculos (hombro→codo, codo→muñeca, muñeca→final del muñón); primero se pinta el
// contorno de todos y encima el relleno de todos, así las uniones no tienen línea. Sin rayas dentro (ni pelo ni pliegue):
// la mano dibujada va encima y su muñeca tapa el final del brazo. Coordenadas: px del cuerpo (piernas).
import React from "react";

type V = readonly [number, number];
export const INK = "#141414", FUR = "#efedea", SHADE = "#bdbab5";
const INK_W = 7;

const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const len = (a: V) => Math.hypot(a[0], a[1]);
const unit = (a: V): V => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const at = (p: V, d: V, k: number): V => [p[0] + d[0] * k, p[1] + d[1] * k];
const f = (n: number) => n.toFixed(1);

// Envolvente de dos círculos (centro A radio ra, centro B radio rb) como trazado SVG cerrado.
export function hull(A: V, ra: number, B: V, rb: number): string {
  const d = len(sub(B, A));
  if (d <= Math.abs(ra - rb) + 0.01) { const [C, r] = ra > rb ? [A, ra] : [B, rb]; return `M ${f(C[0] - r)} ${f(C[1])} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`; }
  const th = Math.atan2(B[1] - A[1], B[0] - A[0]), ph = Math.acos((ra - rb) / d);
  const u = (a: number): V => [Math.cos(a), Math.sin(a)];
  const A1 = at(A, u(th + ph), ra), B1 = at(B, u(th + ph), rb), B2 = at(B, u(th - ph), rb), A2 = at(A, u(th - ph), ra);
  return `M ${f(A1[0])} ${f(A1[1])} L ${f(B1[0])} ${f(B1[1])} A ${f(rb)} ${f(rb)} 0 ${2 * ph > Math.PI ? 1 : 0} 0 ${f(B2[0])} ${f(B2[1])}`
    + ` L ${f(A2[0])} ${f(A2[1])} A ${f(ra)} ${f(ra)} 0 ${2 * Math.PI - 2 * ph > Math.PI ? 1 : 0} 0 ${f(A1[0])} ${f(A1[1])} Z`;
}

export type ArmShape = {
  S: V; E: V; W: V; Hs: V;                       // hombro, codo, muñeca, final del muñón de la mano
  w: readonly [number, number, number, number]; // ancho exterior (con contorno) en hombro, codo, muñeca y muñón
  root?: number;                                 // cuánto se alarga hacia atrás desde el hombro (queda dentro de la manga)
};

// Semiplano del lado del antebrazo, separado por la bisectriz del codo (para repintar solo el antebrazo encima de la manga).
export function forearmSide({ S, E, W }: ArmShape): string {
  const u = unit(sub(E, S)), fo = unit(sub(W, E));
  let b = unit([fo[0] - u[0], fo[1] - u[1]]);
  if (len([fo[0] - u[0], fo[1] - u[1]]) < 0.1) b = [-u[1], u[0]];
  let n: V = [-b[1], b[0]];
  if (n[0] * fo[0] + n[1] * fo[1] < 0) n = [-n[0], -n[1]];
  const a = at(E, b, -3000), c = at(E, b, 3000);
  return `M ${f(a[0])} ${f(a[1])} L ${f(c[0])} ${f(c[1])} L ${f(at(c, n, 3000)[0])} ${f(at(c, n, 3000)[1])} L ${f(at(a, n, 3000)[0])} ${f(at(a, n, 3000)[1])} Z`;
}

export const Arm: React.FC<{
  shape: ArmShape; id: string; clip?: string;     // clip = trazado (px del cuerpo) fuera del cual no se pinta
}> = ({ shape, id, clip }) => {
  const { S, E, W, Hs, w, root = 40 } = shape;
  const u = unit(sub(E, S)), R = at(S, u, -root);
  const r = w.map((x) => x / 2 - INK_W) as unknown as [number, number, number, number];
  const bones: [V, number, V, number][] = [[R, r[0], E, r[1]], [E, r[1], W, r[2]]];
  const stub: [V, number, V, number] = [W, r[2], Hs, r[3]];
  const body = bones.map(([a, ra, b, rb]) => hull(a, ra, b, rb));
  const tip = hull(...stub);
  // Sombra suave a lo largo del lado de abajo (luz de arriba a la izquierda). Sin rayas: en las extremidades no hay líneas.
  const shadeOff = (a: V, b: V, k: number) => {
    const d = unit(sub(b, a)); let n: V = [-d[1], d[0]];
    if (n[0] * 0.5 + n[1] * 0.85 < 0) n = [-n[0], -n[1]];
    return n.map((x) => x * k) as unknown as V;
  };
  return (
    <svg width={994} height={936} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id={`${id}-in`}>{[...body, tip].map((d, i) => <path key={i} d={d} />)}</clipPath>
        {clip && <clipPath id={`${id}-clip`}><path d={clip} /></clipPath>}
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={4} /></filter>
      </defs>
      <g clipPath={clip ? `url(#${id}-clip)` : undefined}>
        {body.map((d, i) => <path key={i} d={d} fill={INK} stroke={INK} strokeWidth={INK_W * 2} strokeLinejoin="round" />)}
        <path d={tip} fill={INK} stroke={INK} strokeWidth={INK_W * 2} />
        {body.map((d, i) => <path key={i} d={d} fill={FUR} />)}
        <path d={tip} fill={FUR} />
        <g clipPath={`url(#${id}-in)`}>
          <g filter={`url(#${id}-soft)`} opacity={0.75}>
            {[...bones, stub].map(([a, ra, b, rb], i) => {
              const o1 = shadeOff(a, b, ra * 0.85), o2 = shadeOff(a, b, rb * 0.85);
              return <path key={i} d={`M ${f(a[0] + o1[0])} ${f(a[1] + o1[1])} L ${f(b[0] + o2[0])} ${f(b[1] + o2[1])}`} stroke={SHADE}
                strokeWidth={(ra + rb) * 0.42} strokeLinecap="round" />;
            })}
          </g>
        </g>
      </g>
    </svg>
  );
};
