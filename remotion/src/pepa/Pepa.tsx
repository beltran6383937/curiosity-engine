// Pepa: paloma gorda de azotea, jefa de obra (casco, chaleco reflectante con su nombre, portapapeles). Dibujada por código.
// Coordenadas de dibujo del casting (remotion/src/casting/Casting.tsx); el origen de la pose son los pies (560, 1690).
// flip = 1 mira a la izquierda (pico a la izquierda), -1 a la derecha.
import React from "react";

export const INK = "#1a1a1a";
type P = readonly [number, number];
export type PepaPose = {
  x: number; y: number; s?: number; flip?: 1 | -1; rot?: number; sy?: number; belly?: number;
  head?: P; headRot?: number; lid?: number; lidTilt?: number; mouth?: number; look?: P;
  wing?: number; marks?: number; ruffle?: number; legs?: [P, P]; hat?: [number, number, number]; blush?: number; clip?: boolean;
};
const W = 8, OX = 560, OY = 1690, NECK: P = [480, 1060], EYE: P = [440, 870];
const f = (n: number) => n.toFixed(1);
const g = (n: number) => n.toFixed(4);   // escalas: con 1 decimal la respiración salta de 0,8 a 0,9

export const Pepa: React.FC<{ p: PepaPose }> = ({ p }) => {
  const { x, y, s = 0.85, flip = 1, rot = 0, sy = 1, belly = 1, head = [0, 0], headRot = 0, lid = 0.45, lidTilt = 0, mouth = 0, look = [0, 0],
    wing = 0, marks = 0, ruffle = 0, legs = [[0, 0], [0, 0]], hat = [0, 0, 0], blush = 0, clip = true } = p;
  const ink = { stroke: INK, strokeWidth: W, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  // párpado: tapa la parte de arriba del ojo hasta una línea (inclinada con lidTilt: + = ceño)
  const top = EYE[1] - 50 + lid * 100, tl = top - lidTilt * 26, tr = top + lidTilt * 26;
  const spikes = (cx: number, cy: number, r: number, n: number, a0: number, a1: number) =>
    Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * (i / (n - 1)), l = 22 + 40 * ruffle * (0.6 + 0.4 * Math.sin(i * 2.3));
      const bx = cx + Math.cos(a) * r, by = cy + Math.sin(a) * r;
      return `M${f(bx + Math.cos(a + 1.4) * 14)} ${f(by + Math.sin(a + 1.4) * 14)} L${f(bx + Math.cos(a) * l)} ${f(by + Math.sin(a) * l)} L${f(bx + Math.cos(a - 1.4) * 14)} ${f(by + Math.sin(a - 1.4) * 14)}`; }).join(" ");
  const counter = (cx: number) => flip === -1 ? `translate(${2 * cx} 0) scale(-1 1)` : undefined;   // textos que no se espejan
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${g(s * flip)} ${g(s * sy)}) translate(${-OX} ${-OY})`}>
      <ellipse cx={560} cy={1700} rx={250} ry={36} fill="#000" opacity={0.22} />
      <g {...ink}>
        {/* patas */}
        {([[470, 1560], [630, 1560]] as P[]).map(([lx, ly], i) => { const [dx, dy] = legs[i];
          return <path key={i} d={`M${lx} ${ly} L${f(lx + dx)} ${f(1690 + dy)} m-48 14 l48 -14 l10 22 m-10 -22 l50 8`} fill="none" stroke="#e46a7a" strokeWidth={22} />; })}
        {/* cola */}
        <path d="M760 1330 L960 1420 L930 1470 L740 1440 Z" fill="#6f7885" />
        <path d="M915 1412 L890 1462" stroke="#2c323a" strokeWidth={14} />
        <g transform={`translate(560 1450) scale(${g(belly)} ${g(1 + (belly - 1) * 0.35)}) translate(-560 -1450)`}>
          {ruffle > 0.02 && <path d={spikes(560, 1360, 230, 14, 2.2, 7.4)} fill="#a8b0bb" opacity={Math.min(1, ruffle * 2)} />}
          <path d="M330 1220 C300 1420 380 1600 560 1600 C740 1600 820 1460 790 1300 C760 1150 600 1080 470 1100 C380 1115 340 1160 330 1220 Z" fill="#a8b0bb" />
          {/* chaleco reflectante con el nombre */}
          <path d="M352 1300 C350 1450 420 1560 560 1570 C700 1575 770 1470 780 1330 L700 1270 L560 1330 L420 1270 Z" fill="#d7f34a" />
          <path d="M362 1420 C470 1450 660 1450 776 1420" fill="none" stroke="#c9ccd1" strokeWidth={30} />
          <rect x={470} y={1330} width={180} height={62} rx={10} fill="#fff" />
          <text x={560} y={1374} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={40} fill="#e8590c" stroke="none" transform={counter(560)}>PEPA</text>
        </g>
        {/* ala con portapapeles (gira en el hombro) */}
        <g transform={`rotate(${f(-wing * 55)} 715 1250)`}>
          <path d="M700 1240 C840 1260 860 1420 770 1480 C730 1420 690 1330 700 1240 Z" fill="#8c95a1" />
          {clip && <g transform="rotate(12 835 1350)">
            <rect x={760} y={1250} width={150} height={200} rx={10} fill="#a0703c" />
            <rect x={780} y={1280} width={110} height={150} fill="#fff" />
            <path d="M800 1320 h50 M800 1350 h50 M800 1380 h50" stroke="#999" strokeWidth={6} />
            {[0, 1, 2].filter((i) => i < marks).map((i) => <path key={i} d={`M858 ${1310 + i * 30} l18 18 m0 -18 l-18 18`} stroke="#e03131" strokeWidth={7} />)}
            <rect x={815} y={1240} width={40} height={20} rx={4} fill="#c9ccd1" />
          </g>}
        </g>
        {/* cabeza y cuello (se mueven juntos: empujón de paloma, picotazos) */}
        <g transform={`translate(${f(head[0])} ${f(head[1])}) rotate(${f(headRot)} ${NECK[0]} ${NECK[1]})`}>
          <path d="M380 1130 C370 1040 420 980 470 980 C560 980 620 1040 610 1140 C560 1190 440 1190 380 1130 Z" fill="url(#pepaTorna)" />
          {ruffle > 0.02 && <path d={spikes(480, 880, 140, 9, 3.6, 6.6)} fill="#a8b0bb" opacity={Math.min(1, ruffle * 2)} />}
          <circle cx={480} cy={900} r={150} fill="#a8b0bb" />
          {/* pico: la mitad de abajo se abre al hablar */}
          <path d="M350 935 L262 950 C290 958 330 952 352 944 Z" fill="#7a2b2b" transform={`rotate(${f(-mouth * 26)} 350 936)`} />
          <path d="M352 936 L258 951 C292 975 330 968 352 952 Z" fill="#3a3a3a" transform={`rotate(${f(-mouth * 26)} 350 936)`} />
          <path d="M352 888 C310 900 276 924 256 950 L352 936 Z" fill="#3a3a3a" />
          <ellipse cx={352} cy={895} rx={26} ry={18} fill="#f1efe9" />
          {blush > 0 && <ellipse cx={500} cy={960} rx={46} ry={22} fill="#ff8fa3" stroke="none" opacity={0.6 * blush} />}
          {/* ojo naranja con párpado */}
          <clipPath id="pepaEye"><circle cx={EYE[0]} cy={EYE[1]} r={46} /></clipPath>
          <circle cx={EYE[0]} cy={EYE[1]} r={46} fill="#f08c1a" />
          <circle cx={EYE[0] - 10 + look[0]} cy={EYE[1] + 2 + look[1]} r={14} fill={INK} stroke="none" />
          <path d={`M${EYE[0] - 60} ${EYE[1] - 60} L${EYE[0] + 60} ${EYE[1] - 60} L${EYE[0] + 60} ${f(tr)} L${EYE[0] - 60} ${f(tl)} Z`} fill="#8c95a1" stroke="none" clipPath="url(#pepaEye)" />
          {lid > 0.02 && <path d={`M${EYE[0] - 46} ${f(tl + (lid > 0.95 ? 0 : 0))} L${EYE[0] + 46} ${f(tr)}`} strokeWidth={7} clipPath="url(#pepaEye)" />}
          <circle cx={EYE[0]} cy={EYE[1]} r={46} fill="none" />
          {/* casco */}
          <g transform={`translate(${f(hat[0])} ${f(hat[1])}) rotate(${f(hat[2])} 485 790)`}>
            <path d="M360 790 C370 690 600 690 610 790 Z" fill="#ffd21f" />
            <path d="M470 702 C475 730 478 760 480 790" fill="none" strokeWidth={6} />
            <path d="M330 795 L640 795" strokeWidth={22} stroke="#e6b800" />
            <path d="M330 784 L640 784 M330 806 L640 806" strokeWidth={5} />
          </g>
        </g>
      </g>
      <defs>
        <linearGradient id="pepaTorna" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f8f6e" /><stop offset="0.5" stopColor="#7b4f9e" /><stop offset="1" stopColor="#3f8f6e" />
        </linearGradient>
      </defs>
    </g>
  );
};

// Condensadora de aire acondicionado (unidad exterior) dibujada, con ventilador que gira
export const Condensadora: React.FC<{ fan: number; splat?: number; shake?: number }> = ({ fan, splat = 0, shake = 0 }) => (
  <g transform={`translate(${f(shake)} 0)`} stroke={INK} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round">
    <ellipse cx={880} cy={1660} rx={220} ry={30} fill="#000" opacity={0.22} stroke="none" />
    <rect x={700} y={1000} width={380} height={640} rx={22} fill="#e9e7e1" />
    <rect x={700} y={1000} width={380} height={40} rx={18} fill="#d4d1c8" />
    <circle cx={900} cy={1330} r={150} fill="#3b4048" />
    <g transform={`rotate(${f(fan)} 900 1330)`}>
      {[0, 1, 2].map((i) => <path key={i} d="M900 1330 C930 1260 990 1250 1010 1290 C980 1310 940 1320 900 1330 Z" fill="#8a929c" transform={`rotate(${i * 120} 900 1330)`} />)}
    </g>
    <circle cx={900} cy={1330} r={22} fill="#c9ccd1" />
    {[1, 2, 3].map((i) => <circle key={i} cx={900} cy={1330} r={i * 48} fill="none" strokeWidth={5} opacity={0.8} />)}
    <path d="M900 1180 V1480 M750 1330 H1050" strokeWidth={5} />
    <rect x={740} y={1530} width={120} height={60} rx={6} fill="#cfcbc1" strokeWidth={5} />
    {splat > 0 && <g transform={`translate(770 1440) scale(${g(splat)})`}>
      <path d="M0 -40 C30 -42 44 -10 38 10 C60 18 58 44 30 44 C26 70 -10 72 -16 48 C-48 54 -58 22 -34 8 C-52 -14 -30 -40 0 -40 Z" fill="#fbfbf6" strokeWidth={6} />
      <circle cx={-6} cy={4} r={12} fill="#cfcfc4" stroke="none" />
    </g>}
  </g>
);

export const Caja: React.FC<{ y: number }> = ({ y }) => (   // caja de herramientas del instalador
  <g transform={`translate(0 ${f(y)})`} stroke={INK} strokeWidth={W} strokeLinejoin="round">
    <rect x={40} y={1500} width={260} height={160} rx={14} fill="#d9480f" />
    <rect x={40} y={1500} width={260} height={40} rx={10} fill="#b8400e" />
    <path d="M120 1500 C120 1450 220 1450 220 1500" fill="none" strokeWidth={14} />
    <rect x={150} y={1555} width={40} height={24} rx={4} fill="#c9ccd1" />
  </g>
);

export const Bocata: React.FC<{ x: number; y: number; left: number }> = ({ x, y, left }) => left > 0.01 ? (   // left = lo que queda (1 entero)
  <g transform={`translate(${f(x)} ${f(y)})`} stroke={INK} strokeWidth={W} strokeLinejoin="round">
    <clipPath id="bocataLeft"><rect x={-110} y={-80} width={f(220 * left)} height={160} /></clipPath>
    <g clipPath="url(#bocataLeft)">
      <path d="M-100 0 C-100 -46 100 -46 100 0 C100 30 -100 30 -100 0 Z" fill="#e3a857" />
      <path d="M-96 6 C-40 22 40 22 96 6" fill="none" stroke="#c0392b" strokeWidth={10} />
      <path d="M-70 -14 l8 -6 M-20 -24 l8 -5 M30 -22 l8 -6" strokeWidth={5} />
    </g>
    {left < 1 && <path d={`M${f(-110 + 220 * left)} -36 q -14 12 0 18 q -14 12 0 18 q -14 12 0 18`} fill="none" strokeWidth={6} />}
  </g>
) : null;
