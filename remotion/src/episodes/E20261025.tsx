// Episodio 2026-10-25 · «Tres preguntas que haría un buen recepcionista» (pilar ia_explicada).
// Guion, ganchos y claims: episodes/2026-10-25/episode.json · storyboard: episodes/2026-10-25/storyboard.md.
// Recreación ficticia rotulada; la parte de la IA es la DEMO de P&Q Field Operations (datos ficticios): pregunta,
// apunta y propone cita; la confirma el técnico. Sin cifras, marcas, matrículas, teléfonos ni direcciones legibles.
// Escenarios nuevos dibujados aquí: caldera mural genérica, bloque de pisos en sección, calle de mañana con portales
// iguales y furgoneta por dentro. Hilo visual: la libreta y las tres tarjetas 1-2-3 en oro.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { PQReel, World, Cam, Glow, Label, Chip, Headline, Bubble, Card, CallCard, Tap, CommentBox, EndCard, Burst,
  C, MONO, SANS, SERIF, k, mix, inout, inOut, shake, useSpring, type CurioProps, type SceneProps, type SceneDef } from "../pq";
import { Room, Kitchen, Street, Worker, Client, Toolbox, PhoneProp, POSE, BUST, blendPose, poseAt, type Pose } from "../pqworld";

export const id = "2026-10-25";

// ---------- utilidades ----------
const smooth = (n: number) => n * n * (3 - 2 * n);
const lin = (n: number) => n;
const walk = (t: number): Pose => blendPose(POSE.walkA, POSE.walkB, (Math.sin(t * 7) + 1) / 2);
/** n-ésima aparición de una palabra en la frase i, en tiempo de la escena */
const nth = (p: SceneProps, i: number, re: RegExp, n: number) => {
  const base = p.line(i).start - p.w(i, /(?!)/);
  const ws = (p.line(i).words ?? []).filter((x) => re.test(x.w));
  const hit = ws[Math.min(n, ws.length - 1)];
  return (hit?.s ?? p.line(i).start) - base;
};
const PENCIL = "#4A4F55";

// Rótulos fijos: RECREACIÓN arriba; DEMO debajo cuando toca (Label tiene top fijo: se apila desplazando el contenedor)
const Labels: React.FC<{ t: number; demo?: boolean }> = ({ t, demo }) => (
  <>
    <Label text="RECREACIÓN · personajes ficticios" t={t} at={-1} />
    {demo && <div style={{ position: "absolute", inset: 0, translate: "0 62px" }}><Label text="DEMO · DATOS FICTICIOS" t={t} at={-1} c={C.oro} /></div>}
  </>
);
const DimHTML: React.FC<{ o: number }> = ({ o }) => (o > 0 ? <AbsoluteFill style={{ background: C.noche, opacity: o }} /> : null);

// ---------- poses propias ----------
const PHONE_WRITE: Pose = { lean: 4, head: 16, hN: [34, -232], hF: [118, -64], fN: [18, 245], fF: [-18, 245] }; // móvil sujeto con el hombro, escribe
const LOAD: Pose = { lean: 6, head: 8, hN: [170, -150], hF: [150, -140], fN: [18, 245], fF: [-18, 245] }; // carga la caja delante del pecho
const SHELVE: Pose = { lean: 14, head: 14, hN: [330, -110], hF: [300, -104], fN: [60, 240], fF: [-18, 245] }; // la deja en la balda
const CROUCH_WORK: Pose = { lean: 20, head: -8, hN: [140, -36], hF: [118, -24], fN: [70, 150], fF: [-50, 150] }; // agachado en el enchufe

