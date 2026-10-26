// Pepa · episodio 1, «Esto es todo lo que he supervisado hoy» (gancho = plantilla #18 de viral-hooks). Foto real de azotea
// y todo lo demás por código: Pepa, la condensadora, la caja y el bocadillo del instalador. Tiempos: ep1-timeline.json
// (ratopin-universe/tools/pepa_ep1.py, sale de la voz real). Se anima a 12 dibujos/s.
import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { track, noise, Key } from "../ratopin/anim";
import { Boil } from "../ratopin/rig";
import { Pepa, PepaPose, Condensadora, Caja, Bocata, INK } from "./Pepa";
import TL from "./ep1-timeline.json";

type P = readonly [number, number];
const ev = TL.ev as Record<string, number>;
const L = TL.lines as unknown as Record<string, [number, number, string]>;
const f = (n: number) => n.toFixed(1);
const tk = (keys: readonly Key[], t: number) => track(keys, t);
const within = (name: string, t: number) => (t - L[name][0]) / (L[name][1] - L[name][0]);
const X0 = 440, XI = 440, G = 1700;

const Caption: React.FC<{ text: string; big?: boolean }> = ({ text, big }) => (
  <div style={{ position: "absolute", top: big ? 200 : 230, left: 60, right: 60, textAlign: "center", fontFamily: "Hanken Grotesk, Arial Black, sans-serif",
    fontWeight: 900, fontSize: big ? 82 : 66, lineHeight: 1.08, color: "#fff", WebkitTextStroke: `${big ? 16 : 13}px #111`, paintOrder: "stroke fill",
    textShadow: "0 6px 0 rgba(0,0,0,0.35)" }}>{text}</div>
);
const Pow: React.FC<{ x: number; y: number; t: string; r?: number; s?: number }> = ({ x, y, t, r = -8, s = 70 }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={s} fill="#fff" stroke={INK} strokeWidth={s / 6.5}
    paintOrder="stroke" transform={`rotate(${r} ${x} ${y})`}>{t}</text>
);

// paso de paloma: patas alternas y la cabeza que se adelanta y se queda quieta mientras el cuerpo la alcanza
function walk(t: number, t0: number): { legs: [P, P]; head: P } {
  const ph = ((t - t0) / 5) % 2, k = ph % 1, lift = Math.sin(Math.PI * k) * 30, sw = (k - 0.5) * 50;
  const head: P = [-(k < 0.5 ? k * 2 : 1) * 46 + 23, 0];
  return { legs: ph < 1 ? [[sw, -lift], [-sw, 0]] : [[-sw, 0], [sw, -lift]], head };
}

