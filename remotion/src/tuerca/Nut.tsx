// La Tuerca · personaje 100 % por código. Tuerca hexagonal M24 de acero en 3/4: cara con chaflán (el círculo de las
// tuercas de verdad), grosor visible con las caras laterales torneadas, «M24» grabado arriba y marca de calidad «8»
// estampada. El agujero roscado es la boca. Obrero: gorra, bigote, tripa, cinturón con su nombre bordado, guantes y botas.
// Brazos y piernas de goma (sin codos ni muñecas). Origen = suelo entre los pies; px del lienzo 1080×1920.
import React from "react";

export const INK = "#161616";
const f = (n: number) => n.toFixed(1);
type P = readonly [number, number];
export type NutPose = {
  x: number; y: number; scale?: number;
  rot?: number; pivot?: P;            // giro de todo el cuerpo (grados) alrededor de pivot (px locales, defecto: centro)
  sy?: number;                         // estirar / aplastar (volumen constante)
  belly?: number;                      // 1 normal · <1 metida · >1 fuera
  lid?: number; brow?: number;         // párpado 0 abierto‥1 cerrado · ceja + cae / − sube
  look?: P;                            // pupilas
  mouth?: number;                      // 0 cerrada‥1 abierta (el agujero roscado)
  cheeks?: number; sweat?: number;
  hl: P; hr: P;                        // manos (px locales)
  fl?: P; fr?: P;                      // pies
  limbs?: boolean;                     // false = recogidos (rodando)
  cap?: boolean; capOff?: readonly [number, number, number]; buckle?: boolean; wrench?: "belt" | "hand" | "none"; phone?: boolean;
  face?: number;                       // -1‥1: gira la cara un poco a un lado
};

const R = 165, H = R * Math.sqrt(3) / 2, E: P = [44, -30];   // radio, medio alto, grosor (hacia arriba-derecha)
const CY = -340;                                              // centro del hexágono de pie
const hexPts = (r: number): P[] => Array.from({ length: 6 }, (_, i) => [Math.cos(Math.PI / 3 * i) * r, Math.sin(Math.PI / 3 * i) * r] as P);
const pts = (a: readonly P[]) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");