// ---------- tarjeta 1-2-3 (SVG, mundo) ----------
const QCardSVG: React.FC<{ x: number; y: number; r: number; n: string; s?: number; o?: number }> = ({ x, y, r, n, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
    <rect x={-95} y={-130} width={190} height={260} rx={20} fill={C.noche} stroke={C.oro} strokeWidth={6} />
    <rect x={-80} y={-115} width={160} height={230} rx={12} fill="none" stroke={C.oroOscuro} strokeWidth={2} />
    <path d="M 0 -96 L 6 -86 L 0 -76 L -6 -86 Z" fill={C.oro} opacity={0.8} />
    <text x={0} y={58} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={150} fill={C.oro}>{n}</text>
  </g>
);
// ---------- tarjeta que se gira y se acopla arriba a la izquierda (HTML) ----------
const FlipCard: React.FC<{ t: number; at: number; n: string; title: string }> = ({ t, at, n, title }) => {
  const fl = k(t, at, 0.45, inOut), mv = k(t, at + 0.6, 0.5, inOut);
  const ang = mix(180, 0, fl), front = ang < 90;
  const sx = Math.max(0.03, Math.abs(Math.cos((ang * Math.PI) / 180)));
  const lift = 1 + 0.08 * Math.sin(fl * Math.PI);
  return (
    <div style={{ position: "absolute", left: mix(280, 64, mv), top: mix(600, 316, mv), width: 520, height: 300, transformOrigin: "0 0", scale: `${mix(1, 0.5, mv)}` }}>
      <div style={{ width: "100%", height: "100%", boxSizing: "border-box", scale: `${sx * lift} ${lift}`, borderRadius: 32, border: `6px solid ${C.oro}`, background: front ? C.lino : C.noche,
        boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${front ? 60 : 0}px ${C.oro}66`, display: "flex", alignItems: "center", justifyContent: front ? "flex-start" : "center", gap: 26, padding: "0 40px" }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: front ? 210 : 240, lineHeight: 0.8, color: front ? C.oroOscuro : C.oro }}>{n}</div>
        {front && <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 58, lineHeight: 1.02, color: C.noche }}>{title}</div>}
      </div>
    </div>
  );
};
/** Opción que se marca (círculo + texto); activa = fondo oro */
const OptPill: React.FC<{ t: number; at: number; text: string; x: number; y: number; active: number }> = ({ t, at, text, x, y, active }) => {
  const s = useSpring(t, at, 14);
  if (t < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 20, scale: `${mix(0.7, 1, s) * mix(1, 1.05, active)}`, transformOrigin: "left center", opacity: k(t, at, 0.15),
      fontFamily: SANS, fontWeight: 700, fontSize: 44, color: active > 0.5 ? C.noche : C.luz, background: active > 0.5 ? C.oro : "rgba(12,17,23,0.82)", border: `3px solid ${C.oro}`, borderRadius: 999, padding: "14px 34px 14px 18px", boxShadow: `0 18px 50px rgba(0,0,0,0.4), 0 0 ${40 * active}px ${C.oro}88`, whiteSpace: "nowrap" }}>
      <div style={{ width: 44, height: 44, borderRadius: 99, border: `4px solid ${active > 0.5 ? C.noche : C.oro}`, display: "grid", placeItems: "center", boxSizing: "border-box" }}>
        <div style={{ width: 20, height: 20, borderRadius: 99, background: C.noche, scale: `${active}` }} />
      </div>
      {text}
    </div>
  );
};

// ---------- objetos y escenarios nuevos (SVG, mundo) ----------
/** Caldera mural genérica: caja blanca lisa, sin marca, sin pantalla ni cifras, sin piloto. (x, y) = esquina superior izquierda. */
const Boiler: React.FC<{ x: number; y: number; s?: number; id: string }> = ({ x, y, s = 1, id: gid }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <defs>
      <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FAF9F6" /><stop offset="0.75" stopColor="#ECE8DF" /><stop offset="1" stopColor="#CFC8B9" /></linearGradient>
    </defs>
    <rect x={-26} y={-66} width={8} height={70} fill="#9AA3AA" opacity={0.5} />
    <rect x={92} y={-70} width={36} height={74} fill="#C9CFD4" />
    <rect x={86} y={-14} width={48} height={14} rx={3} fill="#AEB5BB" />
    <rect x={16} y={18} width={220} height={320} rx={18} fill="#000" opacity={0.28} />
    {[40, 75, 110, 145, 180].map((px, i) => (
      <g key={px}>
        <rect x={px - 6} y={300} width={12} height={130} fill={i % 2 ? "#9AA3AA" : "#B87333"} />
        <rect x={px - 10} y={360} width={20} height={16} rx={3} fill={i % 2 ? "#6E767D" : "#8C5527"} />
      </g>
    ))}
    <rect x={0} y={0} width={220} height={320} rx={18} fill={`url(#${gid}-body)`} />
    <path d="M 0 250 L 220 250 L 220 302 Q 220 320 202 320 L 18 320 Q 0 320 0 302 Z" fill="#E3DDD0" />
    <line x1={10} y1={250} x2={210} y2={250} stroke="#CFC7B6" strokeWidth={3} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={62 + i * 26} y={278} width={16} height={6} rx={3} fill="#CFC7B6" />)}
    <rect x={10} y={10} width={10} height={232} rx={5} fill="#fff" opacity={0.65} />
  </g>
);

/** Furgoneta lisa de perfil (sin rótulo ni matrícula). (x, ground) = esquina trasera y suelo bajo las ruedas */
const PlainVan: React.FC<{ x: number; ground: number; s?: number }> = ({ x, ground, s = 1.35 }) => (
  <g transform={`translate(${x} ${ground - 356 * s}) scale(${s})`}>
    <ellipse cx={305} cy={356} rx={330} ry={16} fill="#000" opacity={0.3} />
    <path d="M 0 300 L 0 80 Q 0 40 40 40 L 420 40 Q 470 40 500 90 L 590 200 Q 610 220 610 260 L 610 300 Z" fill={C.luz} />
    <path d="M 0 250 L 610 250 L 610 300 L 0 300 Z" fill="#D6CFC0" />
    <path d="M 430 70 L 490 70 L 560 190 L 430 190 Z" fill="#26323C" />
    <path d="M 440 80 L 470 80 L 500 130 L 440 130 Z" fill="#fff" opacity={0.2} />
    <line x1={420} y1={50} x2={420} y2={290} stroke="#C9C2B3" strokeWidth={4} />
    <line x1={230} y1={50} x2={230} y2={290} stroke="#C9C2B3" strokeWidth={3} />
    <rect x={30} y={170} width={380} height={18} fill={C.oro} />
    <rect x={588} y={226} width={20} height={14} rx={4} fill="#FFF6DD" />
    <rect x={40} y={26} width={340} height={14} rx={4} fill="#9AA3AA" />
    {[110, 480].map((wx) => <g key={wx}><circle cx={wx} cy={300} r={56} fill="#15191d" /><circle cx={wx} cy={300} r={24} fill="#9AA3AA" /><circle cx={wx} cy={300} r={8} fill="#5E666D" /></g>)}
  </g>
);

/** Calle de mañana: fila de portales idénticos sin números; sol que cruza el cielo y sombra que se alarga. */
const MorningStreet: React.FC<{ sun: number; vanX: number; lit?: number; litIdx?: number; id: string }> = ({ sun, vanX, lit = 0, litIdx = 2, id: gid }) => {
  const sx = mix(-60, 1140, sun), sy = 470 - Math.sin(Math.PI * sun) * 330;
  const shL = mix(60, 340, Math.abs(sun - 0.5) * 2), skew = (sun - 0.5) * -500;
  return (
    <g>
      <defs><linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5F7588" /><stop offset="0.55" stopColor="#A3AFB2" /><stop offset="1" stopColor="#E3D5BA" /></linearGradient></defs>
      <rect x={-400} y={-400} width={1880} height={1800} fill={`url(#${gid}-sky)`} />
      <Glow id={`${gid}-sun`} x={sx} y={sy} r={300} c="#FFF1D6" o={0.85} />
      <circle cx={sx} cy={sy} r={46} fill="#FFF6E3" />
      {[[-380, 330], [-120, 400], [140, 360], [420, 420], [700, 350], [980, 390], [1240, 340]].map(([bx, by]) => <rect key={bx} x={bx} y={by} width={250} height={200} fill="#55687A" opacity={0.55} />)}
      <rect x={-400} y={520} width={1880} height={870} fill="#3E4B57" />
      <rect x={-400} y={505} width={1880} height={24} fill="#2E3943" />
      {Array.from({ length: 9 }, (_, i) => {
        const c = i - 2, px = 60 + c * 210;
        return (
          <g key={i}>
            {[590, 775].map((wy) => (
              <g key={wy}>
                <rect x={px + 15} y={wy} width={120} height={150} fill="#24303A" stroke="#C9BFAE" strokeWidth={6} />
                <line x1={px + 75} y1={wy} x2={px + 75} y2={wy + 150} stroke="#C9BFAE" strokeWidth={4} />
                <path d={`M ${px + 20} ${wy + 10} L ${px + 60} ${wy + 10} L ${px + 20} ${wy + 70} Z`} fill="#fff" opacity={0.1} />
                <rect x={px + 5} y={wy + 150} width={140} height={10} fill="#2B3640" />
              </g>
            ))}
            <rect x={px - 10} y={965} width={170} height={415} fill="#C9BFAE" />
            <rect x={px} y={980} width={150} height={400} fill="#4A3425" />
            <rect x={px + 15} y={995} width={120} height={120} fill="#2A3540" />
            <line x1={px + 75} y1={1130} x2={px + 75} y2={1380} stroke="#3A291D" strokeWidth={4} />
            <rect x={px + 120} y={1220} width={10} height={40} rx={4} fill={C.oro} />
            {c === litIdx && lit > 0 && <>
              <rect x={px} y={980} width={150} height={400} fill={C.oroClaro} opacity={lit * 0.8} />
              <rect x={px - 10} y={965} width={170} height={415} fill="none" stroke={C.oro} strokeWidth={10} opacity={lit} />
            </>}
          </g>
        );
      })}
      <rect x={-400} y={1340} width={1880} height={40} fill="#35414C" />
      <rect x={-400} y={1380} width={1880} height={90} fill="#7A7F80" />
      <rect x={-400} y={1462} width={1880} height={14} fill="#A9ADAD" />
      <rect x={-400} y={1476} width={1880} height={1000} fill="#2B3238" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-380 + i * 230} y={1820} width={120} height={14} fill={C.lino} opacity={0.45} />)}
      <polygon points={`-400,1380 1480,1380 ${1480 + skew},${1380 + shL} ${-400 + skew},${1380 + shL}`} fill="#0C1117" opacity={0.26} />
      {lit > 0 && <Glow id={`${gid}-portal`} x={60 + litIdx * 210 + 75} y={1300} r={380} c={C.oroClaro} o={lit * 0.75} />}
      <PlainVan x={vanX} ground={1580} />
    </g>
  );
};

