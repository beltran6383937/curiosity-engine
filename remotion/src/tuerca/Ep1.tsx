// La Tuerca · episodio 1, «Esto es todo lo que he hecho hoy» (gancho = plantilla #18 de viral-hooks). Tres fotos reales
// (furgoneta, cocina con caldera, azotea) y la tuerca por código encima. Tiempos: ep1-timeline.json, que sale de la voz
// real (ratopin-universe/tools/tuerca_ep1.py). Todo se anima a 12 dibujos/s (fq = fotograma par).
import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { track, noise, Key } from "../ratopin/anim";
import { Boil } from "../ratopin/rig";
import { Nut, NutPose, NUT, INK, Wrench } from "./Nut";
import TL from "./ep1-timeline.json";

type P = readonly [number, number];
const ev = TL.ev as Record<string, number>;
const L = TL.lines as unknown as Record<string, [number, number, string]>;
const f = (n: number) => n.toFixed(1);
const tk = (keys: readonly Key[], t: number) => track(keys, t);
const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));
const talking = (t: number) => Object.values(L).some(([s, e]) => t >= s && t <= e);
const within = (name: string, t: number) => (t - L[name][0]) / (L[name][1] - L[name][0]); // 0‥1 dentro de una frase

const Bg: React.FC<{ src: string; shakeBoiler?: number }> = ({ src, shakeBoiler = 0 }) => (
  <>
    <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
    {shakeBoiler !== 0 && (   // la caldera de la foto vibra de verdad: copia recortada a la caldera y desplazada
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        clipPath: "inset(70px 362px 1415px 446px)", transform: `translate(${f(shakeBoiler)}px, ${f(-Math.abs(shakeBoiler) * 0.4)}px)` }} />
    )}
  </>
);

const Caption: React.FC<{ text: string; big?: boolean }> = ({ text, big }) => (
  <div style={{ position: "absolute", top: big ? 200 : 230, left: 60, right: 60, textAlign: "center", fontFamily: "Hanken Grotesk, Arial Black, sans-serif",
    fontWeight: 900, fontSize: big ? 82 : 66, lineHeight: 1.08, color: "#fff", WebkitTextStroke: `${big ? 16 : 13}px #111`, paintOrder: "stroke fill",
    textShadow: "0 6px 0 rgba(0,0,0,0.35)" }}>{text}</div>
);

