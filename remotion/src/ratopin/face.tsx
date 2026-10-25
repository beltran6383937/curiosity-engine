// Ratopín · ojos y cejas por código, encima de las cabezas aprobadas (que vienen con el blanco del ojo vacío).
// Coordenadas en px de la imagen de cada cabeza (EyeSpot se mide una vez por dibujo de cabeza). Estilo de la hoja:
// pupila negra grande y ovalada con un brillo, párpado superior con trazo grueso, cejas cortas, gruesas y afiladas.
import React, { useState } from "react";
import { delayRender, continueRender, cancelRender } from "remotion";

export type EyeSpot = { cx: number; cy: number; rx: number; ry: number; tilt?: number };
export type BrowSpot = { x: number; y: number; len: number; tilt?: number }; // centro, largo y ángulo en reposo
export type FaceRig = { eyes: readonly EyeSpot[]; brows: readonly BrowSpot[]; mask: string }; // mask = PNG blanco donde hay ojo

export type Expr = {
  look?: readonly [number, number]; // dirección de las pupilas, -1..1 en cada eje (x: derecha, y: abajo)
  pupil?: number;                   // tamaño relativo de la pupila (incredulidad < 1)
  lid?: number;                     // párpado superior: 0 abierto … 1 cerrado
  brow?: number;                    // altura de las cejas en px (negativo = suben)
  browTilt?: number;                // grados extra (positivo = enfado: extremo interior abajo)
};

const INK = "#1b1b1b";
const FUR = "#f6f5f2";

// Montar con key = cabeza: la máscara es una <image> de SVG que Remotion no espera sola, así que cada montaje retiene
// el fotograma hasta que carga, y si no carga el render falla en vez de salir sin ojos.
export const Face: React.FC<{ rig: FaceRig; e: Expr; w: number; h: number; uid: string }> = ({ rig, e, w, h, uid }) => {
  const [hold] = useState(() => delayRender(`máscara de ojos ${rig.mask}`));
  const [lx, ly] = e.look ?? [0, 0];
  const lid = Math.min(Math.max(e.lid ?? 0, 0), 1);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <mask id={`${uid}-eyes`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
        <image href={rig.mask} x={0} y={0} width={w} height={h} onLoad={() => continueRender(hold)}
          onError={() => cancelRender(new Error(`No carga la máscara de ojos ${rig.mask}`))} />
      </mask>
      <g mask={`url(#${uid}-eyes)`}>
        {rig.eyes.map((s, i) => {
          // La pupila escala con el ancho del ojo: en el ojo lejano (estrecho, de perfil) se aplasta en X.
          const pr = (e.pupil ?? 1) * s.ry * 0.42, prx = pr * Math.min(1, s.rx / (s.ry * 0.62));
          const px = s.cx + lx * Math.max(s.rx - prx * 0.8, 0), py = s.cy + ly * (s.ry - pr * 1.05);
          const top = s.cy - s.ry - 4, lidY = top + (2 * s.ry + 8) * lid;
          return (
            <g key={i}>
              <ellipse cx={px} cy={py} rx={prx * 0.82} ry={pr * 1.05} fill={INK} />
              <circle cx={px + prx * 0.28} cy={py - pr * 0.42} r={Math.min(prx, pr) * 0.24} fill="#fff" />
              {lid > 0.02 && <rect x={s.cx - s.rx - 4} y={top - 2} width={2 * s.rx + 8} height={lidY - top + 2} fill={FUR} />}
              {/* el borde del párpado baja hasta algo por debajo del centro: con el ojo cerrado queda la raya del párpado */}
              {lid > 0.02 && (() => { const y = Math.min(lidY, s.cy + s.ry * 0.4); return <path d={`M ${s.cx - s.rx - 4} ${y} Q ${s.cx} ${y + 5 + 6 * lid} ${s.cx + s.rx + 4} ${y}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />; })()}
            </g>
          );
        })}
      </g>
      {rig.brows.map((b, i) => {
        const side = i === 0 ? 1 : -1; // ceja 0 = la de la izquierda en pantalla: su extremo interior está a la derecha
        const a = (b.tilt ?? 0) + side * (e.browTilt ?? 0);
        const y = b.y + (e.brow ?? 0), half = b.len / 2;
        return (
          <path key={i} transform={`rotate(${a} ${b.x} ${y})`} fill={INK}
            d={`M ${b.x - half} ${y + 3} Q ${b.x} ${y - 9} ${b.x + half} ${y - 1} Q ${b.x} ${y - 1} ${b.x - half} ${y + 3} Z`} />
        );
      })}
    </svg>
  );
};