const Hose: React.FC<{ a: P; b: P; bend: number; w: number; color: string }> = ({ a, b, bend, w, color }) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const c: P = [mx - dy / l * bend, my + dx / l * bend];
  const d = `M ${f(a[0])} ${f(a[1])} Q ${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
  return (<><path d={d} stroke={INK} strokeWidth={w + 15} fill="none" strokeLinecap="round" />
    <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
    <path d={d} stroke="#fff" strokeWidth={w * 0.22} fill="none" strokeLinecap="round" opacity={0.25} transform={`translate(${-w * 0.18} ${-w * 0.18})`} /></>);
};

const Glove: React.FC<{ p: P; flip?: boolean }> = ({ p, flip }) => (
  <g transform={`translate(${f(p[0])} ${f(p[1])}) scale(${flip ? -1 : 1} 1)`}>
    <ellipse cx={-22} cy={-14} rx={15} ry={12} fill="#e8b830" stroke={INK} strokeWidth={8} transform="rotate(-30 -22 -14)" />
    <circle r={33} fill="#e8b830" stroke={INK} strokeWidth={9} />
    <path d="M -12 -14 Q 2 -20 16 -12 M -14 2 Q 2 -4 18 4" stroke="#9a7414" strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

const Boot: React.FC<{ p: P; s: 1 | -1 }> = ({ p, s }) => (
  <g transform={`translate(${f(p[0])} ${f(p[1])}) scale(${s} 1)`}>
    <path d="M -34 -6 L -30 -52 Q -4 -64 18 -48 Q 58 -40 66 -14 L 66 -6 Z" fill="#5a3b22" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <rect x={-40} y={-10} width={112} height={14} rx={5} fill="#2a2a2a" stroke={INK} strokeWidth={7} />
    <path d="M 4 -50 L 14 -36 M 14 -50 L 24 -38" stroke="#e4c48a" strokeWidth={4} strokeLinecap="round" />
  </g>
);

export const Wrench: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M -10 -70 L 10 -70 L 9 50 L -9 50 Z" fill="#b9c2c9" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -30 -112 Q -36 -78 -12 -66 L 12 -66 Q 36 -78 30 -112 L 16 -104 L 14 -86 L -14 -86 L -16 -104 Z" fill="#c9d1d7" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <circle cy={66} r={24} fill="#c9d1d7" stroke={INK} strokeWidth={7} /><circle cy={66} r={11} fill="#3a3f43" stroke={INK} strokeWidth={4} />
    <line x1={-3} y1={-50} x2={-3} y2={36} stroke="#fff" strokeWidth={4} opacity={0.6} />
  </g>
);

export const Phone: React.FC = () => (
  <g><rect x={-22} y={-40} width={44} height={80} rx={9} fill="#26292c" stroke={INK} strokeWidth={6} />
    <rect x={-16} y={-32} width={32} height={58} rx={4} fill="#7fd3ff" /></g>
);

export const Nut: React.FC<{ p: NutPose; id: string }> = ({ p, id }) => {
  const { x, y, scale = 1, rot = 0, sy = 1, belly = 1, lid = 0.5, brow = 0, look = [0, 0], mouth = 0.25, cheeks = 0, sweat = 0,
    hl, hr, fl = [-78, 0], fr = [78, 0], limbs = true, cap = true, capOff = [0, 0, 0], buckle = true, wrench = "belt", phone = false, face = 0 } = p;
  const sx = 1 / Math.sqrt(sy);                                   // volumen constante
  const piv = p.pivot ?? [0, CY];
  const fx = face * 26;                                           // la cara se desplaza al girar
  const hex = hexPts(R), inner = H * 0.985;
  // caras laterales visibles (normal hacia el grosor E)
  const sides = hex.map((a, i) => { const b = hex[(i + 1) % 6], n = [b[1] - a[1], -(b[0] - a[0])], dot = n[0] * E[0] + n[1] * E[1];
    return { a, b, dot, mid: Math.atan2((a[1] + b[1]) / 2, (a[0] + b[0]) / 2) }; }).filter((s) => s.dot > 0);
  const sideFill = (m: number) => (m < -1.2 ? "url(#" + id + "-top)" : m < 0 ? "#8e979e" : "#6c747b");
  const hole = { cx: fx * 0.6, cy: 34, r: 54 }, hry = hole.r * (0.62 + 0.5 * mouth), hrx = hole.r * (1 + 0.06 * mouth);
  const bellyC: P = [0, CY + H + 22], brx = 132 * belly, bry = 74 * (0.7 + 0.3 * belly);
  const sh: [P, P] = [[-R * sx * 0.97, CY + 18], [R * sx * 0.97, CY + 18]];
  const legTop: [P, P] = [[-56, CY + H + 70], [56, CY + H + 70]];
  // cuerpo: escala sy desde la cadera (las piernas no se aplastan)
  const hip = CY + H + 60;
  const bodyT = `translate(0 ${f(hip)}) scale(${f(sx)} ${f(sy)}) translate(0 ${f(-hip)})`;
  const map = (q: P): P => [q[0] * sx, hip + (q[1] - hip) * sy];   // un punto del cuerpo, ya escalado (para hombros)
  const S0 = map(sh[0]), S1 = map(sh[1]);
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${scale}) rotate(${f(rot)} ${f(piv[0])} ${f(piv[1])})`}>
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3e8eb" /><stop offset="0.45" stopColor="#b3bcc2" /><stop offset="1" stopColor="#7f888f" />
        </linearGradient>
        <linearGradient id={`${id}-cham`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f5f6" /><stop offset="0.5" stopColor="#9aa3a9" /><stop offset="1" stopColor="#5f676d" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfd6da" /><stop offset="1" stopColor="#a4adb3" />
        </linearGradient>
        <radialGradient id={`${id}-belly`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#e6ebee" /><stop offset="0.55" stopColor="#a9b2b8" /><stop offset="1" stopColor="#737c83" />
        </radialGradient>
        <clipPath id={`${id}-hex`}><polygon points={pts(hex.map(([a, b]) => [a, b + CY] as P))} /></clipPath>
        <clipPath id={`${id}-hole`}><ellipse cx={hole.cx} cy={CY + hole.cy} rx={hrx} ry={hry} /></clipPath>
      </defs>
      {/* sombra de contacto en el suelo */}
      {limbs && <ellipse cx={0} cy={8} rx={190} ry={26} fill="#000" opacity={0.3} />}
      {/* piernas y botas */}
      {limbs && [0, 1].map((i) => { const top = legTop[i], ft = i ? fr : fl, s = i ? 1 : -1;
        return <g key={i}><Hose a={top} b={[ft[0], ft[1] - 30]} bend={s * 18} w={32} color="#7a838a" /><Boot p={ft} s={s as 1 | -1} /></g>; })}
      {/* brazos (detrás del cuerpo arrancan; las manos van delante) */}
      {limbs && <><Hose a={S0} b={hl} bend={-30} w={28} color="#7a838a" /><Hose a={S1} b={hr} bend={30} w={28} color="#7a838a" /></>}
      <g transform={bodyT}>
        {/* grosor: caras laterales torneadas */}
        {sides.map((s, i) => { const a: P = [s.a[0], s.a[1] + CY], b: P = [s.b[0], s.b[1] + CY];
          const q = [a, b, [b[0] + E[0], b[1] + E[1]], [a[0] + E[0], a[1] + E[1]]] as P[];
          return <g key={i}>
            <polygon points={pts(q)} fill={sideFill(s.mid)} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
            {[0.3, 0.62].map((k) => <line key={k} x1={a[0] + E[0] * k} y1={a[1] + E[1] * k} x2={b[0] + E[0] * k} y2={b[1] + E[1] * k} stroke="#fff" strokeWidth={2.5} opacity={0.35} />)}
          </g>; })}
        {/* M24 grabado en la cara de arriba */}
        <text x={36} y={CY - H - 9} fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={22} fill="#6d757b"
          transform={`skewX(-48)`} style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}>M24</text>
        {/* cara frontal: chaflán en las esquinas + cara plana */}
        <polygon points={pts(hex.map(([a, b]) => [a, b + CY] as P))} fill={`url(#${id}-cham)`} />
        <circle clipPath={`url(#${id}-hex)`} cx={0} cy={CY} r={inner} fill={`url(#${id}-face)`} />
        <circle clipPath={`url(#${id}-hex)`} cx={0} cy={CY} r={inner} fill="none" stroke="#5c646a" strokeWidth={3} opacity={0.7} />
        <polygon points={pts(hex.map(([a, b]) => [a, b + CY] as P))} fill="none" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        {/* brillo y marcas de uso */}
        <path d={`M ${f(-R * 0.55)} ${f(CY - H * 0.55)} Q ${f(-R * 0.62)} ${f(CY - H * 0.1)} ${f(-R * 0.5)} ${f(CY + H * 0.25)}`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.55} />
        <path d={`M ${f(R * 0.42)} ${f(CY + H * 0.5)} l 18 -6 M ${f(R * 0.36)} ${f(CY + H * 0.58)} l 12 -3`} stroke="#5c646a" strokeWidth={2.5} opacity={0.6} />
        {/* marca de calidad estampada (como las tuercas reales) */}
        <text x={R * 0.62} y={CY + H * 0.62} fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={26} fill="#6a7278" opacity={0.85}
          textAnchor="middle" transform={`rotate(-28 ${f(R * 0.62)} ${f(CY + H * 0.62)})`}>8</text>
        {/* boca = agujero roscado: avellanado, interior, filetes de rosca y lengua */}
        <ellipse cx={hole.cx} cy={CY + hole.cy} rx={hrx + 10} ry={hry + 9} fill="#c7ced3" stroke="#5c646a" strokeWidth={3} />
        <ellipse cx={hole.cx} cy={CY + hole.cy} rx={hrx} ry={hry} fill="#1b1e21" />
        <g clipPath={`url(#${id}-hole)`}>
          {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
            <path key={k} d={`M ${f(hole.cx - hrx)} ${f(CY + hole.cy + k * 15 - 6)} Q ${f(hole.cx - hrx * 0.45)} ${f(CY + hole.cy + k * 15 + 8)} ${f(hole.cx - hrx * 0.1)} ${f(CY + hole.cy + k * 15 + 14)}`}
              stroke="#5b6267" strokeWidth={4} fill="none" />))}
          {mouth > 0.35 && <ellipse cx={hole.cx + 6} cy={CY + hole.cy + hry * 0.85} rx={hrx * 0.62} ry={hry * 0.45} fill="#c85a5a" stroke={INK} strokeWidth={4} />}
        </g>
        <ellipse cx={hole.cx} cy={CY + hole.cy} rx={hrx} ry={hry} fill="none" stroke={INK} strokeWidth={8} />
        {/* bigote */}
        <path transform={`translate(${f(fx * 0.7)} ${f(CY + hole.cy - hry - 4)})`}
          d="M -86 10 Q -50 -26 0 -8 Q 50 -26 86 10 Q 56 2 34 14 Q 14 4 0 12 Q -14 4 -34 14 Q -56 2 -86 10 Z" fill="#4a3426" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* mofletes inflados */}
        {cheeks > 0 && [-1, 1].map((s) => <ellipse key={s} cx={s * 118 + fx} cy={CY + 34} rx={34 * cheeks} ry={26 * cheeks} fill="#e79a9a" opacity={0.6} />)}
        {/* ojos: grandes, párpado de cansado y ojeras */}
        {[-1, 1].map((s) => { const ex = s * 60 + fx, ey = CY - 70, cid = `${id}-eye${s}`;
          return <g key={s}>
            <path d={`M ${f(ex - 32)} ${f(ey + 46)} Q ${f(ex)} ${f(ey + 64)} ${f(ex + 32)} ${f(ey + 46)}`} stroke="#5f676d" strokeWidth={5} fill="none" strokeLinecap="round" />
            <clipPath id={cid}><ellipse cx={ex} cy={ey} rx={36} ry={41} /></clipPath>
            <ellipse cx={ex} cy={ey} rx={36} ry={41} fill="#fff" />
            <g clipPath={`url(#${cid})`}>
              <circle cx={ex + look[0] + face * 8} cy={ey + 8 + look[1]} r={14} fill={INK} />
              <circle cx={ex + look[0] + face * 8 + 5} cy={ey + 3 + look[1]} r={4} fill="#fff" />
              <rect x={ex - 42} y={ey - 46} width={84} height={6 + 84 * lid} fill="#a2abb1" />
              <line x1={ex - 40} x2={ex + 40} y1={ey - 40 + 84 * lid} y2={ey - 40 + 84 * lid} stroke={INK} strokeWidth={7} />
            </g>
            <ellipse cx={ex} cy={ey} rx={36} ry={41} fill="none" stroke={INK} strokeWidth={8} />
            <path d={`M ${f(ex - 34)} ${f(ey - 56 + brow * (s < 0 ? 0.5 : 1))} Q ${f(ex)} ${f(ey - 66 + brow * 0.75)} ${f(ex + 34)} ${f(ey - 56 + brow * (s < 0 ? 1 : 0.5))}`}
              stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
          </g>; })}
        {/* gorra de obrero, un poco ladeada (deja ver el M24) */}
        {cap && <g transform={`translate(${f(-34 + capOff[0])} ${f(CY - H - 6 + capOff[1])}) rotate(${f(-8 + capOff[2])})`}>
          <path d="M -104 8 Q -96 -96 0 -98 Q 96 -96 102 8 Z" fill="#e8742a" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <path d="M -56 -86 Q -40 -40 -40 6 M 52 -86 Q 40 -40 40 6" stroke="#b9541a" strokeWidth={4} fill="none" />
          <circle cy={-98} r={9} fill="#e8742a" stroke={INK} strokeWidth={6} />
          <path d="M 70 -2 Q 150 -14 176 14 Q 120 22 64 12 Z" fill="#d8641f" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        </g>}
        {/* tripa con cinturón: nombre bordado, hebilla y llave colgada (belly 0 = recogida, rodando) */}
        {belly > 0.08 && <>
        <ellipse cx={bellyC[0]} cy={bellyC[1]} rx={brx} ry={bry} fill={`url(#${id}-belly)`} stroke={INK} strokeWidth={11} />
        <path d={`M ${f(-brx * 0.5)} ${f(bellyC[1] - bry * 0.45)} Q ${f(-brx * 0.2)} ${f(bellyC[1] - bry * 0.7)} ${f(brx * 0.15)} ${f(bellyC[1] - bry * 0.62)}`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.5} />
        <path d={`M ${f(-brx * 0.99)} ${f(bellyC[1] + bry * 0.2)} Q 0 ${f(bellyC[1] + bry * 0.95)} ${f(brx * 0.99)} ${f(bellyC[1] + bry * 0.2)}`} stroke={INK} strokeWidth={40} fill="none" />
        <path d={`M ${f(-brx * 0.99)} ${f(bellyC[1] + bry * 0.2)} Q 0 ${f(bellyC[1] + bry * 0.95)} ${f(brx * 0.99)} ${f(bellyC[1] + bry * 0.2)}`} stroke="#7a4b26" strokeWidth={27} fill="none" />
        <g transform={`translate(${f(-brx * 0.52)} ${f(bellyC[1] + bry * 0.55)}) rotate(14)`}>
          <rect x={-50} y={-19} width={100} height={36} rx={16} fill="#f4efe2" stroke={INK} strokeWidth={6} />
          <rect x={-44} y={-13} width={88} height={24} rx={11} fill="none" stroke="#c0392b" strokeWidth={2} strokeDasharray="5 4" />
          <text y={7} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={20} fill="#c0392b">TUERCA</text>
        </g>
        {buckle && <g transform={`translate(${f(brx * 0.12)} ${f(bellyC[1] + bry * 0.6)})`}>
          <rect x={-28} y={-22} width={56} height={42} rx={7} fill="#d9b44a" stroke={INK} strokeWidth={7} />
          <rect x={-13} y={-9} width={26} height={16} rx={3} fill="none" stroke={INK} strokeWidth={4} />
        </g>}
        {wrench === "belt" && <g transform={`translate(${f(brx * 0.8)} ${f(bellyC[1] + bry * 0.75)}) rotate(-14)`}><Wrench s={0.62} /></g>}
        </>}
        {sweat > 0 && <path transform={`translate(${f(-R * 0.8)} ${f(CY - H * 0.45 + sweat * 80)})`} d="M 0 -28 Q 18 0 0 13 Q -18 0 0 -28 Z" fill="#bfe3ff" stroke={INK} strokeWidth={5} />}
      </g>
      {/* manos delante, con lo que lleven */}
      {limbs && <>
        <Glove p={hl} />
        {phone && <g transform={`translate(${f(hr[0] - 6)} ${f(hr[1] - 26)}) rotate(-12)`}><Phone /></g>}
        {wrench === "hand" && <g transform={`translate(${f(hr[0])} ${f(hr[1] - 50)}) rotate(18)`}><Wrench s={0.85} /></g>}
        <Glove p={hr} flip />
      </>}
    </g>
  );
};

export const NUT = { R, H, CY, E };
