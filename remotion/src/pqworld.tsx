// Mundo ilustrado del kit P&Q: escenarios (salón en obra, cocina sin luz, calle con furgoneta), personajes con
// esqueleto por cinemática inversa (técnico de perfil, clienta de frente) y objetos (escalera, caja de herramientas,
// lámpara, móvil). Todo en coordenadas del mundo 1080×1920; se encuadra con <Cam> de ../pq.
// Poses: objetivos de manos y pies relativos a la cadera (x → hacia donde mira, y ↓). blendPose mezcla dos poses.
import React from "react";
import { random } from "remotion";
import { C, Glow, RingWaves, mix } from "./pq";

type P2 = [number, number];
const rot = ([x, y]: P2, deg: number): P2 => { const a = (deg * Math.PI) / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
/** Cinemática inversa de dos huesos: codo/rodilla entre s y el objetivo; bend = 1 o -1 elige el lado del pliegue */
export const ik2 = (s: P2, target: P2, l1: number, l2: number, bend: 1 | -1): [P2, P2] => {
  const dx = target[0] - s[0], dy = target[1] - s[1];
  const d = Math.max(Math.abs(l1 - l2) + 1, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5));
  const base = Math.atan2(dy, dx);
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const e: P2 = [s[0] + l1 * Math.cos(base + bend * a), s[1] + l1 * Math.sin(base + bend * a)];
  return [e, [s[0] + d * Math.cos(base), s[1] + d * Math.sin(base)]];
};
const Limb: React.FC<{ s: P2; e: P2; h: P2; w: number; c: string; w2?: number; c2?: string }> = ({ s, e, h, w, c, w2, c2 }) => (
  <g strokeLinecap="round" strokeLinejoin="round" fill="none">
    <polyline points={`${s} ${e}`} stroke={c} strokeWidth={w} />
    <polyline points={`${e} ${h}`} stroke={c2 ?? c} strokeWidth={w2 ?? w * 0.92} />
  </g>
);