function pose(t: number): { p: PepaPose; extra: React.ReactNode; fan: number; splat: number; box: number; bocata: [number, number, number]; shake: number } {
  const m = TL.mouth[Math.min(TL.mouth.length - 1, t)] ?? 0, breathe = Math.sin(t / 24 * 2 * Math.PI / 1.6);
  const talk = 0.05 + m * 0.95;
  let p: PepaPose = { x: X0, y: G, sy: 1 + breathe * 0.012, mouth: talk, headRot: m * 4, lid: 0.45 };
  let extra: React.ReactNode = null;
  // gancho: «soy paloma» saca pecho · «jefa de obra» enseña el portapapeles
  if (t < ev.arrive) {
    const k1 = within("L01", t);
    p = { ...p, belly: k1 > 0.15 && k1 < 0.45 ? 1.08 : 1, wing: k1 > 0.55 && t < L.L02[1] ? 0.7 : 0, lid: t < L.L02[0] ? 0.45 : 0.5, head: [0, k1 > 0.15 && k1 < 0.45 ? -12 : 0] };
  } else if (t < ev.turn1) {   // llega el instalador: la caja cae, el bocadillo aterriza en la máquina
    const jump = tk([[ev.box, 1], [ev.box + 2, 0.9, "linear"], [ev.box + 6, 1.04, "out"], [ev.box + 10, 1]], t);
    p = { ...p, sy: jump, lid: t >= ev.box ? 0.1 : 0.45, look: t >= ev.bocata ? [14, -10] : t >= ev.box ? [-6, 6] : [0, 0], ruffle: t >= ev.box && t < ev.box + 6 ? 0.4 : 0 };
  } else if (t < ev.fan) {    // inspección: se gira, camina, tres picotazos y la lista de fallos
    const w = t < ev.turn1 + 14 ? walk(t, ev.turn1) : null;
    const pk = t >= ev.peck && t < ev.peck + 16 ? Math.max(0, Math.sin(((t - ev.peck) / 5.3) * Math.PI)) : 0;
    const read = t >= L.L05[0] - 4;
    const k5 = within("L05", t), marks = k5 >= 0.97 ? 3 : k5 >= 0.6 ? 2 : k5 >= 0.3 ? 1 : 0;
    p = { ...p, flip: -1, x: w ? X0 + (XI - X0) * ((t - ev.turn1) / 14) : XI, legs: w?.legs, head: w ? w.head : [-pk * 48, pk * 10], headRot: -pk * 8 + m * 4,
      wing: read ? 1 : 0, marks, lid: read ? 0.5 : 0.35, lidTilt: read ? 0.55 : 0, mouth: pk > 0 ? 0.1 : talk };
    if (pk > 0.8) extra = <Pow x={760} y={1020} t="TOC" s={56} r={8} />;
  } else if (t < ev.back) {   // el ventilador arranca y se la lleva volando
    const k = Math.max(0, (t - ev.blow) / 12);
    p = { ...p, flip: -1, x: XI - k * k * 1100, y: G - Math.sin(Math.min(1, k) * Math.PI) * 260 - k * 60, rot: -k * 540, lid: 0, look: [10, -6],
      ruffle: t >= ev.blow ? 1 : tk([[ev.fan, 0], [ev.blow, 0.3]], t), mouth: t >= ev.blow ? 0.9 : 0.4, wing: t >= ev.blow ? 1 : 0, marks: 3 };
    if (t >= ev.blow) extra = <>
      <Pow x={540} y={760} t="FIUUUU" s={84} r={-6} />
      {[0, 1, 2, 3, 4, 5].map((i) => { const a = (t - ev.blow) * 0.3 + i; return <path key={i} d={`M0 -26 C16 -10 16 10 0 26 C-16 10 -16 -10 0 -26 Z`} fill="#c9ccd1" stroke={INK} strokeWidth={5}
        transform={`translate(${f(XI - (t - ev.blow) * (30 + i * 9) + i * 30)} ${f(1150 + i * 70 + Math.sin(a) * 50)}) rotate(${f(a * 80)})`} />; })}
      {[0, 1, 2].map((i) => <path key={`w${i}`} d={`M${680 - i * 30} ${1220 + i * 110} q -160 -30 -320 0`} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.85} />)}
    </>;
  } else if (t < ev.eat) {    // vuelve despeinada: «Funciona.» · ve el bocadillo
    const w = t < ev.back + 24 ? walk(t, ev.back) : null;
    const seeing = t >= ev.see;
    p = { ...p, flip: -1, x: w ? -260 + (XI + 260) * Math.min(1, (t - ev.back) / 24) : XI, legs: w?.legs, head: w ? w.head : seeing ? [-20, -40] : [0, 0],
      ruffle: 1, hat: [-14, 14, -20], lid: seeing ? 0 : 0.62, headRot: seeing ? 12 : m * 3, look: seeing ? [-4, -12] : [0, 0], blush: seeing ? 0.8 : 0 };
    if (seeing && t < L.L07[0]) extra = <Pow x={830} y={890} t="♥" s={90} r={0} />;
  } else if (t < ev.turn2) {  // se come el bocadillo en tres bocados, se hincha, hipo; «Superada.»
    const bite = t < ev.gulp ? Math.max(0, Math.sin(((t - ev.eat) / 7.2) * Math.PI)) : 0;
    const belly = tk([[ev.gulp, 1], [ev.gulp + 3, 1.42, "out"], [ev.gulp + 7, 1.24, "inOut"], [ev.gulp + 11, 1.33, "inOut"], [ev.gulp + 15, 1.3]], t);
    const hip = tk([[ev.hip, 1], [ev.hip + 2, 1.08, "out"], [ev.hip + 6, 1]], t);
    p = { ...p, flip: -1, x: XI, ruffle: 1, hat: [-14, 14, -20], belly, sy: hip + breathe * 0.012, head: [-20 - bite * 30, -40 - bite * 30], headRot: 12 + bite * 6,
      mouth: t < ev.gulp ? (bite > 0.5 ? 0.7 : 0.1) : talk, lid: t >= L.L08[0] - 4 ? 0.88 : 0.3, blush: t >= ev.gulp ? 1 : 0.6 };
    if (bite > 0.7) extra = <Pow x={720} y={880} t="ÑAM" s={58} r={6} />;
    if (t >= ev.hip && t < ev.hip + 8) extra = <Pow x={300} y={980} t="¡HIP!" s={60} r={-10} />;
  } else {                    // «lo firmo»: se da la vuelta, culo a la máquina, PLOF
    const sq = tk([[ev.turn2 + 4, 1], [ev.turn2 + 10, 0.86, "inOut"], [ev.plof, 0.84], [ev.plof + 2, 1.08, "out"], [ev.plof + 7, 1]], t);
    const done = t >= ev.plof;
    p = { ...p, flip: 1, x: XI - 30, ruffle: 1, hat: [-14, 14, -20], belly: 1.3, sy: sq + breathe * 0.012, look: done ? [0, 0] : [14, 4],
      lid: done ? 0.9 : 0.5, lidTilt: done ? 0 : 0.45, blush: done ? 1 : 0.4, mouth: done ? 0.05 : 0.05 };
    if (done && t < ev.plof + 9) extra = <Pow x={830} y={1300} t="¡PLOF!" s={84} r={-8} />;
  }
  const bocata: [number, number, number] = [830, tk([[ev.bocata - 8, -300], [ev.bocata, 968, "in"], [ev.bocata + 2, 950, "out"], [ev.bocata + 4, 968, "in"]], t),
    t < ev.eat ? 1 : t < ev.gulp ? Math.max(0, 1 - Math.floor((t - ev.eat) / 7.2 + 0.5) / 3) : 0];
  const fan = t < ev.fan ? 0 : t < ev.back ? (t - ev.fan) ** 2 * 0.9 : (ev.back - ev.fan) ** 2 * 0.9 + (t - ev.back) * 2;
  return { p, extra, fan, splat: t >= ev.plof ? tk([[ev.plof, 0.2], [ev.plof + 3, 1.15, "out"], [ev.plof + 6, 1]], t) : 0,
    box: tk([[ev.box - 8, -1300], [ev.box, 0, "in"], [ev.box + 2, -24, "out"], [ev.box + 4, 0, "in"]], t),
    bocata, shake: t >= ev.fan && t < ev.back ? (Math.floor(t / 2) % 2 ? 3 : -3) : 0 };
}