/** Bloque de pisos en sección (casa de muñecas). Piso resaltado: planta 3, derecha; caldera en la galería. */
const TOP = 220, FH = 320, NF = 5, X0 = 110, X1 = 970, MID = 540;
const floorC = (i: number) => TOP + i * FH + 148;
const BlockSection: React.FC<{ hi: number; ring: number }> = ({ hi, ring }) => {
  const fy = TOP + 3 * FH;
  const circ = 2 * Math.PI * 78;
  return (
    <g>
      <defs><linearGradient id="bs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5F7588" /><stop offset="0.7" stopColor="#A3AFB2" /><stop offset="1" stopColor="#E3D5BA" /></linearGradient></defs>
      <rect x={-400} y={-400} width={1880} height={3000} fill="url(#bs-sky)" />
      {[[-380, 60], [1000, 140], [1240, 20]].map(([bx, by]) => <rect key={bx} x={bx} y={by} width={300} height={2400} fill="#4B5A66" opacity={0.6} />)}
      <rect x={X0 + 60} y={TOP - 120} width={150} height={80} fill="#2E3943" />
      <rect x={X0 - 30} y={TOP - 46} width={X1 - X0 + 60} height={46} fill="#26313A" />
      {Array.from({ length: NF }, (_, i) => [0, 1].map((j) => {
        const rx = j ? MID + 10 : X0 + 24, rw = j ? X1 - 24 - (MID + 10) : MID - 10 - (X0 + 24), ry = TOP + i * FH, rh = FH - 24;
        const isHi = i === 3 && j === 1;
        const kind = (i * 2 + j) % 3;
        return (
          <g key={`${i}-${j}`}>
            <rect x={rx} y={ry} width={rw} height={rh} fill="#1C252E" />
            {!isHi && (i + j) % 2 === 0 && <rect x={rx} y={ry} width={rw} height={rh} fill="#3A4652" opacity={0.6} />}
            {!isHi && <>
              <rect x={rx + rw / 2 - 60} y={ry + 40} width={120} height={110} fill="#6E8496" opacity={0.3} />
              {kind === 0 && <path d={`M ${rx + 50} ${ry + rh} L ${rx + 50} ${ry + rh - 70} Q ${rx + 50} ${ry + rh - 100} ${rx + 80} ${ry + rh - 100} L ${rx + 230} ${ry + rh - 100} Q ${rx + 260} ${ry + rh - 100} ${rx + 260} ${ry + rh - 70} L ${rx + 260} ${ry + rh} Z`} fill="#2B3640" />}
              {kind === 1 && <g><rect x={rx + 90} y={ry + rh - 90} width={200} height={14} fill="#34414C" /><rect x={rx + 110} y={ry + rh - 76} width={10} height={76} fill="#34414C" /><rect x={rx + 260} y={ry + rh - 76} width={10} height={76} fill="#34414C" /><line x1={rx + 320} y1={ry + 20} x2={rx + 320} y2={ry + 80} stroke="#11161b" strokeWidth={3} /><path d={`M ${rx + 296} ${ry + 104} Q ${rx + 300} ${ry + 80} ${rx + 320} ${ry + 80} Q ${rx + 340} ${ry + 80} ${rx + 344} ${ry + 104} Z`} fill="#4A5661" /></g>}
              {kind === 2 && <g><rect x={rx + 40} y={ry + rh - 60} width={260} height={60} rx={10} fill="#2B3640" /><rect x={rx + 40} y={ry + rh - 100} width={40} height={100} rx={8} fill="#34414C" /></g>}
            </>}
            {isHi && <g>
              <rect x={rx} y={ry} width={rw} height={rh} fill="#E9D9B4" opacity={hi} />
              <rect x={rx + 20} y={ry + 40} width={220} height={70} fill="#C9BFAE" opacity={mix(0.25, 1, hi)} />
              <rect x={rx + 20} y={ry + rh - 96} width={240} height={96} fill="#B8AD98" opacity={mix(0.25, 1, hi)} />
              <rect x={rx + 16} y={ry + rh - 104} width={248} height={10} fill={C.lino} opacity={mix(0.25, 1, hi)} />
              <rect x={X1 - 24 - 124} y={ry} width={124} height={rh} fill="#D8CFC0" opacity={mix(0.15, 0.9, hi)} />
              <rect x={X1 - 24 - 112} y={ry + 26} width={100} height={110} fill="#8EA2B2" opacity={mix(0.2, 0.7, hi)} />
              <line x1={X1 - 24 - 62} y1={ry + 26} x2={X1 - 24 - 62} y2={ry + 136} stroke={C.lino} strokeWidth={4} opacity={hi} />
              <rect x={X1 - 24 - 128} y={ry} width={8} height={rh} fill="#9AA3AA" opacity={mix(0.3, 1, hi)} />
              <Boiler x={X1 - 24 - 92} y={ry + 120} s={0.26} id="bs-boiler" />
            </g>}
          </g>
        );
      }))}
      <Glow id="bs-warm" x={760} y={fy + 150} r={420} c={C.oroClaro} o={hi * 0.7} />
      {Array.from({ length: NF }, (_, i) => (
        <g key={i}>
          <rect x={X0} y={TOP + (i + 1) * FH - 24} width={X1 - X0} height={24} fill="#46525C" />
          <rect x={X0} y={TOP + (i + 1) * FH - 24} width={X1 - X0} height={4} fill={C.lino} opacity={0.3} />
        </g>
      ))}
      <rect x={X0} y={TOP} width={24} height={NF * FH + 300} fill="#4A5661" />
      <rect x={X1 - 24} y={TOP} width={24} height={NF * FH + 300} fill="#4A5661" />
      <rect x={MID - 10} y={TOP} width={20} height={NF * FH} fill="#4A5661" />
      <rect x={X0 + 24} y={TOP + NF * FH} width={X1 - X0 - 48} height={300} fill="#2A3540" />
      <rect x={MID - 90} y={TOP + NF * FH + 60} width={180} height={240} fill="#C9BFAE" />
      <rect x={MID - 76} y={TOP + NF * FH + 74} width={152} height={226} fill="#4A3425" />
      <rect x={-400} y={TOP + NF * FH + 300} width={1880} height={600} fill="#7A7F80" />
      <circle cx={X1 - 24 - 62} cy={fy + 120 + 42} r={78} fill="none" stroke={C.oro} strokeWidth={9} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-90 ${X1 - 24 - 62} ${fy + 162})`} />
      {ring > 0 && <Glow id="bs-ring" x={X1 - 24 - 62} y={fy + 162} r={160} c={C.oro} o={ring * 0.45} />}
    </g>
  );
};

/** Agenda de pared en lino con dos casillas en blanco: «Hoy» y «Mañana» (sin horas ni fechas). */
const WallAgenda: React.FC<{ aH: number; aM: number }> = ({ aH, aM }) => (
  <g>
    <rect x={164} y={380} width={780} height={360} rx={22} fill="#000" opacity={0.3} />
    <rect x={150} y={360} width={780} height={360} rx={22} fill={C.lino} />
    <rect x={150} y={360} width={780} height={46} rx={22} fill={C.linoSombra} />
    <rect x={150} y={384} width={780} height={22} fill={C.linoSombra} />
    {[200, 880].map((px) => <circle key={px} cx={px} cy={383} r={9} fill={C.oro} />)}
    {[{ x: 190, label: "Hoy", a: aH * (1 - aM) }, { x: 560, label: "Mañana", a: aM }].map(({ x, label, a }) => (
      <g key={label}>
        <rect x={x} y={430} width={330} height={260} rx={16} fill={C.luz} stroke={a > 0.05 ? C.oro : C.linoSombra} strokeWidth={mix(4, 12, a)} />
        <rect x={x} y={430} width={330} height={260} rx={16} fill={C.oro} opacity={0.14 * a} />
        <text x={x + 26} y={492} fontFamily={SANS} fontWeight={700} fontSize={50} fill={C.noche}>{label}</text>
        <line x1={x + 26} y1={512} x2={x + 304} y2={512} stroke={C.linoSombra} strokeWidth={3} />
      </g>
    ))}
  </g>
);

/** Interior de la furgoneta en sección: estanterías con cajas y bandejas genéricas, puerta trasera abierta. */
const VanInterior: React.FC = () => {
  const items: [number, number, number, number, string][] = [
    // [x, balda, ancho, alto, color]
    [360, 640, 110, 80, C.linoSombra], [480, 640, 140, 60, C.pizarra], [636, 640, 90, 96, C.lino], [740, 640, 180, 56, C.oroOscuro],
    [360, 880, 160, 70, C.pizarra], [536, 880, 120, 110, C.linoSombra], [672, 880, 120, 64, C.lino], [806, 880, 120, 90, C.pizarraClaro],
    [360, 1120, 96, 90, C.linoSombra], [680, 1120, 130, 70, C.pizarra], [826, 1120, 110, 100, C.lino],
  ];
  return (
    <g>
      <rect x={-400} y={-400} width={1880} height={2800} fill="#121920" />
      <path d="M -400 1480 L -400 420 Q -400 300 -280 300 L 1240 300 Q 1480 300 1480 520 L 1480 1480 Z" fill="#1E2832" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={-300 + i * 190} y={300} width={16} height={1180} fill="#26313B" />)}
      <Glow id="vi-led" x={560} y={360} r={700} c={C.oroClaro} o={0.42} />
      <rect x={310} y={318} width={500} height={14} rx={7} fill={C.luz} />
      {[340, 640, 940].map((ux) => <rect key={ux} x={ux} y={500} width={18} height={880} fill="#56636B" />)}
      {[640, 880, 1120].map((sy) => <g key={sy}><rect x={330} y={sy} width={640} height={18} fill={C.pizarraClaro} /><rect x={330} y={sy + 18} width={640} height={6} fill={C.oroOscuro} /></g>)}
      {items.map(([x, sy, w, h, c], i) => (
        <g key={i}>
          <rect x={x} y={sy - h} width={w} height={h} rx={6} fill={c} />
          <rect x={x} y={sy - h} width={w} height={8} rx={4} fill="#fff" opacity={0.15} />
          {h < 72 && Array.from({ length: Math.floor(w / 40) }, (_, j) => <rect key={j} x={x + 8 + j * 40} y={sy - h + 16} width={28} height={h - 24} rx={4} fill="#000" opacity={0.18} />)}
        </g>
      ))}
      <rect x={-400} y={1380} width={1880} height={140} fill="#2A333C" />
      {Array.from({ length: 4 }, (_, i) => <line key={i} x1={-400} y1={1396 + i * 28} x2={1480} y2={1396 + i * 28} stroke="#222A32" strokeWidth={6} />)}
      <path d="M 700 1380 Q 700 1270 840 1270 Q 980 1270 980 1380 Z" fill="#222B34" />
      <rect x={-400} y={300} width={500} height={1180} fill="#D8CCB3" opacity={0.85} />
      <rect x={-400} y={1380} width={500} height={200} fill="#7A7F80" opacity={0.6} />
      <polygon points="100,300 -60,210 -60,1570 100,1480" fill="#E6E1D6" />
      <polygon points="100,300 -60,210 -60,260 100,330" fill="#fff" opacity={0.3} />
      <rect x={-30} y={860} width={14} height={90} rx={6} fill="#9AA3AA" />
    </g>
  );
};

// ---------- interfaz propia ----------
const ROWS = ["Qué pasa", "Dónde", "Cuándo corre prisa"];
const Scribble: React.FC<{ w: number; o: number; seed: number }> = ({ w, o, seed }) => (
  <svg width={w} height={22} viewBox={`0 0 ${w} 22`} style={{ opacity: o }}>
    <path d={`M 4 12 ${Array.from({ length: Math.floor(w / 18) }, (_, i) => `q 6 ${i % 2 ? -8 + (seed % 3) : 8 - (seed % 2)} 18 0`).join(" ")}`} stroke={PENCIL} strokeWidth={3} fill="none" strokeLinecap="round" />
  </svg>
);
/** Libreta (HTML) que se completa con las tres tarjetas que vuelan hasta ella */
const NoteFull: React.FC<{ t: number; at: number; until?: number }> = ({ t, at, until = Infinity }) => {
  const o = Math.min(k(t, at - 0.2, 0.2), 1 - k(t, until - 0.3, 0.3));
  if (o <= 0) return null;
  const X = 110, Y = 320, RY = (i: number) => Y + 86 + i * 74;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: X, top: Y, width: 500, height: 330, boxSizing: "border-box", borderRadius: 18, background: C.lino, boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        backgroundImage: "repeating-linear-gradient(transparent 0 73px, #B9C3CB88 73px 75px)", backgroundPosition: "0 12px", padding: "22px 28px" }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: PENCIL, lineHeight: 1 }}>agua caliente</div>
      </div>
      {ROWS.map((r, i) => {
        const p = k(t, at + i * 0.18, 0.5, inOut);
        const landed = k(t, at + i * 0.18 + 0.45, 0.25);
        const sx = 760 + i * 40, sy = 980 + i * 120;
        return (
          <React.Fragment key={r}>
            <div style={{ position: "absolute", left: X + 92, top: RY(i) + 6, display: "flex", alignItems: "center", gap: 14, opacity: landed }}>
              <div style={{ fontFamily: SANS, fontWeight: 650, fontSize: 32, color: C.noche, whiteSpace: "nowrap" }}>{r}</div>
              <Scribble w={i === 2 ? 70 : 150} o={0.8} seed={i} />
              <svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={C.oroOscuro} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ position: "absolute", left: mix(sx, X + 24, p), top: mix(sy, RY(i), p), width: 56, height: 64, borderRadius: 10, background: C.noche, border: `3px solid ${C.oro}`,
              display: "grid", placeItems: "center", rotate: `${mix(-18 + i * 14, 0, p)}deg`, scale: `${mix(2.2, 1, p)}`, boxShadow: `0 ${mix(30, 6, p)}px ${mix(40, 10, p)}px rgba(0,0,0,0.45)`,
              fontFamily: SERIF, fontStyle: "italic", fontSize: 46, lineHeight: 1, color: C.oro }}>{i + 1}</div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
/** Ficha del aviso de la demo: tres filas 1-2-3 que se rellenan */
const Ficha: React.FC<{ t: number; at: number; fillAt: number; x: number; y: number; w: number }> = ({ t, at, fillAt, x, y, w }) => (
  <Card t={t} at={at} x={x} y={y} w={w} style={{ background: C.lino, padding: "24px 24px" }}>
    <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: "0.14em", color: C.oroOscuro }}>FICHA DEL AVISO</div>
    {["Qué pasa", "Dónde", "Cuándo"].map((r, i) => {
      const f = k(t, fillAt + i * 0.18, 0.4);
      return (
        <div key={r} style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 99, background: f > 0.5 ? C.oro : "transparent", border: `3px solid ${C.oro}`, display: "grid", placeItems: "center", boxSizing: "border-box",
              fontFamily: SERIF, fontStyle: "italic", fontSize: 30, color: C.noche }}>{i + 1}</div>
            <div style={{ fontFamily: SANS, fontWeight: 650, fontSize: 30, color: C.noche }}>{r}</div>
          </div>
          <div style={{ marginTop: 8, marginLeft: 52, height: 14, borderRadius: 7, background: C.linoSombra, overflow: "hidden" }}>
            <div style={{ width: `${f * 100}%`, height: "100%", background: C.oroOscuro, borderRadius: 7 }} />
          </div>
        </div>
      );
    })}
  </Card>
);
/** Tarjeta de cita propuesta: «Pendiente de confirmar» → la confirma el técnico y se sella en oro (sin hora) */
const CitaCard: React.FC<{ t: number; at: number; conf: number; x: number; y: number; w: number }> = ({ t, at, conf, x, y, w }) => {
  const done = conf > 0.5;
  const seal = conf;
  return (
    <Card t={t} at={at} x={x} y={y} w={w} style={{ border: `5px solid ${done ? C.oro : "transparent"}`, boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 ${60 * conf}px ${C.oro}88` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 60 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.14em", color: C.oroOscuro }}>CITA PROPUESTA</div>
        <div style={{ width: 60, height: 60, borderRadius: 99, background: C.oro, display: "grid", placeItems: "center", scale: `${mix(1.8, 1, seal)}`, opacity: seal, rotate: `${mix(-30, 0, seal)}deg` }}>
          <svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={C.noche} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 54, lineHeight: 1, height: 54 }}>Mañana</div>
      <div style={{ fontSize: 36, lineHeight: "43px", height: 43, color: C.pizarra }}>por la mañana</div>
      <div style={{ marginTop: 16, height: 52, display: "flex", alignItems: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.06em", padding: "10px 18px", borderRadius: 999, border: `2px solid ${done ? C.oroOscuro : C.pizarraClaro}`, background: done ? C.oroClaro : "transparent", color: done ? C.noche : C.pizarra }}>
          {done ? "Confirmada por ti" : "Pendiente de confirmar"}
        </div>
      </div>
      <div style={{ marginTop: 20, height: 84, borderRadius: 22, background: done ? C.oro : C.noche, color: done ? C.noche : C.luz, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 38 }}>
        {done ? "Confirmada" : "Confirmar"}
      </div>
    </Card>
  );
};