// ---------- técnico (perfil, mira a la derecha) ----------
export type Pose = { lean: number; head: number; hN: P2; hF: P2; fN: P2; fF: P2 };
export const POSE: Record<"work" | "reach" | "release" | "fall" | "stand" | "phone" | "idle" | "walkA" | "walkB" | "crouch", Pose> = {
  work: { lean: -4, head: -28, hN: [105, -350], hF: [82, -338], fN: [12, 245], fF: [-12, 245] },
  reach: { lean: 8, head: 24, hN: [-58, -6], hF: [96, -344], fN: [12, 245], fF: [-12, 245] },
  release: { lean: -16, head: 10, hN: [-150, -150], hF: [150, -250], fN: [44, 222], fF: [-12, 245] },
  fall: { lean: -32, head: 14, hN: [-170, -300], hF: [70, -390], fN: [100, 160], fF: [-40, 228] },
  stand: { lean: 3, head: 16, hN: [70, -150], hF: [52, -140], fN: [18, 245], fF: [-18, 245] },
  phone: { lean: 2, head: 6, hN: [40, -228], hF: [20, 30], fN: [18, 245], fF: [-18, 245] },
  idle: { lean: 0, head: 0, hN: [18, 30], hF: [-6, 30], fN: [18, 245], fF: [-18, 245] },
  walkA: { lean: 4, head: 0, hN: [-60, 20], hF: [60, 20], fN: [70, 236], fF: [-60, 236] },
  walkB: { lean: 4, head: 0, hN: [60, 20], hF: [-60, 20], fN: [-60, 236], fF: [70, 236] },
  crouch: { lean: 22, head: 10, hN: [150, 120], hF: [130, 110], fN: [70, 150], fF: [-50, 150] },
};
const lp = (a: P2, b: P2, p: number): P2 => [mix(a[0], b[0], p), mix(a[1], b[1], p)];
export const blendPose = (a: Pose, b: Pose, p: number): Pose => ({ lean: mix(a.lean, b.lean, p), head: mix(a.head, b.head, p), hN: lp(a.hN, b.hN, p), hF: lp(a.hF, b.hF, p), fN: lp(a.fN, b.fN, p), fF: lp(a.fF, b.fF, p) });
/** Pose por tramos: keys = [[segundo, pose]...], mezcla suave entre tramos (dur s) */
export const poseAt = (t: number, keys: [number, Pose][], dur = 0.35): Pose => {
  let cur = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [at, p] = keys[i];
    if (t < at) break;
    const q = Math.min(1, (t - at) / dur);
    cur = blendPose(cur, p, q * q * (3 - 2 * q));
  }
  return cur;
};
const SKIN = "#D7A27E", SKIN_D = "#B9825F", JACKET = "#3E4C57", JACKET_D = "#2B3640", PANTS = "#1D2731", PANTS_D = "#151C24", BOOT = "#3A2A20";
/** Posición del bolsillo trasero (para las ondas del móvil), en coordenadas del mundo */
export const pocket = (x: number, y: number, s = 1, pose: Pose = POSE.work): P2 => add([x, y], rot([-44 * s, -8 * s], pose.lean));
export const Worker: React.FC<{ x: number; y: number; s?: number; pose: Pose; rot?: number; t?: number; ring?: number; flip?: boolean; phoneInHand?: boolean; screen?: number }> = ({ x, y, s = 1, pose, rot: r = 0, t = 0, ring = 0, flip, phoneInHand, screen = 0 }) => {
  const sh = rot([0, -168], pose.lean), neck = rot([0, -192], pose.lean), hd = add(neck, rot([0, -50], pose.lean + pose.head));
  const [eN, hN] = ik2(sh, pose.hN, 108, 100, -1), [eF, hF] = ik2(sh, pose.hF, 108, 100, -1);
  const [kN, fN] = ik2([8, 0], pose.fN, 128, 120, -1), [kF, fF] = ik2([-6, 0], pose.fF, 128, 120, -1);
  const Boot: React.FC<{ p: P2; c: string }> = ({ p, c }) => <path d={`M ${p[0] - 18} ${p[1] - 12} h 34 a 14 14 0 0 1 14 14 v 8 h -48 z`} fill={c} />;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`}>
      <Limb s={[-6, 0]} e={kF} h={fF} w={44} c={PANTS_D} />
      <Boot p={fF} c="#2A1E17" />
      <Limb s={sh} e={eF} h={hF} w={40} c="#141B22" /> {/* contorno oscuro: sin él el brazo de atrás desaparece contra la pared */}
      <Limb s={sh} e={eF} h={hF} w={32} c="#35434E" />
      <circle cx={hF[0]} cy={hF[1]} r={15} fill={SKIN_D} />
      <g transform={`rotate(${pose.lean})`}>
        <path d="M -44 14 C -50 -60 -52 -140 -40 -186 Q 0 -204 40 -184 C 50 -130 50 -50 42 14 Z" fill={JACKET} />
        <rect x={-48} y={-102} width={92} height={16} fill={C.oro} opacity={0.9} />
        <rect x={-46} y={-4} width={90} height={22} rx={6} fill={PANTS} />
        <rect x={-46} y={2} width={90} height={9} fill="#5B3F28" />
        <rect x={24} y={6} width={30} height={40} rx={6} fill="#6B4A2F" />
        <rect x={34} y={-6} width={6} height={18} fill={C.pizarraClaro} />
        {!phoneInHand && <g transform="translate(-58 -16) rotate(-8)"><rect width={24} height={42} rx={5} fill="#0f1418" /><rect x={3} y={4} width={18} height={32} rx={3} fill={ring > 0 ? C.oroClaro : "#1f2a33"} opacity={ring > 0 ? 0.6 + 0.4 * Math.sin(t * 18) : 1} /></g>}
      </g>
      <g transform={`translate(${hd[0]} ${hd[1]}) rotate(${pose.lean + pose.head})`}>
        <rect x={-14} y={30} width={28} height={30} fill={SKIN_D} />
        <circle r={46} fill={SKIN} />
        <path d="M -46 2 A 46 46 0 0 1 -20 -40 L -14 4 Z" fill="#2B2018" />
        <circle cx={-8} cy={6} r={9} fill={SKIN_D} />
        <circle cx={24} cy={-4} r={5} fill="#1b1b1b" />
        <path d="M 16 -16 L 32 -14" stroke="#2B2018" strokeWidth={5} strokeLinecap="round" />
        <path d="M 43 -2 L 54 12 L 42 15" fill={SKIN} stroke={SKIN_D} strokeWidth={2} />
        <path d="M 26 26 Q 34 28 40 24" stroke="#7a4a35" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M -48 -10 A 48 48 0 0 1 46 -16 L 46 -8 L -48 -2 Z" fill={C.oro} />
        <path d="M 30 -14 L 88 -8 Q 90 -2 84 0 L 30 -4 Z" fill={C.oroOscuro} />
      </g>
      <Limb s={[8, 0]} e={kN} h={fN} w={46} c={PANTS} />
      <Boot p={fN} c={BOOT} />
      <Limb s={sh} e={eN} h={hN} w={34} c={JACKET} />
      <rect x={eN[0] - 4} y={eN[1] - 4} width={8} height={8} fill={C.oro} opacity={0.8} transform={`rotate(${(Math.atan2(hN[1] - eN[1], hN[0] - eN[0]) * 180) / Math.PI} ${eN[0]} ${eN[1]})`} />
      <circle cx={hN[0]} cy={hN[1]} r={16} fill={SKIN} />
      {phoneInHand && <g transform={`translate(${hN[0] - 6} ${hN[1] - 46})`}><rect width={30} height={54} rx={6} fill="#0f1418" /><rect x={3} y={4} width={24} height={44} rx={4} fill={C.oroClaro} opacity={0.35 + 0.65 * screen} /></g>}
      {ring > 0 && !phoneInHand && (() => { const p = add(rot([-46, 4], pose.lean), [0, 0]); return <RingWaves x={p[0]} y={p[1]} t={t} c={C.oro} size={150} o={ring} />; })()}
    </g>
  );
};

// ---------- clienta (de frente, de cintura para arriba) ----------
export type BustPose = { tilt: number; hR: P2; hL: P2; look: number };
export const BUST: Record<"ear" | "look" | "down" | "worried", BustPose> = {
  ear: { tilt: -6, hR: [96, -312], hL: [-70, 10], look: 0 },
  look: { tilt: 6, hR: [26, -170], hL: [-24, -165], look: 1 },
  down: { tilt: 0, hR: [70, 10], hL: [-70, 10], look: 1 },
  worried: { tilt: -3, hR: [40, -200], hL: [-70, 10], look: 0.5 },
};
export const blendBust = (a: BustPose, b: BustPose, p: number): BustPose => ({ tilt: mix(a.tilt, b.tilt, p), hR: lp(a.hR, b.hR, p), hL: lp(a.hL, b.hL, p), look: mix(a.look, b.look, p) });
export const Client: React.FC<{ x: number; y: number; s?: number; pose: BustPose; t?: number; glow?: number; sweater?: string; hair?: string }> = ({ x, y, s = 1, pose, t = 0, glow = 0, sweater = C.linoSombra, hair = "#3A2519" }) => {
  const out = (s: P2, tg: P2, side: 1 | -1): [P2, P2] => { const a = ik2(s, tg, 124, 116, 1), b = ik2(s, tg, 124, 116, -1); return a[0][0] * side >= b[0][0] * side ? a : b; };
  const [eR, hR] = out([84, -226], pose.hR, 1), [eL, hL] = out([-84, -226], pose.hL, -1);
  const blink = (t % 3.7) > 3.58 ? 0.15 : 1;
  const ly = mix(0, 7, pose.look);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -96 40 C -104 -80 -104 -190 -84 -232 Q 0 -262 84 -232 C 104 -190 104 -80 96 40 Z" fill={sweater} />
      <path d="M -30 -246 Q 0 -222 30 -246" stroke={C.pizarraClaro} strokeWidth={8} fill="none" />
      <Limb s={[-84, -226]} e={eL} h={hL} w={46} c={sweater} w2={40} />
      <circle cx={hL[0]} cy={hL[1]} r={20} fill={SKIN} />
      <g transform={`translate(0 -318) rotate(${pose.tilt})`}>
        <circle cx={0} cy={-10} r={74} fill={hair} />
        <circle cx={0} cy={-92} r={34} fill={hair} />
        <rect x={-18} y={40} width={36} height={40} fill={SKIN_D} />
        <ellipse cx={0} cy={4} rx={58} ry={64} fill={SKIN} />
        <path d="M -60 -6 Q -50 -64 0 -66 Q 50 -64 60 -6 Q 30 -40 0 -44 Q -34 -40 -60 -6 Z" fill={hair} />
        <ellipse cx={-22} cy={4 + ly} rx={6} ry={7 * blink} fill="#1b1b1b" />
        <ellipse cx={22} cy={4 + ly} rx={6} ry={7 * blink} fill="#1b1b1b" />
        <path d={`M -34 ${-14 + ly * 0.3} L -12 ${-17 + ly * 0.3} M 12 ${-17 + ly * 0.3} L 34 ${-14 + ly * 0.3}`} stroke={hair} strokeWidth={5} strokeLinecap="round" />
        <path d="M -12 36 Q 0 42 12 36" stroke="#8a4a3c" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M 0 8 L -4 24 L 4 25" stroke={SKIN_D} strokeWidth={3} fill="none" />
      </g>
      {glow > 0 && <Glow id="cli-glow" x={(hR[0] + hL[0]) / 2} y={-250} r={260} c="#BFD8FF" o={glow * 0.55} />}
      <Limb s={[84, -226]} e={eR} h={hR} w={46} c={sweater} w2={40} />
      <g transform={`translate(${hR[0]} ${hR[1]}) rotate(${pose.look > 0.5 ? 0 : 18})`}>
        <rect x={-20} y={-44} width={40} height={78} rx={8} fill="#0f1418" />
        <rect x={-16} y={-39} width={32} height={66} rx={5} fill="#BFD8FF" opacity={0.35 + 0.6 * glow} />
      </g>
      <circle cx={hR[0]} cy={hR[1] + 18} r={20} fill={SKIN} />
    </g>
  );
};

// ---------- objetos ----------
/** Escalera de tijera vista a 3/4. Pivota sobre su pie delantero izquierdo (x, y) con tilt (grados). */
export const Ladder: React.FC<{ x: number; y: number; h?: number; tilt?: number }> = ({ x, y, h = 920, tilt = 0 }) => {
  const rungs = Array.from({ length: 8 }, (_, i) => (i + 1) / 9);
  const L = (f: number): P2 => [mix(0, 70, f), -h * f], R = (f: number): P2 => [mix(120, 170, f), -h * f];
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} strokeLinecap="round">
      <line x1={330} y1={0} x2={160} y2={-h} stroke="#8C949B" strokeWidth={18} />
      <line x1={300} y1={-4} x2={150} y2={-h} stroke="#6E767D" strokeWidth={14} opacity={0.8} />
      <line x1={R(0.42)[0]} y1={R(0.42)[1]} x2={mix(330, 160, 0.42)} y2={-h * 0.42} stroke="#5E666D" strokeWidth={6} />
      {rungs.map((f, i) => <line key={i} x1={L(f)[0]} y1={L(f)[1]} x2={R(f)[0]} y2={R(f)[1]} stroke="#A9B1B8" strokeWidth={14} />)}
      <line x1={0} y1={0} x2={70} y2={-h} stroke="#C3CAD0" strokeWidth={20} />
      <line x1={120} y1={0} x2={170} y2={-h} stroke="#B3BAC0" strokeWidth={20} />
      <rect x={58} y={-h - 26} width={124} height={30} rx={8} fill={C.oroOscuro} />
      <rect x={-12} y={-6} width={28} height={14} rx={4} fill="#222" /><rect x={108} y={-6} width={28} height={14} rx={4} fill="#222" />
    </g>
  );
};
/** Altura del peldaño i (1..8) para colocar los pies del técnico: devuelve el centro del peldaño (sin tilt) */
export const rungPos = (x: number, y: number, i: number, h = 920): P2 => { const f = i / 9; return [x + (mix(0, 70, f) + mix(120, 170, f)) / 2, y - h * f]; };
export const Toolbox: React.FC<{ x: number; y: number; s?: number; open?: number }> = ({ x, y, s = 1, open = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={20} y={-30} width={10} height={44} fill="#9AA3AA" transform={`rotate(-14 25 -8)`} />
    <rect x={60} y={-40} width={12} height={56} fill={C.oro} transform="rotate(10 66 -12)" />
    <rect x={110} y={-26} width={14} height={40} fill="#C9CFD4" transform="rotate(-6 117 -6)" />
    <path d={`M 0 0 L 180 0 L 172 ${-20 - 40 * open} L 8 ${-20 - 40 * open} Z`} fill="#7E2F28" opacity={open} transform={`translate(0 ${-34 * open}) skewX(${-20 * open})`} />
    <rect x={0} y={0} width={180} height={88} rx={10} fill="#9C3B32" />
    <rect x={0} y={0} width={180} height={18} fill="#7E2F28" />
    <rect x={70} y={34} width={40} height={14} rx={4} fill="#5E211C" />
  </g>
);
/** Lámpara colgante: on 0..1 la enciende (halo + cono de luz) */
export const Lamp: React.FC<{ x: number; y: number; on?: number; cord?: number }> = ({ x, y, on = 0, cord = 90 }) => (
  <g>
    {on > 0 && <>
      <path d={`M ${x - 46} ${y + cord + 52} L ${x - 380} ${y + cord + 1300} L ${x + 380} ${y + cord + 1300} L ${x + 46} ${y + cord + 52} Z`} fill={C.oroClaro} opacity={0.12 * on} />
      <Glow id={`lamp-${x}`} x={x} y={y + cord + 56} r={460} c={C.oroClaro} o={on} />
    </>}
    <line x1={x} y1={y} x2={x} y2={y + cord} stroke="#11161b" strokeWidth={5} />
    <path d={`M ${x - 62} ${y + cord + 56} Q ${x - 56} ${y + cord} ${x} ${y + cord} Q ${x + 56} ${y + cord} ${x + 62} ${y + cord + 56} Z`} fill={C.oro} />
    <ellipse cx={x} cy={y + cord + 56} rx={62} ry={10} fill={C.oroOscuro} />
    <circle cx={x} cy={y + cord + 60} r={15} fill={on > 0 ? "#FFF6DD" : "#6B6F72"} />
  </g>
);
/** Cables sueltos colgando del techo (marrón, azul y tierra) */
export const Wires: React.FC<{ x: number; y: number; t: number; len?: number }> = ({ x, y, t, len = 110 }) => (
  <g fill="none" strokeWidth={6} strokeLinecap="round">
    {[["#7A4B2A", -14], ["#2F6FB0", 0], ["#C9B13A", 14]].map(([c, dx], i) => (
      <path key={i} d={`M ${x + Number(dx) * 0.4} ${y} q ${Number(dx) + Math.sin(t * 2 + i) * 6} ${len * 0.6} ${Number(dx) * 1.6} ${len}`} stroke={String(c)} strokeDasharray={i === 2 ? "14 8" : undefined} />
    ))}
  </g>
);
/** Móvil apoyado (en una caja, una mesa) con ondas si suena */
export const PhoneProp: React.FC<{ x: number; y: number; t: number; ring?: number; s?: number; rot?: number }> = ({ x, y, t, ring = 0, s = 1, rot: r = -12 }) => (
  <g>
    {ring > 0 && <RingWaves x={x} y={y - 20} t={t} c={C.alerta} size={170} o={ring} />}
    <g transform={`translate(${x} ${y}) rotate(${r + (ring > 0 ? Math.sin(t * 60) * 3 * ring : 0)}) scale(${s})`}>
      <rect x={-34} y={-60} width={68} height={120} rx={12} fill="#0f1418" />
      <rect x={-28} y={-52} width={56} height={102} rx={8} fill={ring > 0 ? "#F6E7C8" : "#1f2a33"} opacity={ring > 0 ? 0.75 + 0.25 * Math.sin(t * 14) : 1} />
    </g>
  </g>
);

// ---------- escenarios ----------
const Skyline: React.FC<{ x: number; y: number; w: number; h: number; t: number; seed: string; id: string }> = ({ x, y, w, h, t, seed, id }) => (
  <g>
    <defs>
      <clipPath id={`${id}-clip`}><rect x={x} y={y} width={w} height={h} /></clipPath>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E1620" /><stop offset="0.5" stopColor="#24323F" /><stop offset="0.82" stopColor={C.oroOscuro} /><stop offset="1" stopColor={C.oro} /></linearGradient>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
      <circle cx={x + w * 0.74} cy={y + h * 0.2} r={18} fill={C.lino} opacity={0.85} />
      {Array.from({ length: 9 }, (_, i) => {
        const bw = w / 7, bx = x + (i - 1) * bw * 0.86, bh = h * (0.25 + 0.4 * random(`${seed}b${i}`));
        return (
          <g key={i}>
            <rect x={bx} y={y + h - bh} width={bw * 0.92} height={bh} fill={i % 2 ? "#121A22" : "#0F161D"} />
            {Array.from({ length: 10 }, (_, j) => {
              const on = random(`${seed}w${i}-${j}`) > 0.55 && Math.sin(t * (0.5 + random(`${seed}f${i}${j}`)) + j) > -0.6;
              return on ? <rect key={j} x={bx + 8 + (j % 3) * (bw * 0.26)} y={y + h - bh + 14 + Math.floor(j / 3) * 26} width={9} height={12} fill={C.oroClaro} opacity={0.8} /> : null;
            })}
          </g>
        );
      })}
    </g>
  </g>
);
const Window: React.FC<{ x: number; y: number; w: number; h: number; t: number; id: string }> = ({ x, y, w, h, t, id }) => (
  <g>
    <Skyline x={x} y={y} w={w} h={h} t={t} seed={id} id={id} />
    <rect x={x} y={y} width={w} height={h} fill="none" stroke={C.linoSombra} strokeWidth={16} />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={C.linoSombra} strokeWidth={10} />
    <line x1={x} y1={y + h * 0.42} x2={x + w} y2={y + h * 0.42} stroke={C.linoSombra} strokeWidth={10} />
    <rect x={x - 26} y={y + h + 6} width={w + 52} height={18} rx={4} fill={C.lino} />
    <path d={`M ${x - 40} ${y - 40} Q ${x - 10} ${y + h * 0.5} ${x - 50} ${y + h + 40} L ${x - 110} ${y + h + 40} Q ${x - 70} ${y + h * 0.5} ${x - 100} ${y - 40} Z`} fill="#3A4650" />
  </g>
);
/** Salón en obra al atardecer: ventana con ciudad, sofá tapado, foco de obra, suelo de madera, cables en el techo. */
export const Room: React.FC<{ t: number; lamp?: number; light?: number }> = ({ t, lamp = 0, light = 1 }) => (
  <g>
    <defs>
      <linearGradient id="room-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17202A" /><stop offset="1" stopColor="#2C3843" /></linearGradient>
      <linearGradient id="room-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A2D24" /><stop offset="1" stopColor="#5B4636" /></linearGradient>
    </defs>
    <rect x={-400} y={-400} width={1880} height={1900} fill="url(#room-wall)" />
    <rect x={-400} y={-400} width={1880} height={600} fill="#10171E" />
    <rect x={-400} y={196} width={1880} height={8} fill="#0A0F14" />
    <Window x={70} y={430} w={330} h={520} t={t} id="room-win" />
    <g transform="translate(440 600)">
      <rect width={130} height={170} fill="#1A222B" stroke={C.oroOscuro} strokeWidth={6} />
      <circle cx={65} cy={74} r={32} fill="none" stroke={C.oro} strokeWidth={4} opacity={0.6} />
      <line x1={18} y1={138} x2={112} y2={138} stroke={C.lino} strokeWidth={4} opacity={0.4} />
    </g>
    <g transform="translate(470 1250)"><rect width={52} height={74} rx={8} fill={C.lino} /><circle cx={18} cy={30} r={5} fill="#555" /><circle cx={34} cy={30} r={5} fill="#555" /></g>
    <rect x={-400} y={1480} width={1880} height={24} fill="#202A33" />
    <rect x={-400} y={1504} width={1880} height={800} fill="url(#room-floor)" />
    {Array.from({ length: 16 }, (_, i) => { const xb = -400 + i * 125; return <line key={i} x1={540 + (xb - 540) * 0.45} y1={1504} x2={xb} y2={2300} stroke="#2E231C" strokeWidth={4} opacity={0.7} />; })}
    {[1580, 1690, 1830].map((yy) => <line key={yy} x1={-400} y1={yy} x2={1480} y2={yy} stroke="#2E231C" strokeWidth={3} opacity={0.5} />)}
    <g>
      <path d="M 20 1300 Q 30 1240 120 1236 L 420 1236 Q 500 1240 500 1300 L 500 1500 L 20 1500 Z" fill="#4A5661" />
      <path d="M 0 1330 Q 20 1290 70 1300 L 70 1500 L 0 1500 Z" fill="#3F4A54" />
      <path d="M 10 1250 Q 250 1190 510 1260 L 520 1520 Q 260 1540 0 1515 Z" fill={C.luz} opacity={0.14} />
      <path d="M 90 1260 Q 140 1380 110 1500 M 300 1240 Q 330 1360 290 1505 M 430 1260 Q 470 1380 440 1500" stroke={C.luz} strokeWidth={3} opacity={0.25} fill="none" />
    </g>
    <g transform="translate(1010 1500)">
      <path d="M -40 0 L 40 0 L 30 -70 L -30 -70 Z" fill={C.oroOscuro} />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M 0 -70 Q ${-60 + i * 20} -200 ${-80 + i * 26} ${-250 + (i % 2) * 40}`} stroke="#4E6B57" strokeWidth={16} fill="none" strokeLinecap="round" transform={`rotate(${Math.sin(t * 0.8 + i) * 1.5} 0 -70)`} />)}
    </g>
    <g opacity={light}>
      <line x1={180} y1={1660} x2={130} y2={1240} stroke="#2a2f34" strokeWidth={10} />
      <line x1={80} y1={1660} x2={130} y2={1240} stroke="#2a2f34" strokeWidth={10} />
      <rect x={92} y={1180} width={86} height={64} rx={10} fill="#E0B13D" transform="rotate(-24 135 1212)" />
      <path d="M 150 1190 L 900 300 L 1100 560 L 172 1226 Z" fill={C.oroClaro} opacity={0.07} />
    </g>
    <path d="M 120 1700 Q 400 1650 600 1720 T 980 1700 L 1000 1790 Q 600 1840 120 1780 Z" fill={C.lino} opacity={0.2} />
    <path d="M 470 1640 C 560 1700 620 1600 700 1690" stroke="#11161b" strokeWidth={8} fill="none" />
    <Wires x={815} y={204} t={t} len={86} />
    <Lamp x={815} y={204} on={lamp} cord={92} />
  </g>
);
/** Cocina con la luz cortada: muebles, cuadro eléctrico con un diferencial saltado (rojo), ventana al atardecer.
 *  children se pinta delante de la pared y detrás de la encimera (la clienta queda «tras el mostrador»). */