export const PepaEp1: React.FC<{ camera?: boolean; boil?: boolean }> = ({ camera = true, boil = true }) => {
  const frame = useCurrentFrame(), t = Math.floor(frame / 2) * 2, D = t / 2;
  const s = pose(t);
  const camX = camera ? noise(frame * 0.05, 1) * 6 : 0, camY = camera ? noise(frame * 0.05, 7) * 6 : 0;
  const hit = camera && ((t >= ev.box && t < ev.box + 6) || (t >= ev.plof && t < ev.plof + 6)) ? Math.sin(t * 3) * 12 : 0;
  const cur = Object.entries(L).find(([, [a, b]]) => frame >= a - 2 && frame <= b + 8);
  const endCard = frame >= L.L10[0] - 4;
  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      <Audio src={staticFile("pepa/ep1/mix.wav")} />
      <AbsoluteFill style={{ transform: `translate(${f(camX + hit)}px, ${f(camY)}px) scale(1.04)`, transformOrigin: "540px 1300px" }}>
        <Img src={staticFile("tuerca/fondo-azotea.png")} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
        <Boil d={D} scale={boil ? 2.2 : 0}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Condensadora fan={s.fan} splat={s.splat} shake={s.shake} />
            <Bocata x={s.bocata[0]} y={s.bocata[1]} left={s.bocata[2]} />
            {t >= ev.box - 8 && <Caja y={s.box} />}
            <Pepa p={s.p} />
            {s.extra}
          </svg>
        </Boil>
      </AbsoluteFill>
      {endCard ? (
        <AbsoluteFill style={{ background: "rgba(10,12,14,0.55)", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "Hanken Grotesk, Arial Black, sans-serif", fontWeight: 900, fontSize: 96, color: "#fff", textAlign: "center", lineHeight: 1.05,
            WebkitTextStroke: "16px #111", paintOrder: "stroke fill", marginTop: -380, transform: `scale(${tk([[L.L10[0] - 4, 0.6], [L.L10[0] + 4, 1, "back"]], t).toFixed(4)})` }}>
            Comenta<br /><span style={{ color: "#d7f34a" }}>PEPA</span></div>
          <div style={{ fontFamily: "Hanken Grotesk, Arial, sans-serif", fontWeight: 800, fontSize: 50, color: "#fff", textAlign: "center", margin: "28px 90px 0",
            WebkitTextStroke: "9px #111", paintOrder: "stroke fill" }}>y te enseño a no perder ni un aviso</div>
          <div style={{ position: "absolute", bottom: 120, fontFamily: "Hanken Grotesk, Arial, sans-serif", fontWeight: 700, fontSize: 34, letterSpacing: 6, color: "#eae5da" }}>
            PÉREZ &amp; QUINTANO</div>
        </AbsoluteFill>
      ) : cur && <Caption text={cur[1][2]} big={cur[0] === "L01"} />}
      {frame < L.L01[0] && <Caption text={L.L01[2]} big />}
    </AbsoluteFill>
  );
};