// ================= escenas =================

// 0 · Gancho: plano cenital de la libreta sobre la caja de herramientas, con solo «agua caliente». Caen las tarjetas 1-2-3.
const CARDS: [number, number, number][] = [[300, 1090, -9], [520, 1120, 4], [740, 1070, 10]];
const Hook: React.FC<SceneProps> = (p) => {
  const { t, w } = p;
  const t3 = w(0, /^(3|tres)/i);
  const fall = (i: number) => t3 + i * 0.22;
  const sh = CARDS.reduce<[number, number]>((a, _, i) => { const s = shake(t, fall(i) + 0.22, 0.3, 10); return [a[0] + s[0], a[1] + s[1]]; }, [0, 0]);
  const scratch = t < 0.9 ? Math.sin(t * 34) * 3 : 0;
  return (
    <AbsoluteFill>
      <World>
        <Cam x={540} y={mix(1010, 990, k(t, 0, 5))} z={mix(1.0, 1.08, k(t, 0, 5, lin))} sh={sh}>
          <rect x={-400} y={-400} width={1880} height={2800} fill="#1C2228" />
          {Array.from({ length: 140 }, (_, i) => (
            <circle key={i} cx={-300 + random(`hkx${i}`) * 1680} cy={-300 + random(`hky${i}`) * 2500} r={2 + random(`hkr${i}`) * 4} fill={i % 2 ? "#2A3138" : "#151A1F"} />
          ))}
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={1000} y={-200 + i * 420} width={18} height={220} fill={C.lino} opacity={0.35} />)}
          <Glow id="hk-lamp" x={940} y={260} r={620} c={C.oroClaro} o={0.3} />
          <g transform="translate(800 1420) rotate(-6)">
            <rect x={0} y={0} width={560} height={900} rx={70} fill={C.luz} />
            {[120, 260, 400].map((ry) => <rect key={ry} x={40} y={ry} width={480} height={16} rx={8} fill="#C9C2B3" />)}
          </g>
          <g transform="rotate(-3 540 1020)">
            <rect x={128} y={624} width={860} height={860} rx={40} fill="#000" opacity={0.4} />
            <rect x={110} y={600} width={860} height={860} rx={40} fill="#9C3B32" />
            <rect x={134} y={624} width={812} height={812} rx={30} fill="#8A3229" />
            <rect x={400} y={566} width={280} height={60} rx={30} fill="#5E211C" />
            {[200, 820].map((lx) => <rect key={lx} x={lx} y={1440} width={60} height={30} rx={6} fill="#9AA3AA" />)}
          </g>
          <g transform="rotate(2 540 990)">
            <rect x={186} y={690} width={740} height={630} rx={10} fill="#000" opacity={0.35} />
            <rect x={170} y={670} width={370} height={630} rx={10} fill={C.lino} />
            <rect x={540} y={670} width={370} height={630} rx={10} fill="#EFEBE2" />
            <defs><linearGradient id="hk-fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity={0} /><stop offset="0.5" stopColor="#000" stopOpacity={0.18} /><stop offset="1" stopColor="#000" stopOpacity={0} /></linearGradient></defs>
            <rect x={500} y={670} width={80} height={630} fill="url(#hk-fold)" />
            {Array.from({ length: 9 }, (_, i) => <g key={i}><line x1={195} y1={760 + i * 58} x2={515} y2={760 + i * 58} stroke="#B9C3CB" strokeWidth={2} opacity={0.6} /><line x1={565} y1={760 + i * 58} x2={885} y2={760 + i * 58} stroke="#B9C3CB" strokeWidth={2} opacity={0.6} /></g>)}
            {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={540} cy={700 + i * 50} rx={16} ry={8} fill="none" stroke="#9AA3AA" strokeWidth={5} />)}
            <text x={205} y={750} fontFamily={SERIF} fontStyle="italic" fontSize={56} fill={PENCIL}>agua caliente</text>
            <g transform={`translate(${720 + scratch} ${860 + scratch * 0.5}) rotate(34)`}>
              <rect x={-11} y={0} width={22} height={300} fill={C.oro} />
              <rect x={-11} y={0} width={7} height={300} fill={C.oroClaro} opacity={0.6} />
              <rect x={-11} y={290} width={22} height={30} fill="#9AA3AA" />
              <rect x={-11} y={318} width={22} height={26} rx={6} fill={C.linoSombra} />
              <polygon points="-11,0 11,0 0,-40" fill="#E3C9A0" />
              <polygon points="-4,-26 4,-26 0,-40" fill={PENCIL} />
            </g>
          </g>
          {CARDS.map(([cx, cy, r], i) => {
            const a = fall(i);
            if (t < a - 0.02) return null;
            const q = k(t, a, 0.22, (n) => n * n);
            return (
              <g key={i}>
                <rect x={cx - 95 + mix(70, 10, q)} y={cy - 130 + mix(90, 14, q)} width={190} height={260} rx={20} fill="#000" opacity={mix(0.08, 0.45, q)} transform={`rotate(${r} ${cx} ${cy})`} />
                <QCardSVG x={cx} y={cy} r={mix(r - 25, r, q)} n={String(i + 1)} s={mix(1.9, 1, q)} o={k(t, a - 0.02, 0.06)} />
                <Burst x={cx} y={cy + 120} t={t} at={a + 0.22} seed={`hk${i}`} n={14} c={[C.lino, C.linoSombra]} speed={500} g={600} size={8} dur={0.7} />
              </g>
            );
          })}
        </Cam>
      </World>
      <Labels t={t} />
      <Headline t={t} at={-1} text="¿Tú también apuntas los *avisos así?*" y={310} size={74} />
    </AbsoluteFill>
  );
};

