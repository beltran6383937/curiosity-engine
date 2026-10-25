// Ratopín · boca por código, encima de las cabezas aprobadas (como los ojos de face.tsx). En estas cabezas el borde de
// abajo del hocico ES el labio de arriba y los dientes cuelgan por fuera de la silueta; por eso la boca no se pega como
// un hocico entero (la v1 pegaba boca-NN.png por la nariz y asomaban otra barbilla y otros dientes). Aquí:
//   · cerrada: el dibujo tal cual, solo cambia la comisura (sonrisa → neutra → fastidio) con un parche de pelo;
//   · abierta: mandíbula + interior oscuro + lengua por código bajo el labio, y encima los MISMOS dientes del dibujo
//     (la cabeza otra vez, recortada a los dientes), así nunca se despegan;
// Coordenadas en px de la imagen de cada cabeza; fwd = hacia dónde mira el hocico (+1 derecha, -1 izquierda).
import React from "react";
import { Img } from "remotion";

type P = readonly [number, number];
export type MouthRig = {
  fwd: 1 | -1;
  lip: readonly P[];          // labio de arriba, de atrás (junto a la mejilla) a delante (bajo la nariz)
  neck: P;                    // donde la barbilla se junta con el cuello (de ahí cuelga la mandíbula)
  teeth: readonly P[];        // contorno que recorta los dientes del dibujo
  corner: { join: P; tip: P; patch: readonly [number, number, number, number] }; // comisura: unión, punta, parche
};
export type MouthState = { corner?: number; open?: number; wide?: number }; // wide < 1: boca en «O» (susto), no en «D» (risa) // corner 1 = la sonrisa del dibujo, 0 neutra, -1 fastidio

const INK = "#1b1b1b", FUR = "#f3f2ef", DARK = "#2b2927", TONGUE = "#a7a39e";
const f = (n: number) => n.toFixed(1);
const pts = (a: readonly P[]) => a.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L ");

export const Mouth: React.FC<{ rig: MouthRig; m: MouthState; src: string; w: number; h: number }> = ({ rig, m, src, w, h }) => {
  const corner = Math.max(-1, Math.min(1, m.corner ?? 1)), open = Math.max(0, Math.min(1, m.open ?? 0));
  const { fwd, lip, neck, corner: c } = rig;
  // con wide < 1 el interior empieza más adelante en el labio (la parte de atrás queda cerrada)
  const cut = (1 - Math.max(0.3, Math.min(1, m.wide ?? 1))) * 0.6;
  const seg = (() => {
    const L = lip.slice(1).map((p, i) => Math.hypot(p[0] - lip[i][0], p[1] - lip[i][1])), total = L.reduce((a, b) => a + b, 0);
    let d = cut * total, i = 0;
    while (i < L.length - 1 && d > L[i]) d -= L[i++];
    const k = L[i] ? d / L[i] : 0, a = lip[i], b = lip[i + 1];
    return [[a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] as P, ...lip.slice(i + 1)];
  })();
  const B = seg[0], F = lip[lip.length - 1];
  const depth = 34 + 92 * open;                       // cuánto baja la mandíbula (los dientes ya ocupan ~45 px)
  const lipD = seg.map(([x, y]) => [x, y + 3] as P);  // el interior empieza bajo el trazo del labio
  const bottomY = Math.max(B[1], F[1]) + depth;
  const mid = (B[0] + F[0]) / 2;
  // interior: labio de arriba y, debajo, la curva de la mandíbula de delante a atrás
  const cavity = `M ${pts(lipD)} C ${f(F[0] - fwd * 4)} ${f(F[1] + depth * 0.9)} ${f(mid + fwd * 10)} ${f(bottomY + 4)} ${f(mid)} ${f(bottomY)}`
    + ` S ${f(B[0] + fwd * 4)} ${f(B[1] + depth * 0.7)} ${f(B[0])} ${f(B[1] + 3)} Z`;
  const thick = 16;                                   // grosor de la mandíbula bajo el interior
  const jawOuter = `M ${f(neck[0])} ${f(neck[1])} C ${f(neck[0] + fwd * 6)} ${f(bottomY + thick)} ${f(mid - fwd * 10)} ${f(bottomY + thick + 6)}`
    + ` ${f(mid + fwd * 6)} ${f(bottomY + thick)} S ${f(F[0] - fwd * 2)} ${f(F[1] + depth * 0.85 + thick)} ${f(F[0] + fwd * 2)} ${f(F[1] + 2)}`;
  const jawFill = `${jawOuter} L ${pts([...lip].reverse())} Z`; // la mandíbula entera, aunque el interior sea estrecho
  // comisura: de la unión con el labio a la punta; sube con la sonrisa y cae con el fastidio
  const [jx, jy] = c.join, [tx, ty] = c.tip;
  const tipY = jy + (ty - jy) * corner + (corner < 0 ? -corner * 10 : 0), tipX = tx + (jx - tx) * (open * 0.35);
  const cornerPath = `M ${f(jx)} ${f(jy)} Q ${f((jx + tipX) / 2)} ${f(jy + (tipY - jy) * 0.25 + 2)} ${f(tipX)} ${f(tipY)}`;
  return (
    <>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {corner < 0.999 && (
          <>
            <ellipse cx={c.patch[0]} cy={c.patch[1]} rx={c.patch[2]} ry={c.patch[3]} fill={FUR} />
            <path d={cornerPath} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          </>
        )}
        {open > 0.001 && (
          <>
            <path d={jawFill} fill={FUR} />
            <path d={cavity} fill={DARK} />
            <clipPath id={`cav-${f(open)}-${fwd}`}><path d={cavity} /></clipPath>
            <ellipse clipPath={`url(#cav-${f(open)}-${fwd})`} cx={mid - fwd * 6} cy={bottomY - depth * 0.05} rx={Math.abs(F[0] - B[0]) * 0.34}
              ry={depth * 0.42} fill={TONGUE} stroke={INK} strokeWidth={3} />
            <path d={cavity} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={jawOuter} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          </>
        )}
      </svg>
      {open > 0.001 && (
        <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: w, height: h,
          clipPath: `polygon(${rig.teeth.map(([x, y]) => `${x}px ${y}px`).join(", ")})` }} />
      )}
    </>
  );
};
