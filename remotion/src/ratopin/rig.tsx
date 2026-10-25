// Ratopín · renderizador de recorte. Cada pieza es un PNG aprobado con su articulación (pivot, en px de su propia imagen)
// y su enganche en el padre (at, en px de la imagen del padre). Los hijos con z < 0 van DETRÁS del dibujo del padre
// (brazo lejano tras el torso) y los de z >= 0 delante. La sustitución cambia el PNG sin mover la articulación.
import React from "react";
import { Img, staticFile } from "remotion";

// Un dibujo: su PNG, su articulación y el giro base que alinea su eje con el del padre (las manos de sustitución vienen
// dibujadas cada una con la muñeca en otra dirección).
export type Drawing = { src: string; pivot: readonly [number, number]; r0?: number };
export type Piece = {
  id: string;
  draw: Drawing | Record<string, Drawing>; // un dibujo, o varios de sustitución por nombre
  at: readonly [number, number];
  z?: number;
  children?: Piece[];
  overlay?: (pose: Joint, d: number, name: string) => React.ReactNode; // SVG por código encima (pupilas, cejas, pantalla)
};
export type Joint = { r?: number; x?: number; y?: number; sx?: number; sy?: number; sub?: string; hide?: boolean };
export type Pose = Record<string, Joint>;

const drawingOf = (p: Piece, j: Joint): [string, Drawing] => {
  if ("src" in p.draw) return ["", p.draw as Drawing];
  const all = p.draw as Record<string, Drawing>;
  const name = j.sub ?? Object.keys(all)[0];
  return [name, all[name]];
};
export const asset = (s: string) => (s.startsWith("data:") ? s : staticFile(s));

export const Part: React.FC<{ piece: Piece; pose: Pose; d: number }> = ({ piece, pose, d }) => {
  const j = pose[piece.id] ?? {};
  if (j.hide) return null;
  const [name, dr] = drawingOf(piece, j);
  const kids = [...(piece.children ?? [])].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  const [px, py] = dr.pivot;
  return (
    <div style={{
      position: "absolute", left: piece.at[0] - px, top: piece.at[1] - py,
      transformOrigin: `${px}px ${py}px`,
      transform: `translate(${j.x ?? 0}px, ${j.y ?? 0}px) rotate(${(j.r ?? 0) + (dr.r0 ?? 0)}deg) scale(${j.sx ?? 1}, ${j.sy ?? 1})`,
    }}>
      {kids.filter((k) => (k.z ?? 0) < 0).map((k) => <Part key={k.id} piece={k} pose={pose} d={d} />)}
      {/* position: relative → el dibujo se pinta en orden de árbol con los hijos posicionados (si no, CSS lo pinta
          debajo de todos ellos y los z < 0 acabarían delante) */}
      <Img src={asset(dr.src)} style={{ display: "block", position: "relative" }} />
      {piece.overlay?.(j, d, name)}
      {kids.filter((k) => (k.z ?? 0) >= 0).map((k) => <Part key={k.id} piece={k} pose={pose} d={d} />)}
    </div>
  );
};

// Temblor de línea: desplazamiento con ruido de semilla distinta en cada dibujo → la línea vibra como el lápiz.
// scale en px: 0 lo apaga (para comparar dibujos sin temblor en la verificación).
export const Boil: React.FC<{ d: number; scale?: number; children: React.ReactNode }> = ({ d, scale = 2.5, children }) => {
  const id = `boil-${d}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={d + 1} />
          <feDisplacementMap in="SourceGraphic" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, filter: scale ? `url(#${id})` : undefined }}>{children}</div>
    </>
  );
};