// 1 · Mismo lugar, plano medio en la calle al anochecer: llamada entrante, «No tengo agua caliente», apunta eso y punto.
const CallScene: React.FC<SceneProps> = ({ t, w }) => {
  const tLl = w(1, /llaman/), tT = w(1, /tengo/), tAp = w(1, /apuntas/), tM = w(1, /más/);
  const answer = tLl + 0.3;
  const pose = poseAt(t, [[0, POSE.stand], [answer, PHONE_WRITE]], 0.4);
  const text = "agua caliente";
  const n = Math.ceil(k(t, tAp - 0.1, 0.7, lin) * text.length);
  const close = k(t, tM + 0.2, 0.35, inOut);
  const nb = k(t, answer, 0.4);
  const HX = 250, HY = 1190;
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(480, 460, k(t, 0, 4))} y={1110} z={mix(1.16, 1.24, k(t, 0, 4))} sh={shake(t, tM, 0.25, 8)}>
          <Street t={0} vanX={380} label="" />
          <Worker x={HX} y={HY} pose={pose} t={t} ring={t < answer ? 1 : 0} phoneInHand={t >= answer} screen={1} />
          <g transform={`translate(${HX + 104} ${HY - 104}) rotate(-12)`} opacity={nb}>
            <rect x={0} y={0} width={70} height={mix(86, 30, close)} rx={6} fill={close > 0.5 ? C.pizarra : C.lino} />
            <rect x={0} y={0} width={70} height={10} rx={4} fill={C.pizarra} />
          </g>
        </Cam>
      </World>
      <Labels t={t} />
      <CallCard t={t} at={-0.2} x={110} y={330} w={760} name="Clienta" state="entrante" sub="Recreación" until={tT - 0.1} />
      <Bubble t={t} at={tT - 0.2} who="cliente" label="CLIENTA" text="No tengo agua caliente" x={90} y={340} w={780} />
      {t >= tAp - 0.3 && (
        <div style={{ position: "absolute", left: 470, top: 560, width: 470, padding: "26px 30px", boxSizing: "border-box", borderRadius: 18, background: C.lino, boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          backgroundImage: "repeating-linear-gradient(transparent 0 62px, #B9C3CB88 62px 64px)", opacity: k(t, tAp - 0.3, 0.2) * (1 - k(t, tM + 0.45, 0.2)),
          scale: `${mix(0.85, 1, k(t, tAp - 0.3, 0.3))} ${1 - close * 0.92}`, transformOrigin: "center top", rotate: "-2deg" }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: "0.14em", color: C.pizarraClaro, marginBottom: 6 }}>AVISO</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 60, lineHeight: 1.1, color: PENCIL, minHeight: 66 }}>
            {text.slice(0, n)}<span style={{ opacity: t >= tM ? 1 : 0 }}>.</span>
          </div>
          <div style={{ height: 70 }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// 2-3 · Al día siguiente: llega a una fila de portales iguales sin saber nada. Vuelve a llamar, no lo coge; vueltas.
const NextDay: React.FC<SceneProps> = (p) => {
  const { t, w, len } = p;
  const tE = w(2, /encontrar/), tD = w(2, /dónde/), tV = w(3, /Vuelves/), tC = w(3, /coge/), tP = w(3, /pierdes/), tMa = w(3, /mañana/);
  const d0 = tP - 0.2;
  const drive = k(t, d0, Math.max(1, len - d0), lin);
  const rise = k(t, d0, 1.0, inOut);
  const vanX = drive <= 0 ? 520 : ((520 + 400 + drive * 2900) % 1880) - 400;
  const sun = mix(0.18, 0.88, drive);
  const wx = mix(560, 330, k(t, 0, 1.1, inOut));
  const pose = t < 1.1 ? walk(t) : t < tV - 0.25 ? POSE.stand : POSE.phone;
  const gone = k(t, d0 - 0.3, 0.25);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(540, 560, rise)} y={mix(1150, 1050, rise)} z={mix(1.12, 0.78, rise)} sh={shake(t, tP, 0.45, 14)}>
          <MorningStreet sun={sun} vanX={vanX} id="nd" />
          <g opacity={1 - gone}>
            <Worker x={wx} y={1195} s={0.85} pose={pose} t={t} flip={t < 1.1} phoneInHand={t >= tV - 0.25} screen={1} />
          </g>
        </Cam>
      </World>
      <Labels t={t} />
      <Chip t={t} at={0.1} text="Al día siguiente" x={70} y={330} c={C.lino} size={38} until={tE - 0.1} />
      <Chip t={t} at={tE - 0.1} text="¿Qué me encuentro?" x={540} y={520} align="center" c={C.lino} size={44} until={tV - 0.05} />
      <Chip t={t} at={tD - 0.1} text="¿Dónde es exactamente?" x={540} y={640} align="center" c={C.lino} size={44} until={tV - 0.05} />
      <CallCard t={t} at={tV - 0.1} x={110} y={330} w={760} name="Clienta" state={t < tC + 0.25 ? "llamando" : "colgada"} sub="Recreación" until={tMa - 0.05} />
      <Chip t={t} at={tMa - 0.1} text="Mañana perdida" x={540} y={360} align="center" c={C.alerta} solid size={56} />
    </AbsoluteFill>
  );
};