export const Kitchen: React.FC<{ t: number; tripped?: number; children?: React.ReactNode }> = ({ t, tripped = 1, children }) => (
  <g>
    <defs><linearGradient id="kit-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141C25" /><stop offset="1" stopColor="#222D38" /></linearGradient></defs>
    <rect x={-400} y={-400} width={1880} height={2700} fill="url(#kit-wall)" />
    <Window x={640} y={780} w={300} h={330} t={t} id="kit-win" />
    {Array.from({ length: 5 }, (_, i) => <g key={i}><rect x={-40 + i * 230} y={330} width={214} height={360} rx={10} fill="#2C3843" /><rect x={-40 + i * 230 + 92} y={640} width={30} height={10} rx={5} fill={C.lino} opacity={0.6} /></g>)}
    <rect x={-60} y={300} width={1200} height={30} fill="#1F2932" />
    <g transform="translate(250 790)">
      <rect width={190} height={250} rx={10} fill={C.linoSombra} />
      <rect x={14} y={14} width={162} height={222} rx={6} fill="#C8C1B2" />
      {Array.from({ length: 6 }, (_, i) => {
        const bad = i === 2 && tripped > 0;
        return <g key={i}><rect x={24 + (i % 3) * 50} y={40 + Math.floor(i / 3) * 100} width={36} height={70} rx={4} fill="#EDEDED" stroke="#999" /><rect x={32 + (i % 3) * 50} y={bad ? 86 + Math.floor(i / 3) * 100 : 50 + Math.floor(i / 3) * 100} width={20} height={22} rx={3} fill={bad ? C.alerta : "#666"} opacity={bad ? 0.6 + 0.4 * Math.sin(t * 6) : 1} /></g>;
      })}
    </g>
    <g transform="translate(540 120)"><line x1={0} y1={0} x2={0} y2={110} stroke="#0d1218" strokeWidth={5} /><path d="M -70 170 Q -64 110 0 110 Q 64 110 70 170 Z" fill="#3A4650" /></g>
    {children}
    <g transform="translate(-30 380)"><rect width={250} height={1180} rx={14} fill="#36434E" /><rect x={196} y={140} width={16} height={180} rx={8} fill={C.lino} opacity={0.6} /><line x1={0} y1={420} x2={250} y2={420} stroke="#26313A" strokeWidth={6} /></g>
    <rect x={-60} y={1170} width={1200} height={48} fill={C.linoSombra} />
    <rect x={-60} y={1218} width={1200} height={400} fill="#2A3640" />
    {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-30 + i * 230} y={1250} width={210} height={330} rx={8} fill="#303D48" stroke="#25303A" strokeWidth={4} />)}
    <rect x={-60} y={1618} width={1200} height={400} fill="#1A2129" />
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={-60 + i * 150} y1={1618} x2={-260 + i * 190} y2={2000} stroke="#141A20" strokeWidth={4} />)}
  </g>
);
/** Calle con furgoneta de la empresa (rótulo genérico) y casas; para escenas de desplazamiento o llegada a obra */
export const Street: React.FC<{ t: number; vanX?: number; label?: string }> = ({ t, vanX = 300, label = "INSTALACIONES" }) => (
  <g>
    <defs><linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E1620" /><stop offset="0.6" stopColor="#2B3A48" /><stop offset="1" stopColor={C.oro} /></linearGradient></defs>
    <rect x={-400} y={-400} width={1880} height={1700} fill="url(#st-sky)" />
    {Array.from({ length: 5 }, (_, i) => (
      <g key={i} transform={`translate(${-120 + i * 280} ${720 + (i % 2) * 60})`}>
        <rect width={250} height={700} fill={i % 2 ? "#1A232C" : "#202A34"} />
        <path d="M -10 0 L 125 -90 L 260 0 Z" fill="#141B22" />
        {Array.from({ length: 6 }, (_, j) => <rect key={j} x={30 + (j % 2) * 110} y={60 + Math.floor(j / 2) * 170} width={80} height={110} fill={random(`st${i}${j}`) > 0.5 ? C.oroClaro : "#2E3A45"} opacity={0.75} />)}
      </g>
    ))}
    <rect x={-400} y={1380} width={1880} height={160} fill="#3A434C" />
    <rect x={-400} y={1540} width={1880} height={700} fill="#22282E" />
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-200 + i * 220 - ((t * 120) % 220)} y={1720} width={120} height={14} fill={C.lino} opacity={0.5} />)}
    <g transform={`translate(${vanX} 1340)`}>
      <path d="M 0 300 L 0 80 Q 0 40 40 40 L 420 40 Q 470 40 500 90 L 590 200 Q 610 220 610 260 L 610 300 Z" fill={C.luz} />
      <path d="M 430 70 L 490 70 L 560 190 L 430 190 Z" fill="#26323C" />
      <rect x={30} y={170} width={380} height={18} fill={C.oro} />
      <text x={220} y={140} textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight={700} fontSize={40} letterSpacing={6} fill={C.noche}>{label}</text>
      {[110, 480].map((wx) => <g key={wx}><circle cx={wx} cy={300} r={56} fill="#15191d" /><circle cx={wx} cy={300} r={24} fill="#9AA3AA" /></g>)}
    </g>
  </g>
);