// ── poses por escena ──
function van(t: number): { p: NutPose; extra: React.ReactNode; cam: number } {
  const breathe = Math.sin(t / 24 * 2 * Math.PI / 1.4);
  const m = TL.mouth[Math.min(TL.mouth.length - 1, t)] ?? 0;
  const suck = ev.suck, pop = ev.pop;
  const belly = tk([[0, 1], [suck, 1], [suck + 14, 0.5, "inOut"], [pop - 1, 0.46], [pop, 1.38, "linear"], [pop + 4, 0.88, "out"], [pop + 8, 1.15, "inOut"],
    [pop + 12, 0.95, "inOut"], [pop + 17, 1.04, "inOut"], [pop + 22, 1]], t) + breathe * 0.025;
  const sy = tk([[0, 1], [suck, 1], [suck + 14, 1.1, "inOut"], [pop - 1, 1.11], [pop, 0.84, "linear"], [pop + 4, 1.05, "out"], [pop + 9, 0.98, "inOut"], [pop + 14, 1]], t)
    + breathe * 0.01 + m * 0.012;
  const shake = t > pop - 12 && t < pop ? Math.sin(t * 2.6) * 3 : 0;
  const k1 = within("L01", t);
  // gestos de L01: «soy una tuerca» → se señala · «todo lo que he hecho hoy» → abre los brazos
  const point = k1 > 0.28 && k1 < 0.6, open = k1 > 0.74 && t < L.L02[0];
  const hips = t >= L.L02[0] + (L.L02[1] - L.L02[0]) * 0.55 && t < pop;
  const hl: P = hips ? [-196 + shake, -250] : point ? [-70, -300] : open ? [-280, -470] : [-246, -170 + breathe * 4];
  const hr: P = hips ? [196 - shake, -250] : open ? [280, -470] : [246, -170 + breathe * 4];
  const lid = tk([[0, 0.5], [20, 0.5], [21, 1, "linear"], [22, 0.5, "linear"], [suck, 0.5], [suck + 10, 0.12, "inOut"], [pop, 0.1], [pop + 1, 0, "linear"],
    [pop + 10, 0], [L.L03[0] - 2, 0.62, "inOut"], [L.L03[1] + 4, 0.62], [L.L03[1] + 5, 1, "linear"], [L.L03[1] + 7, 0.62, "linear"]], t);
  const brow = tk([[0, 4], [suck, 4], [suck + 10, -10, "inOut"], [pop, -12], [pop + 1, -34, "linear"], [pop + 10, -28], [L.L03[0], 8, "inOut"]], t);
  const mouth = t >= suck && t < pop ? 0 : t >= pop && t < pop + 10 ? tk([[pop, 1, "linear"], [pop + 10, 0.4]], t) : 0.15 + m * 0.85;
  const p: NutPose = { x: 540 + shake, y: 1575, scale: 1, sy, belly, lid, brow, mouth, hl, hr, cheeks: t >= suck + 6 && t < pop ? 1 : 0,
    look: t >= suck + 4 && t < pop ? [-12, -6] : [0, 0], buckle: t < pop, sweat: t > L.L03[0] ? Math.min(1, (t - L.L03[0]) / 30) : 0 };
  // hebilla disparada hacia la cámara y cristal roto
  const bk = t >= pop ? Math.min(1, (t - pop) / (ev.crack - pop)) : 0;
  const extra = <>
    {bk > 0 && bk < 1 && (() => { const s = 1 + bk * bk * 6.5, x = 570 + bk * 70, y = 1290 - bk * 820;
      return <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(bk * 560)}) scale(${f(s)})`}>
        <rect x={-28} y={-21} width={56} height={42} rx={7} fill="#d9b44a" stroke={INK} strokeWidth={7 / Math.sqrt(s)} />
        <rect x={-13} y={-9} width={26} height={16} rx={3} fill="none" stroke={INK} strokeWidth={4 / Math.sqrt(s)} /></g>; })()}
    {t >= ev.crack && <g stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.92}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const a = i * 0.7 + 0.3, l = 230 + (i % 3) * 130;
        return <path key={i} d={`M 640 470 L ${f(640 + Math.cos(a) * l * 0.45 + 18)} ${f(470 + Math.sin(a) * l * 0.45)} L ${f(640 + Math.cos(a) * l)} ${f(470 + Math.sin(a) * l)}`} />; })}
      <circle cx={640} cy={470} r={36} /><circle cx={640} cy={470} r={105} strokeDasharray="38 28" />
    </g>}
  </>;
  return { p, extra, cam: t >= ev.crack && t < ev.crack + 8 ? Math.sin(t * 3) * 14 : 0 };
}

function walkFeet(t: number, t0: number, t1: number): { fl: P; fr: P; bob: number } {
  if (t >= t1) return { fl: [-78, 0], fr: [78, 0], bob: 0 };
  const ph = ((t - t0) / 6) % 2, k = ph % 1, lift = Math.sin(Math.PI * k) * 34, swing = (k - 0.5) * 70;
  return ph < 1 ? { fl: [-78 + swing, -lift], fr: [78 - swing, 0], bob: Math.sin(Math.PI * k) } : { fl: [-78 - swing, 0], fr: [78 + swing, -lift], bob: Math.sin(Math.PI * k) };
}

function kitchen(t: number) {
  const k0 = ev.kitchen, m = TL.mouth[Math.min(TL.mouth.length - 1, t)] ?? 0;
  const X = 400, walkEnd = k0 + 30;
  const x = tk([[k0, -220], [walkEnd, X, "out"]], t);
  const w = walkFeet(t, k0, walkEnd);
  const breathe = Math.sin(t / 24 * 2 * Math.PI / 1.4);
  const noisy = t >= ev.trrr && t < ev.clonk;
  const lookUp = t >= ev.trrr && t < L.L05[0] + 12;
  const face = tk([[ev.trrr, 0], [ev.trrr + 5, 0.45, "out"], [L.L05[0] + 10, 0.45], [L.L05[0] + 16, 0, "inOut"], [ev.windup, 0], [ev.windup + 4, 0.35, "out"], [ev.bonk, 0.35], [ev.bonk + 1, 0, "linear"]], t);
  const lid = tk([[k0, 0.5], [ev.trrr, 0.5], [ev.trrr + 4, 0.15, "out"], [L.L05[1], 0.4], [ev.stare, 0.4], [ev.stare + 3, 0, "linear"], [L.L06[0], 0],
    [L.L07[0], 0.3, "inOut"], [ev.bonk, 0.3], [ev.bonk + 1, 0.6, "linear"]], t) + (t >= ev.stare + 6 && t < L.L06[0] && Math.floor(t / 2) % 3 === 0 ? 0.08 : 0);
  const brow = tk([[k0, 4], [ev.trrr, 4], [ev.trrr + 4, -14, "out"], [L.L05[0] + 12, 4], [L.L05[1], 10], [ev.stare, 12], [ev.stare + 4, 22, "out"],
    [L.L06[0], -24, "back"], [L.L06[1] + 4, 16, "inOut"], [L.L07[1], 20], [ev.bonk, 20], [ev.bonk + 1, -6, "linear"]], t);
  const talkM = 0.15 + m * 0.85;
  // tirar la llave: de la mano a la caldera y vuelta a la cabeza
  const hasWrench = t >= L.L07[0] + 6 && t < ev.throw;
  const wind = tk([[ev.windup, 0], [ev.throw - 2, 1, "out"], [ev.throw, -1, "linear"], [ev.throw + 6, -0.6, "out"], [ev.bonk, -0.4], [ev.bonk + 8, 0, "inOut"]], t);
  const rot = t >= ev.windup && t < ev.bonk + 6 ? wind * -7 : 0;
  const bonkSq = tk([[ev.bonk, 1], [ev.bonk + 1, 0.78, "linear"], [ev.bonk + 5, 1.08, "out"], [ev.bonk + 9, 0.97, "inOut"], [ev.bonk + 13, 1]], t);
  const sy = (1 + breathe * 0.01 + m * 0.012 + w.bob * 0.04) * bonkSq;
  const hr: P = t >= ev.windup && t < ev.throw ? [lerp(240, 300, (t - ev.windup) / 6), lerp(-260, -120, (t - ev.windup) / 6)]
    : t >= ev.throw && t < ev.throw + 8 ? [210, -640] : hasWrench ? [236, -300] : lookUp ? [200, -360] : [246, -170 + breathe * 4];
  const hl: P = t >= L.L06[0] && t < L.L06[1] + 6 ? [-250, -430] : lookUp && t < ev.trrr + 18 ? [-150, -470] : [-246, -170 + breathe * 4];
  const mouth = t >= ev.bonk && t < ev.bonk + 12 ? 0.9 : t >= ev.stare && t < L.L06[0] ? 0.05 : t >= ev.trrr && t < ev.trrr + 8 ? 0.6 : talkM;
  const capFly = t >= ev.bonk ? Math.min(1, (t - ev.bonk) / 14) : 0;
  const p: NutPose = { x, y: 1660, scale: 0.92, sy, rot, pivot: [0, 0], lid, brow, mouth, face, hl, hr, fl: w.fl, fr: w.fr,
    look: lookUp ? [12, -16] : t >= ev.throw && t < ev.clonk ? [16, -18] : t >= ev.clonk && t < ev.bonk ? [10, -10] : [0, 0],
    wrench: t < L.L07[0] + 6 ? "belt" : hasWrench ? "hand" : "none", cap: capFly < 1, capOff: [-capFly * 420, -capFly * 520 + capFly * capFly * 300, -capFly * 260] };
  // la llave vuela: mano → caldera (arco) · caldera → cabeza
  const BO: P = [580, 330], hand: P = [X + 210 * 0.92, 1660 - 640 * 0.92], head: P = [X - 10, 1660 + (NUT.CY - NUT.H - 40) * 0.92];
  const wk1 = (t - ev.throw) / (ev.clonk - ev.throw), wk2 = (t - ev.clonk) / (ev.bonk - ev.clonk);
  const wpos = (a: P, c: P, b: P, k: number): P => [(1 - k) ** 2 * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0], (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1]];
  const fly = wk1 >= 0 && wk1 < 1 ? { p: wpos(hand, [760, 300], BO, wk1), r: wk1 * 900 } : wk2 >= 0 && wk2 < 1 ? { p: wpos(BO, [380, 260], head, wk2), r: 900 + wk2 * 720 } : null;
  const dizzy = t >= ev.bonk && t < ev.roof;
  const extra = <>
    {noisy && <g>
      {[0, 1, 2].map((i) => <path key={i} d={`M ${f(445 - i * 26)} ${f(220 + i * 40)} q -24 30 0 60 M ${f(715 + i * 26)} ${f(220 + i * 40)} q 24 30 0 60`}
        stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" opacity={Math.floor(t / 2) % 2 ? 1 : 0.5} />)}
      <text x={590 + (Math.floor(t / 2) % 2 ? 6 : -6)} y={600} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={64} fill="#fff"
        stroke={INK} strokeWidth={10} paintOrder="stroke" transform={`rotate(${Math.floor(t / 2) % 2 ? -4 : 4} 590 600)`}>TRRR TRRR</text>
    </g>}
    {fly && <g transform={`translate(${f(fly.p[0])} ${f(fly.p[1])}) rotate(${f(fly.r)})`}><Wrench s={0.85} /></g>}
    {t >= ev.clonk && t < ev.clonk + 6 && <g transform={`translate(${BO[0]} ${BO[1]})`}>
      <polygon points="0,-110 26,-34 104,-40 42,10 70,88 0,40 -70,88 -42,10 -104,-40 -26,-34" fill="#ffe14d" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <text y={22} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={44} fill={INK}>CLONK</text></g>}
    {t >= ev.bonk && t < ev.bonk + 8 && <text x={head[0] + 120} y={head[1] - 30} fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={70} fill="#fff" stroke={INK}
      strokeWidth={11} paintOrder="stroke" transform={`rotate(-12 ${head[0] + 120} ${head[1] - 30})`}>¡BONK!</text>}
    {t >= ev.bonk && <g transform={`translate(${X + 200} 1652) rotate(84)`}><Wrench s={0.85} /></g>}
    {dizzy && [0, 1, 2].map((i) => { const a = (t - ev.bonk) * 0.35 + i * 2.1, cx = X + Math.cos(a) * 150, cy = head[1] + 10 + Math.sin(a) * 34;
      return <polygon key={i} transform={`translate(${f(cx)} ${f(cy)}) scale(0.32)`} points="0,-110 26,-34 104,-40 42,10 70,88 0,40 -70,88 -42,10 -104,-40 -26,-34"
        fill="#ffe14d" stroke={INK} strokeWidth={22} strokeLinejoin="round" />; })}
  </>;
  const shakeBoiler = noisy ? (Math.floor(t / 2) % 2 ? 5 : -5) : 0;
  const push = tk([[ev.stare, 1], [L.L06[0], 1.13, "inOut"], [L.L07[1], 1.13], [ev.windup, 1, "out"]], t);
  return { p, extra, shakeBoiler, push };
}

function roof(t: number) {
  const r0 = ev.roof, m = TL.mouth[Math.min(TL.mouth.length - 1, t)] ?? 0, R = NUT.R, H = NUT.H, S = 0.95;
  const rolling = t < ev.popup;
  const breathe = Math.sin(t / 24 * 2 * Math.PI / 1.4);
  let p: NutPose;
  const X = 620, G = 1610;
  if (rolling) {   // rueda de canto en canto: 7 pasos de 60°, cada paso acelera y hace «clonc»
    const u = Math.max(0, (t - r0) / (ev.popup - r0)) * 7, step = Math.min(7, Math.floor(u)), k = Math.min(1, u - step), e = k * k;
    const th = (step + e) * 60, x = X + (7 - step - e) * R * S;
    const lift = (R * Math.cos((30 - (e * 60)) * Math.PI / 180) - H) * S;
    p = { x, y: G + (-NUT.CY - H) * S - lift, scale: S, rot: -th, pivot: [0, NUT.CY], limbs: false, belly: 0, cap: false, lid: 0.8, mouth: 0.5, hl: [0, 0], hr: [0, 0] };
  } else {
    const fall = ev.fall, cl = ev.clonc;
    const rot = tk([[fall, 0], [fall + 3, -4, "out"], [cl, 86, "in"], [cl + 3, 78, "out"], [cl + 6, 86, "in"], [cl + 8, 84]], t);
    const pant = t < L.L09[1] ? Math.abs(Math.sin((t - ev.popup) / 24 * Math.PI / 0.42)) : 0;
    const belly = tk([[ev.popup, 0], [ev.popup + 3, 1.3, "out"], [ev.popup + 7, 0.9, "inOut"], [ev.popup + 11, 1.06, "inOut"], [ev.popup + 15, 1]], t) + pant * 0.06 + breathe * 0.02;
    const capDrop = tk([[ev.popup + 4, -900], [ev.popup + 14, 0, "in"], [ev.popup + 16, -40, "out"], [ev.popup + 19, 0, "in"]], t);
    const onPhone = t >= ev.ring + 10 && t < ev.fall;
    const ringing = t >= ev.ring && t < ev.ring + 10;
    const thumb = t >= L.L09[0] + 8 && t < L.L09[1] + 4;
    const KO = t >= ev.clonc;
    const tw = KO && Math.floor(t / 6) % 4 === 1 ? 14 : 0;
    const fx = tk([[fall, X], [cl, X - 240, "in"]], t);   // se desplaza a la izquierda al caer para que la cara no salga del encuadre
    p = { x: fx, y: G, scale: S, rot, pivot: [110, 0], belly, sy: 1 + pant * 0.05 + m * 0.012, sweat: Math.min(1, (t - ev.popup) / 40),
      lid: KO ? 0.92 : ringing ? 0.05 : tk([[ev.popup, 0.75], [L.L09[0], 0.7], [L.L09[1], 0.75]], t),
      brow: ringing ? -26 : t >= L.L10[0] && !KO ? -18 : 10, mouth: KO ? 0.55 : ringing ? 0.7 : Math.max(pant * 0.7, 0.15 + m * 0.85),
      look: ringing ? [-14, 10] : [0, 0], cap: true, capOff: [0, capDrop, capDrop * 0.02],
      hl: onPhone ? [-246, -180] : KO ? [-240, -150] : [-236, -170 + pant * 10],
      hr: onPhone ? [150, -390] : ringing ? [140, -170] : thumb ? [250, -380 + Math.sin(t * 1.7) * 8] : [246, -170 + pant * 10],
      fl: KO ? [-78, -tw] : [-78, 0], fr: KO ? [78, tw ? 0 : -10] : [78, 0], phone: onPhone, wrench: "none" };
  }
  const extra = <>
    {t >= ev.ring && t < ev.ring + 10 && <g transform={`translate(${X + 150} ${G - 300})`}>
      {[0, 1, 2].map((i) => <path key={i} d={`M ${30 + i * 26} -40 q 22 40 0 80`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" opacity={Math.floor(t / 2) % 2 ? 1 : 0.4} />)}
      <text x={60} y={-70} fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={58} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">RIIING</text></g>}
    {t >= ev.clonc && t < ev.clonc + 7 && <text x={X + 170} y={G - 150} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize={84} fill="#fff"
      stroke={INK} strokeWidth={12} paintOrder="stroke">¡CLONC!</text>}
    {t >= ev.clonc && t < ev.clonc + 10 && [0, 1, 2, 3].map((i) => <circle key={i} cx={X + 60 + i * 70} cy={G - 10 - ((t - ev.clonc) * (3 + i))} r={22 + i * 4} fill="#d9d4cc" opacity={0.7 - (t - ev.clonc) * 0.06} />)}
  </>;
  return { p, extra };
}

export const TuercaEp1: React.FC<{ camera?: boolean; boil?: boolean }> = ({ camera = true, boil = true }) => {
  const frame = useCurrentFrame(), t = Math.floor(frame / 2) * 2, D = t / 2;
  const scene = t < ev.kitchen ? "van" : t < ev.roof ? "kitchen" : "roof";
  const s = scene === "van" ? van(t) : scene === "kitchen" ? kitchen(t) : roof(t);
  const camX = camera ? noise(frame * 0.05, 1) * 6 : 0, camY = camera ? noise(frame * 0.05, 7) * 6 : 0;
  const push = scene === "kitchen" ? (s as ReturnType<typeof kitchen>).push : 1;
  const hit = scene === "van" ? (s as ReturnType<typeof van>).cam : 0;
  const bgSrc = scene === "van" ? "tuerca/fondo-furgoneta.png" : scene === "kitchen" ? "tuerca/fondo-cocina.png" : "tuerca/fondo-azotea.png";
  const cur = Object.entries(L).find(([, [a, b]]) => frame >= a - 2 && frame <= b + 8);
  const endCard = frame >= L.L11[0] - 4;
  const origin = scene === "kitchen" ? "400px 1300px" : "540px 1300px";
  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      <Audio src={staticFile("tuerca/ep1/mix.wav")} />
      <AbsoluteFill style={{ transform: `translate(${f(camX + (camera ? hit : 0))}px, ${f(camY)}px) scale(${f(1.04 * push)})`, transformOrigin: origin }}>
        <Bg src={bgSrc} shakeBoiler={scene === "kitchen" ? (s as ReturnType<typeof kitchen>).shakeBoiler : 0} />
        <Boil d={D} scale={boil ? 2.2 : 0}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Nut p={s.p} id="nut" />
            {s.extra}
          </svg>
        </Boil>
      </AbsoluteFill>
      {endCard ? (
        <AbsoluteFill style={{ background: "rgba(10,12,14,0.55)", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "Hanken Grotesk, Arial Black, sans-serif", fontWeight: 900, fontSize: 96, color: "#fff", textAlign: "center", lineHeight: 1.05,
            WebkitTextStroke: "16px #111", paintOrder: "stroke fill", marginTop: -380, transform: `scale(${f(tk([[L.L11[0] - 4, 0.6], [L.L11[0] + 4, 1, "back"]], t))})` }}>
            Comenta<br /><span style={{ color: "#f0a43a" }}>TUERCA</span></div>
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