// 4 · Tarjeta 1 «Qué pasa»: la cámara entra en la cocina de la clienta; caldera genérica; dos opciones que se marcan.
const Q1: React.FC<SceneProps> = (p) => {
  const { t, w } = p;
  const tQ = w(4, /Pregunta/), tA1 = nth(p, 4, /arranca/i, 0), tA2 = nth(p, 4, /arranca/i, 1);
  const at = Math.max(0.05, tQ - 0.1);
  const enter = k(t, at + 0.4, 0.9, inOut);
  const a1 = t >= tA1 && t < tA2 - 0.05 ? 1 : 0, a2 = t >= tA2 - 0.05 ? 1 : 0;
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(350, 470, enter)} y={mix(900, 900, enter)} z={mix(1.7, 1.1, enter) * mix(1, 1.05, k(t, 1.5, 4))}>
          <Kitchen t={t} tripped={0}>
            <rect x={-400} y={-400} width={1880} height={2800} fill={C.lino} opacity={0.07} />
            <Glow id="q1-day" x={790} y={940} r={520} c={C.luz} o={0.35} />
            <Boiler x={240} y={740} id="q1-boiler" />
            <Client x={720} y={1340} s={1.25} pose={BUST.ear} t={t} />
          </Kitchen>
        </Cam>
      </World>
      <DimHTML o={mix(0.8, 0, enter)} />
      <Labels t={t} />
      <FlipCard t={t} at={at} n="1" title="Qué pasa" />
      <OptPill t={t} at={tA1 - 0.15} text="¿No arranca?" x={90} y={500} active={a1} />
      <OptPill t={t} at={tA2 - 0.15} text="¿Arranca y no calienta?" x={90} y={610} active={a2} />
    </AbsoluteFill>
  );
};

// 5 · Tarjeta 2 «Dónde»: bloque de pisos en sección; la cámara baja planta a planta hasta el piso; círculo en la caldera.
const Q2: React.FC<SceneProps> = ({ t, w }) => {
  const tQ = w(5, /Pregunta/), tDir = w(5, /Direcci/), tPi = w(5, /piso/), tCal = w(5, /caldera/);
  const at = Math.max(0.05, tQ - 0.1);
  const steps = 3 * k(t, 0.5, Math.max(0.8, tPi - 0.5), lin);
  const fi = Math.min(2, Math.floor(steps)), fr = steps - fi;
  const cy = floorC(0) + FH * (fi + smooth(Math.min(1, fr)));
  const zc = k(t, tCal - 0.3, 0.7, inOut);
  const hi = k(t, tPi - 0.2, 0.4);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(760, X1 - 24 - 62, zc)} y={mix(cy, floorC(3) + 20, zc)} z={mix(1.5, 2.3, zc)}>
          <BlockSection hi={hi} ring={k(t, tCal, 0.5)} />
        </Cam>
      </World>
      <DimHTML o={mix(0.75, 0, k(t, at + 0.4, 0.6))} />
      <Labels t={t} />
      <FlipCard t={t} at={at} n="2" title="Dónde" />
      {t >= tDir - 0.15 && (
        <div style={{ position: "absolute", left: 380, top: 320, display: "flex", alignItems: "center", gap: 18, opacity: k(t, tDir - 0.15, 0.2), translate: `${mix(-30, 0, k(t, tDir - 0.15, 0.4))}px 0`,
          fontFamily: SANS, fontWeight: 700, fontSize: 38, color: C.luz, background: "rgba(12,17,23,0.82)", border: `3px solid ${C.oro}`, borderRadius: 999, padding: "12px 30px" }}>
          Dirección
          <svg width="180" height="16" viewBox="0 0 180 16">{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={8 + i * 15} cy={8} r={4} fill={C.lino} opacity={i === 4 || i === 7 ? 0 : 0.6} />)}</svg>
        </div>
      )}
      <Chip t={t} at={tPi - 0.15} text="Piso" x={380} y={420} c={C.oro} size={38} />
      <Chip t={t} at={tCal - 0.15} text="Dónde está la caldera" x={380} y={520} c={C.oro} solid size={38} />
    </AbsoluteFill>
  );
};

// 6 · Tarjeta 3 «Cuándo corre prisa»: agenda de pared con «Hoy» y «Mañana» en blanco; la clienta duda; la cámara pasa de una a otra.
const Q3: React.FC<SceneProps> = ({ t, w }) => {
  const tQ = w(6, /Pregunta/), tH = w(6, /^hoy/i), tMa = w(6, /mañana/);
  const at = Math.max(0.05, tQ - 0.1);
  const enter = k(t, at + 0.4, 0.9, inOut);
  const aH = k(t, tH - 0.15, 0.4, inOut), aM = k(t, tMa - 0.15, 0.4, inOut);
  const cx = mix(mix(540, 355, aH), 725, aM);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={cx} y={mix(700, 790, enter)} z={mix(1.6, 1.08, enter) * mix(1, 1.22, aH)}>
          <Kitchen t={t} tripped={0}>
            <rect x={-400} y={-400} width={1880} height={2800} fill={C.lino} opacity={0.07} />
            <Glow id="q3-day" x={790} y={940} r={520} c={C.luz} o={0.3} />
            <WallAgenda aH={aH} aM={aM} />
            <Client x={540} y={1380} s={1.3} pose={{ ...BUST.worried, tilt: -3 + Math.sin(t * 1.8) * 5 }} t={t} />
          </Kitchen>
        </Cam>
      </World>
      <DimHTML o={mix(0.75, 0, enter)} />
      <Labels t={t} />
      <FlipCard t={t} at={at} n="3" title="Cuándo corre prisa" />
      <Chip t={t} at={tH - 0.15} text="¿Hoy?" x={380} y={330} c={C.oro} size={42} />
      <Chip t={t} at={tMa - 0.15} text="¿Puede esperar a mañana?" x={90} y={500} c={C.lino} size={40} />
    </AbsoluteFill>
  );
};

// 7 · Libreta completa: llega directo al portal (se ilumina con «dónde vas») y carga con calma lo que hace falta en la furgoneta.
const Ready: React.FC<SceneProps> = ({ t, w }) => {
  const tD = w(7, /dónde/), tL = w(7, /llevar/);
  const cut = tL - 0.3;
  const inside = k(t, cut, 0.3);
  const wx = mix(820, 580, k(t, 0.2, Math.max(0.6, tD), inOut));
  const walking = t > 0.2 && t < Math.max(0.8, tD + 0.2);
  const load = k(t, cut + 0.25, 1.1, inOut);
  const pose = poseAt(t, [[0, LOAD], [cut + 0.3, LOAD], [cut + 0.6, SHELVE], [cut + 1.5, POSE.stand]], 0.5);
  const bx = mix(300, 470, load), by = mix(988, 1032, load) - Math.sin(load * Math.PI) * 30;
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(600, 580, k(t, 0, 2))} y={1090} z={mix(1.0, 1.06, k(t, 0, 3))}>
          <MorningStreet sun={0.3} vanX={760} lit={k(t, tD - 0.1, 0.4)} litIdx={2} id="rd" />
          <Worker x={wx} y={1195} s={0.85} pose={walking ? walk(t) : POSE.stand} t={t} flip />
        </Cam>
      </World>
      <AbsoluteFill style={{ opacity: inside }}>
        <World>
          <Cam x={mix(520, 560, k(t, cut, 3))} y={980} z={mix(1.0, 1.05, k(t, cut, 3))}>
            <VanInterior />
            <Toolbox x={bx} y={by} />
            <Worker x={mix(210, 250, load)} y={1135} pose={pose} t={t} />
          </Cam>
        </World>
      </AbsoluteFill>
      <Labels t={t} />
      <NoteFull t={t} at={0.05} until={tD + 0.5} />
      <Chip t={t} at={tD - 0.1} text="Sabes dónde vas" x={540} y={t < tD + 0.5 ? 700 : mix(700, 340, k(t, tD + 0.5, 0.4))} align="center" c={C.lino} size={48} />
      <Chip t={t} at={tL - 0.1} text="y qué llevar" x={540} y={460} align="center" c={C.oro} solid size={52} />
    </AbsoluteFill>
  );
};

// 8-9 · DEMO: suena el móvil en la caja mientras trabaja; contesta la Recepción IA, hace las 3 preguntas, las apunta y propone cita. La confirma él.
const Demo: React.FC<SceneProps> = ({ t, w }) => {
  const tIA = w(8, /^IA/i), tPr = w(8, /preguntas/), tAp = w(9, /apunta/), tPo = w(9, /propone/), tCo = w(9, /confirmas/);
  const ui = k(t, tIA - 0.2, 0.5);
  const conf = k(t, tCo + 0.15, 0.35);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={520} y={mix(1300, 1260, k(t, 0, 4))} z={mix(1.12, 1.04, k(t, 0, 4))}>
          <Room t={t} lamp={1} />
          <Toolbox x={600} y={1580} open={0} />
          <PhoneProp x={690} y={1556} t={t} ring={t < tIA ? 1 : 0} s={1} rot={-74} />
          <Worker x={330} y={1350} pose={{ ...CROUCH_WORK, hN: [140 + Math.sin(t * 6) * 6, -36], hF: [118 - Math.sin(t * 6) * 6, -24] }} t={t} />
          <rect x={-400} y={-400} width={1880} height={2800} fill={C.noche} opacity={0.5 * ui} />
        </Cam>
      </World>
      <Labels t={t} demo />
      <Chip t={t} at={0.1} text="Lo estamos montando" x={540} y={370} align="center" c={C.oro} size={48} until={tIA} />
      <CallCard t={t} at={tIA - 0.1} x={110} y={360} w={840} name="Recepción IA" state="ia" since={tIA} sub="Pregunta y apunta" until={tPo} />
      {["¿Qué pasa?", "¿Dónde?", "¿Cuándo corre prisa?"].map((q, i) => (
        <Bubble key={q} t={t} at={tPr - 0.35 + i * 0.4} who="ia" label={i === 0 ? "RECEPCIÓN IA" : undefined} text={q} x={80} y={i === 0 ? 630 : 680 + i * 110} w={510} until={tPo} />
      ))}
      <Ficha t={t} at={tPr - 0.1} fillAt={tAp} x={620} y={640} w={330} />
      <CitaCard t={t} at={tPo - 0.05} conf={conf} x={90} y={620} w={500} />
      <Tap t={t} at={tCo + 0.1} x={340} y={935} />
      <Chip t={t} at={tCo - 0.1} text="La confirmas tú" x={540} y={400} align="center" c={C.oro} solid size={50} />
    </AbsoluteFill>
  );
};

// 10 · Cierre de marca y la palabra para comentar.
const End: React.FC<SceneProps> = ({ t, w }) => (
  <AbsoluteFill>
    <EndCard t={t} at={0} text="Lo estamos montando *para instaladores.*" />
    <CommentBox t={t} at={w(10, /Comenta/) - 0.3} keyword="LLAMADA" prompt="Comenta LLAMADA y te enseñamos la demo" y={1010} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1400, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: "0.1em", color: C.lino, opacity: 0.85 * inout(t, 0.6, 99) }}>Recreación ficticia · voz generada con IA</div>
  </AbsoluteFill>
);

const scenes: SceneDef[] = [
  { from: 0, C: Hook }, { from: 1, C: CallScene }, { from: 2, C: NextDay }, { from: 4, C: Q1 }, { from: 5, C: Q2 },
  { from: 6, C: Q3 }, { from: 7, C: Ready }, { from: 8, C: Demo }, { from: 10, C: End },
];
const KEYS = ["avisos", "preguntas", "agua", "caliente", "apuntas", "encontrar", "dónde", "mañana", "vueltas", "pasa", "arranca", "calienta", "dirección", "piso", "caldera", "prisa", "hoy", "furgoneta", "montando", "ia", "propone", "cita", "confirmas", "llamada", "demo"];

const Ep: React.FC<CurioProps> = (p) => {
  const W = (i: number, re: RegExp) => p.lines[i]?.words?.find((x) => re.test(x.w))?.s ?? p.lines[i]?.start ?? 0;
  const t3 = W(0, /^(3|tres)/i);
  const sfx = [
    { at: 0.05, s: "tick", v: 0.16 }, { at: 0.35, s: "tick", v: 0.14 }, { at: 0.65, s: "tick", v: 0.12 },
    ...[0, 1, 2].map((i) => ({ at: t3 + i * 0.22 + 0.2, s: "impact", v: 0.32 })),
    { at: W(1, /llaman/) - 0.3, s: "ring", v: 0.26 }, { at: W(1, /apuntas/), s: "tick", v: 0.22 }, { at: W(1, /más/), s: "impact", v: 0.22 },
    { at: W(3, /Vuelves/), s: "ring", v: 0.18 }, { at: W(3, /coge/) + 0.25, s: "buzz", v: 0.2 }, { at: W(3, /pierdes/), s: "impact", v: 0.25 },
    { at: W(3, /pierdes/) + 0.4, s: "tick", v: 0.18 }, { at: W(3, /pierdes/) + 0.9, s: "tick", v: 0.18 }, { at: W(3, /pierdes/) + 1.4, s: "tick", v: 0.18 },
    { at: W(4, /Pregunta/), s: "impact", v: 0.3 }, { at: W(4, /arranca/), s: "pop", v: 0.28 }, { at: W(4, /calienta/), s: "pop", v: 0.28 },
    { at: W(5, /Pregunta/), s: "impact", v: 0.3 }, { at: W(5, /Direcci/), s: "tick", v: 0.24 }, { at: W(5, /piso/), s: "tick", v: 0.24 }, { at: W(5, /caldera/), s: "tick", v: 0.26 },
    { at: W(6, /Pregunta/), s: "impact", v: 0.3 }, { at: W(6, /^hoy/i), s: "tick", v: 0.24 }, { at: W(6, /mañana/), s: "tick", v: 0.24 },
    { at: W(7, /dónde/), s: "ding", v: 0.22 }, { at: W(7, /llevar/) - 0.2, s: "impact", v: 0.16 },
    { at: W(8, /montando/) - 0.4, s: "ring", v: 0.22 }, { at: W(8, /^IA/i), s: "ding", v: 0.25 },
    ...[0, 1, 2].map((i) => ({ at: W(8, /preguntas/) - 0.35 + i * 0.4, s: "pop", v: 0.24 })),
    { at: W(9, /apunta/), s: "tick", v: 0.22 }, { at: W(9, /propone/), s: "notify", v: 0.26 }, { at: W(9, /confirmas/) + 0.15, s: "impact", v: 0.3 },
    { at: W(10, /Comenta/), s: "pop", v: 0.3 },
  ];
  return <PQReel {...p} scenes={scenes} keys={KEYS} sfx={sfx} music={`music/${id}.wav`} captionsUntil={(p.lines[10]?.start ?? 999) - 0.15} />;
};
export default Ep;
