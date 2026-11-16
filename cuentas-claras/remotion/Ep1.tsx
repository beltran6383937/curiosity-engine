// CUENTAS CLARAS Nº1 - cartoon version. Story: fontanero under the sink misses a 350 EUR call -> customer calls the next one -> the ledger -> verdict -> CTA.
// Timing comes from tl.json (cues from Whisper word times of the final voice).
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, delayRender, continueRender } from "remotion";
import { OUT, SW, st, COL, FONT, Head, Torso, Arm, Wrench, Phone, Coin, Wing, Drop, Star, Burst, Bubble, Mouth } from "./art";
import TL from "./tl.json";

const FPS = 30; const CUE: any = TL.cue; const WORDS: { w: string; t0: number; t1: number }[] = (TL as any).words || [];
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x: number, s = 1.8) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
const pop = (t: number, t0: number, d = 0.45, s = 1.8) => (t < t0 ? 0 : back(ramp(t, t0, t0 + d), s));
const useT = () => useCurrentFrame() / FPS;
const blinkAt = (t: number, off = 0) => { const p = (t + off) % 2.6; return p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0; };

const SIDE = 540; // x centre

// ---------------------------------------------------------------- scene A: the plumber, the ringing phone, the flying coin
const SceneA: React.FC<{ t: number }> = ({ t }) => {
  const sh = t < CUE.siguiente + 0.4 ? Math.sin(t * 62) * 5 : 0;
  const manos = ramp(t, CUE.manos - 0.1, CUE.manos + 0.4);
  const fly = ramp(t, CUE.coin, CUE.coin + 1.5);
  const wingP = pop(t, CUE.coin - 0.25, 0.3, 2.2);
  const flap = Math.sin(t * 26) * 26;
  const coinX = 850 + 760 * eio(fly) , coinY = 700 - 1000 * eio(fly) + Math.sin(t * 3) * 10 * (1 - fly) - 60 * Math.sin(fly * Math.PI);
  const drip = (t * 0.85) % 1; const wr = Math.sin(t * 9) * 5;
  const zoom = 1 + 0.035 * ramp(t, 0, 10);
  const mouth: Mouth = manos > 0.5 ? "worry" : "tongue";
  const headX = 330, headY = 800 + Math.sin(t * 2.2) * 5;
  return (
    <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
      <rect width={1080} height={1920} fill={COL.lilacL} />
      <rect y={1250} width={1080} height={670} fill={COL.lilacD} />
      <path d="M0 1250 L1080 1250" stroke={OUT} strokeWidth={SW} />
      {/* wall tiles */}
      {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M${i * 190 + 40} 0 L${i * 190 + 40} 380`} stroke={COL.lilac} strokeWidth={6} />)}
      {/* faucet + counter */}
      <path d="M170 370 L170 250 Q170 200 230 200 L300 200 L300 250" fill="none" stroke={OUT} strokeWidth={46} strokeLinecap="round" /><path d="M170 370 L170 250 Q170 200 230 200 L300 200 L300 250" fill="none" stroke={COL.silver} strokeWidth={30} strokeLinecap="round" />
      <rect x={30} y={370} width={640} height={70} rx={20} fill={COL.white} {...st} />
      {/* cabinet back */}
      <rect x={50} y={430} width={590} height={820} rx={26} fill={COL.violet} {...st} />
      <rect x={100} y={490} width={490} height={650} rx={20} fill="#3A2A85" {...st} />
      {/* pipe + joint */}
      <path d="M545 490 L545 1100" stroke={OUT} strokeWidth={62} strokeLinecap="round" /><path d="M545 490 L545 1100" stroke={COL.silver} strokeWidth={46} strokeLinecap="round" />
      <rect x={510} y={770} width={70} height={64} rx={12} fill={COL.silverD} {...st} />
      <g transform={`translate(545 ${850 + drip * 270})`} opacity={drip < 0.9 ? 1 : 0}><Drop r={16} /></g>
      <ellipse cx={545} cy={1112} rx={60 + (drip > 0.9 ? 30 : 0)} ry={12} fill="#9FD3F5" opacity={0.9} />
      {/* plumber (clipped to the cupboard) */}
      <clipPath id="cab"><rect x={100} y={490} width={490} height={650} rx={20} /></clipPath><g clipPath="url(#cab)">
      <g transform={`translate(${headX} ${headY + 150})`}>
        <Torso shirt={COL.cream} bib={COL.blue} />
        <Arm a={[-200, 80]} b={[-175 + manos * 60, 250 - manos * 330]} bend={[-290, 200 - manos * 150]} sleeve={COL.cream} goo hand={30 + manos * 24} />
        <g transform={`translate(${215 + wr * 0.6} ${-120 + wr}) rotate(${wr * 1.2})`}><g transform="translate(0 -20)"><Wrench s={0.9} /></g></g>
        <Arm a={[200, 80]} b={[215 + wr * 0.6, -112 + wr]} bend={[285, -20]} sleeve={COL.cream} />
      </g>
      <g transform={`translate(${headX} ${headY}) rotate(-4)`}>
        <Head mouth={mouth} lookX={manos > 0.5 ? 0 : 9} lookY={manos > 0.5 ? 4 : -11} blink={blinkAt(t)} brow={manos > 0.5 ? 10 : -4} angry={0} sweat={manos > 0.5} />
      </g>
      </g>
      {/* cabinet front panel hides the torso */}
      <rect x={40} y={1135} width={610} height={125} rx={26} fill={COL.violet} {...st} />
      <rect x={290} y={1180} width={110} height={26} rx={13} fill={COL.lilac} {...st} strokeWidth={6} />
      {/* ringing phone */}
      {[0, 1, 2].map((k) => { const p = (t * 1.5 + k / 3) % 1; return <circle key={k} cx={850 + sh} cy={1160} r={120 + p * 170} fill="none" stroke={COL.violet} strokeWidth={9} opacity={(1 - p) * (t < CUE.siguiente + 0.4 ? 1 : 0)} />; })}
      <g transform={`translate(${850 + sh} 1160) rotate(${-8 + sh * 0.8})`}>
        <Phone w={210} h={360}>
          <circle cy={-60} r={52} fill={COL.violet} {...st} strokeWidth={6} />
          <path d="M-22 -80 Q-34 -60 -14 -40 Q6 -22 24 -34 L14 -52 L2 -48 Q-8 -52 -6 -62 L-2 -72 Z" fill="#fff" />
          <rect x={-70} y={40} width={140} height={40} rx={20} fill={COL.green} {...st} strokeWidth={5} />
          <rect x={-70} y={96} width={140} height={40} rx={20} fill={COL.red} {...st} strokeWidth={5} />
        </Phone>
      </g>
      <g transform={`translate(850 ${940 + Math.sin(t * 3) * 3}) scale(${pop(t, 0.35, 0.5)})`}>
        <rect x={-196} y={-62} width={392} height={124} rx={62} fill={COL.white} {...st} />
        <text y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill={OUT}>CLIENTE NUEVO</text>
        <text y={34} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={32} fill={COL.violetD}>fuga en la cocina</text>
      </g>
      <g transform={`translate(${850 + 20 * Math.sin(t * 5)} ${610 - 40 * ramp(t, CUE.coin + 0.5, CUE.coin + 2)}) scale(${pop(t, CUE.coin + 0.5, 0.4, 2)}) rotate(-6)`} opacity={1 - ramp(t, CUE.story + 0.6, CUE.story + 1.0)}>
        <rect x={-150} y={-52} width={300} height={104} rx={52} fill={COL.red} {...st} />
        <text y={26} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={70} fill="#fff">-350 €</text>
      </g>
      {/* the 350 coin: bobs, grows wings, flies away */}
      <g transform={`translate(${coinX} ${coinY}) rotate(${fly * 24})`} opacity={1 - ramp(t, CUE.coin + 1.25, CUE.coin + 1.5)}>
        <g transform={`scale(${wingP})`}><g transform="translate(-92 -10)"><Wing flip ang={-flap} /></g><g transform="translate(92 -10)"><Wing ang={-flap} /></g></g>
        <Coin r={118} label="350 €" size={62} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- scene B: customer -> next plumber
const Card: React.FC<{ y: number; h: number; fill: string; children: React.ReactNode; id: string }> = ({ y, h, fill, children, id }) => (
  <g>
    <clipPath id={id}><rect x={60} y={y} width={960} height={h} rx={70} /></clipPath>
    <rect x={60} y={y} width={960} height={h} rx={70} fill={fill} />
    <g clipPath={`url(#${id})`}>{children}</g>
    <rect x={60} y={y} width={960} height={h} rx={70} fill="none" {...st} />
  </g>
);

const SceneB: React.FC<{ t: number }> = ({ t }) => {
  const s = CUE.siguiente - 1.4; const u = t - s;
  const list = pop(u, 1.0, 0.4); const coin = ramp(u, 1.6, 2.3);
  const wMouth: Mouth = u < 1.0 ? "open" : "flat";
  const rMouth: Mouth = u > 1.7 ? "grin" : "flat";
  const cx = 530 + 20 * Math.sin(coin * Math.PI), cy = 520 + (1150 - 520) * eio(coin) - 160 * Math.sin(coin * Math.PI);
  return (
    <g>
      <rect width={1080} height={1920} fill={COL.lilac} />
      <Card id="cb1" y={280} h={600} fill="#F6E7FF">
        <rect y={700} width={1080} height={200} fill={COL.lilacD} />
        <g transform={`translate(330 ${590 + Math.sin(u * 4) * 3}) rotate(3)`}>
          <g transform="translate(0 150)"><Torso shirt={COL.pink} bib={null} /></g>
          <Head hairKind="bob" hair="#3b2a4f" mouth={wMouth} brow={u < 1 ? 8 : -2} angry={u < 1 ? 0 : 1} blink={blinkAt(u, 1)} lookX={u < 1.0 ? -6 : 6} lookY={u < 1 ? 0 : 6} />
          {u < 1.0 && (<g><Arm a={[-190, 230]} b={[-150, 20]} bend={[-300, 140]} sleeve={COL.pink} /><g transform="translate(-205 20) rotate(14)"><Phone w={96} h={168} screen={COL.green} /></g></g>)}
        </g>
        <g transform={`translate(720 470) scale(${pop(u, 0.15, 0.4) * (u < 0.95 ? 1 : 0.001)})`}>
          <Bubble w={400} h={130} tx={-190} ty={120}><text y={22} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} fill={OUT}>{u < 0.7 ? "¿Hola?" : "¿HOLA?!"}</text></Bubble>
        </g>
        {["Fontanero 24h", "Fontanero Express", "Fontaneros Ya"].map((n, i) => (
          <g key={n} transform={`translate(730 ${430 + i * 100}) scale(${pop(u, 1.0 + i * 0.12, 0.35)})`}>
            <rect x={-250} y={-40} width={500} height={80} rx={40} fill={COL.white} {...st} strokeWidth={6} />
            <text x={-218} y={12} fontFamily={FONT} fontWeight={600} fontSize={36} fill={OUT}>{n}</text>
            <text x={170} y={12} fontFamily={FONT} fontWeight={700} fontSize={30} fill={COL.orange}>★★★★★</text>
          </g>
        ))}
      </Card>
      <Card id="cb2" y={930} h={560} fill="#E4F4EC">
        <rect y={1360} width={1080} height={160} fill="#B6DDC9" />
        <g transform={`translate(380 ${1260 + Math.sin(u * 4 + 1) * 3})`}>
          <g transform="translate(0 150)"><Torso shirt="#2f8a63" bib={null} /></g>
          <Head hairKind="cap" hat={COL.green} stache mouth={rMouth} brow={u > 1.7 ? 6 : 0} blink={blinkAt(u, 0.4)} lookX={0} lookY={0} />
          <Arm a={[190, 240]} b={[170, 40]} bend={[290, 130]} sleeve="#2f8a63" />
          <g transform="translate(205 28) rotate(-16)"><Phone w={96} h={168} screen={COL.lilacL} /></g>
        </g>
        <g transform={`translate(740 1130) scale(${pop(u, 1.75, 0.35)})`}>
          <Bubble w={420} h={130} tx={-200} ty={120}><text y={22} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={66} fill={OUT}>¡DÍGAME!</text></Bubble>
        </g>
      </Card>
      {coin > 0 && coin < 1 && (<g transform={`translate(${cx} ${cy}) scale(${1 - 0.1 * coin})`}><Coin r={92} label="350 €" size={50} /></g>)}
      {coin >= 1 && (<g transform={`translate(560 ${1150 + Math.sin(u * 6) * 4})`}><Coin r={92} label="350 €" size={50} /></g>)}
    </g>
  );
};

// ---------------------------------------------------------------- scene C: the ledger
const ROWS = [
  { label: "LLAMADAS PERDIDAS / SEMANA", v: "6", at: CUE.ledger + 0.55 },
  { label: "1 DE CADA 3 ERA TRABAJO", v: "2", at: CUE.r2v },
  { label: "× 350 € POR TRABAJO", v: "700 €", at: CUE.r3 },
  { label: "× 4 SEMANAS", v: "MES", at: CUE.r4 },
];
const SceneC: React.FC<{ t: number }> = ({ t }) => {
  const u = t - CUE.ledger;
  const totalP = pop(t, CUE.total, 0.5, 1.5); const n = Math.round(2800 * eo(ramp(t, CUE.total + 0.1, CUE.total + 1.4)));
  const ns = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const face: Mouth = t < CUE.r2v ? "smile" : t < CUE.total ? "worry" : "shock";
  const sello = pop(t, CUE.ejemplo, 0.3, 2.2);
  const shake = t > CUE.total && t < CUE.total + 0.35 ? Math.sin(t * 90) * 7 : 0;
  return (
    <g transform={`translate(${shake} 0)`}>
      <rect width={1080} height={1920} fill={COL.lilac} />
      {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={(i * 197) % 1080} cy={(i * 331) % 1500 + 150} r={44 + (i % 3) * 20} fill={COL.lilacL} opacity={0.6} />)}
      <g transform={`translate(400 290) scale(${pop(u, 0, 0.45)})`}>
        <rect x={-330} y={-70} width={660} height={140} rx={70} fill={COL.white} {...st} />
        <text x={-300} y={20} fontFamily={FONT} fontWeight={700} fontSize={56} fill={OUT}>CUENTAS CLARAS</text>
        <circle cx={268} cy={0} r={44} fill={COL.violet} {...st} /><text x={268} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill="#fff">1</text>
      </g>
      <g transform={`translate(905 290) scale(${pop(u, 0.15, 0.4)})`}>
        <clipPath id="fc"><circle r={104} /></clipPath>
        <circle r={104} fill="#FFE9D6" /><g clipPath="url(#fc)"><g transform="translate(0 20) scale(0.62)"><g transform="translate(0 150)"><Torso /></g><Head mouth={face} brow={face === "shock" ? 16 : 0} blink={blinkAt(t)} sweat={face !== "smile"} /></g></g>
        <circle r={104} fill="none" {...st} />
      </g>
      {/* total: starburst + round badge */}
      <g transform={`translate(540 1185) scale(${totalP})`}>
        <g transform={`rotate(${t * 18})`}><Burst r={250} n={16} fill="#FFFFFF" /></g>
        <circle r={192} fill={COL.violet} {...st} strokeWidth={10} />
        <circle r={164} fill="none" stroke={COL.lilac} strokeWidth={8} strokeDasharray="4 22" strokeLinecap="round" />
        <text y={28} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={ns.length > 4 ? 92 : 108} fill="#fff" stroke={OUT} strokeWidth={0}>{ns} €</text>
        <text y={92} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={COL.lilac}>AL MES</text>
      </g>
      {ROWS.map((r, i) => {
        const y = 470 + i * 140; const appear = pop(u, 0.3 + i * 0.12, 0.4, 1.4); const filled = t >= r.at; const f = pop(t, r.at, 0.4, 2.2);
        return (
          <g key={i} transform={`translate(540 ${y}) scale(${appear})`}>
            <rect x={-465} y={-60} width={930} height={120} rx={60} fill={filled ? COL.white : "#F0E9FF"} {...st} />
            <text x={-420} y={14} fontFamily={FONT} fontWeight={600} fontSize={i === 0 ? 38 : 42} fill={filled ? OUT : "#8d7cc4"}>{r.label}</text>
            {!filled && <text x={410} y={22} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={70} fill="#b9a8ec">___</text>}
            {filled && <g transform={`translate(410 24) scale(${f})`}><text textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={r.v.length > 3 ? 64 : 84} fill={COL.violet} stroke={OUT} strokeWidth={0} >{r.v === "MES" ? "= MES" : r.v}</text></g>}
          </g>
        );
      })}
      {/* round EJEMPLO stamp */}
      <g transform={`translate(850 960) rotate(-14) scale(${sello * (1 + (1 - sello) * 0.6)})`} opacity={sello > 0 ? 1 : 0}>
        <circle r={96} fill={COL.red} {...st} /><circle r={78} fill="none" stroke="#fff" strokeWidth={5} />
        <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#fff">EJEMPLO</text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- scene D: verdict stamp -> auto reply saves the customer
const SceneD: React.FC<{ t: number }> = ({ t }) => {
  const u = t - CUE.verdict; const slam = u < 0 ? 0 : 1 + (1 - eo(ramp(u, 0, 0.22))) * 1.6; const shake = u > 0.2 && u < 0.5 ? Math.sin(u * 120) * 10 * (1 - ramp(u, 0.2, 0.5)) : 0;
  const shrink = eio(ramp(u, 2.2, 2.9)); const sc = slam * (1 - 0.58 * shrink);
  const auto = pop(t, CUE.auto, 0.45, 1.6); const heart = pop(t, CUE.auto + 1.0, 0.5, 2);
  return (
    <g transform={`translate(${shake} 0)`}>
      <rect width={1080} height={1920} fill={COL.violet} />
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M540 760 L${540 + Math.cos(i * 0.5236) * 1500} ${760 + Math.sin(i * 0.5236) * 1500}`} stroke={COL.violetD} strokeWidth={34} opacity={0.35} />)}
      {/* auto-reply phone */}
      <g transform={`translate(380 1050) scale(${auto})`}>
        <Phone w={420} h={760} screen={COL.lilacL}>
          <rect x={-170} y={-300} width={340} height={70} rx={35} fill={COL.white} {...st} strokeWidth={5} />
          <text y={-252} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={34} fill={OUT}>Llamada perdida</text>
          <g transform={`translate(0 ${-110 + (1 - auto) * 40})`}><Bubble w={340} h={210} tx={-90} ty={140} fill={COL.violet}>
            <text y={-36} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={34} fill="#fff">Estoy en una obra,</text>
            <text y={8} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={34} fill="#fff">te llamo en 10 min</text>
            <text y={56} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={COL.lilac}>respuesta automática</text></Bubble></g>
        </Phone>
      </g>
      {/* happy customer */}
      <g transform={`translate(830 1190) scale(${heart})`}>
        <clipPath id="cc"><circle r={150} /></clipPath>
        <circle r={150} fill="#F6E7FF" /><g clipPath="url(#cc)"><g transform="translate(0 30) scale(0.8)"><g transform="translate(0 150)"><Torso shirt={COL.pink} bib={null} /></g><Head hairKind="bob" hair="#3b2a4f" mouth="smile" blink={blinkAt(t, 1)} brow={-4} /></g></g>
        <circle r={150} fill="none" {...st} />
        <g transform={`translate(110 -140) scale(${1 + Math.sin(t * 8) * 0.06})`}><path d="M0 24 C-60 -20 -34 -62 0 -34 C34 -62 60 -20 0 24 Z" fill={COL.red} {...st} strokeWidth={6} /></g>
      </g>
      {/* the stamp */}
      <g transform={`translate(${540 + 190 * shrink} ${760 - 330 * shrink}) rotate(${-8 * (u < 0 ? 0 : 1)}) scale(${sc})`} opacity={u < 0 ? 0 : 1}>
        <circle r={380} fill={COL.white} {...st} strokeWidth={12} />
        <circle r={338} fill="none" stroke={COL.violet} strokeWidth={10} />
        <circle r={304} fill="none" stroke={COL.violet} strokeWidth={4} strokeDasharray="3 18" strokeLinecap="round" />
        <text y={-150} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={58} fill={COL.violetD} letterSpacing={6}>VEREDICTO</text>
        <text y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={96} fill={OUT}>NO NECESITA</text>
        <text y={150} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={190} fill={COL.violet}>IA</text>
        <g transform="translate(0 -230)"><Star r={34} fill={COL.violet} /></g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- scene E: CTA
const SceneE: React.FC<{ t: number }> = ({ t }) => {
  const u = t - CUE.cta; const bub = pop(u, 0.0, 0.5, 1.7); const dots = Math.floor(u * 4) % 3;
  const wave = Math.sin(u * 7) * 6;
  return (
    <g>
      <rect width={1080} height={1920} fill={COL.lilac} />
      {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={(i * 263) % 1080} cy={(i * 421) % 1700 + 100} r={18 + (i % 4) * 12} fill={COL.lilacL} opacity={0.7} />)}
      <g transform={`translate(540 535) scale(${bub}) rotate(${-4 + wave * 0.2})`}>
        <circle r={290} fill={COL.white} {...st} strokeWidth={12} />
        <path d="M-120 300 L-170 420 L-10 330 Z" fill={COL.white} {...st} strokeWidth={12} /><path d="M-130 296 L-10 326" stroke={COL.white} strokeWidth={16} />
        <text y={-110} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={92} fill={OUT}>COMENTA</text>
        <text y={60} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={174} fill={COL.violet}>CUENTA</text>
        <g transform="translate(0 190)">{[-70, 0, 70].map((x, i) => <circle key={i} cx={x} cy={0} r={22 + (dots === i ? 8 : 0)} fill={COL.violet} {...st} strokeWidth={5} />)}</g>
      </g>
      <g transform="translate(540 1075)">
        <clipPath id="pc"><circle r={230} /></clipPath>
        <circle r={230} fill="#FFE9D6" />
        <g clipPath="url(#pc)"><g transform="translate(0 90) scale(0.86)">
          <Torso shirt={COL.cream} bib={COL.blue} />
          <Arm a={[-200, 80]} b={[-250, -120 + wave]} bend={[-330, 20]} sleeve={COL.cream} />
          <g transform="translate(250 -140) rotate(-10)">
            <Arm a={[-30, 220]} b={[0, 0]} bend={[-50, 100]} sleeve={COL.cream} hand={34} />
            <path d="M-14 -14 L-14 -76 Q-14 -96 8 -96 Q30 -96 30 -76 L30 -20" fill={COL.skin} {...st} strokeWidth={7} />
          </g>
          <g transform="translate(0 -150)"><Head mouth="grin" brow={6} blink={blinkAt(t)} lookX={0} lookY={0} /></g>
        </g></g>
        <circle r={230} fill="none" {...st} strokeWidth={12} />
      </g>
      <g transform={`translate(540 1390) scale(${pop(u, 0.5, 0.4)})`}>
        <rect x={-330} y={-46} width={660} height={92} rx={46} fill={COL.violet} {...st} />
        <text y={20} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill="#fff">perezandquintano.es</text>
      </g>

    </g>
  );
};

const HonestTag: React.FC = () => (
  <g transform="translate(690 185)">
    <rect x={-310} y={-30} width={620} height={60} rx={30} fill="#FFFFFF" opacity={0.92} {...st} strokeWidth={5} />
    <text y={12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={COL.violetD}>RECREACIÓN · NÚMEROS DE EJEMPLO</text>
  </g>
);

// ---------------------------------------------------------------- captions (cartoon subtitles from the Whisper words)
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (!WORDS.length) return null;
  const groups: { w: string; t0: number; t1: number }[][] = []; let g: any[] = [];
  WORDS.forEach((w, i) => { g.push(w); const end = /[.!?¡¿,:]$/.test(w.w) && g.length >= 2; if (g.length >= 3 || end || i === WORDS.length - 1) { groups.push(g); g = []; } });
  const cur = groups.find((gr, i) => t >= gr[0].t0 - 0.05 && t < (groups[i + 1] ? groups[i + 1][0].t0 - 0.05 : gr[gr.length - 1].t1 + 0.4));
  if (!cur) return null;
  const s = pop(t, cur[0].t0 - 0.05, 0.25, 1.4);
  return (
    <div style={{ position: "absolute", left: 40, width: 1000, top: 1465, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 26px", transform: `scale(${0.85 + 0.15 * s})`, opacity: clamp(s * 2), fontFamily: FONT, fontWeight: 700, fontSize: 78, lineHeight: 1.1, textAlign: "center" }}>
      {cur.map((w, i) => { const on = t >= w.t0 && t < w.t1 + 0.05; return <span key={i} style={{ color: on ? "#FFE27A" : "#fff", WebkitTextStroke: "12px #2a1840", paintOrder: "stroke fill", transform: on ? "scale(1.1)" : "scale(1)", display: "inline-block" }}>{w.w.toUpperCase()}</span>; })}
    </div>
  );
};

// ---------------------------------------------------------------- iris transition (round, of course)
const Iris: React.FC<{ t: number; t0: number; cx?: number; cy?: number; children: React.ReactNode; id: string }> = ({ t, t0, cx = 540, cy = 960, children, id }) => {
  if (t < t0) return null;
  const r = eio(ramp(t, t0, t0 + 0.55)) * 2200;
  return (<g><clipPath id={id}><circle cx={cx} cy={cy} r={r} /></clipPath><g clipPath={`url(#${id})`}>{children}</g></g>);
};

const useFont = () => {
  const [h] = React.useState(() => delayRender("font"));
  React.useEffect(() => { const f = new FontFace("Fredoka", `url(${staticFile("fonts/fredoka.ttf")})`, { weight: "300 700" }); f.load().then(() => { (document as any).fonts.add(f); continueRender(h); }).catch(() => continueRender(h)); }, []);
};

export const Ep1: React.FC = () => {
  useFont();
  const t = useT();
  const sB = CUE.siguiente - 1.4;
  return (
    <AbsoluteFill style={{ backgroundColor: "#CDBBF7" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <SceneA t={t} />
        <Iris t={t} t0={sB} id="iB" cx={540} cy={960}><SceneB t={t} /></Iris>
        <Iris t={t} t0={CUE.ledger - 0.1} id="iC" cx={540} cy={900}><SceneC t={t} /></Iris>
        <Iris t={t} t0={CUE.verdict - 0.12} id="iD" cx={540} cy={760}><SceneD t={t} /></Iris>
        <Iris t={t} t0={CUE.cta - 0.1} id="iE" cx={540} cy={680}><SceneE t={t} /></Iris>
        <HonestTag />
      </svg>
      <Captions t={t} />
      <Audio src={staticFile("audio.wav")} />
    </AbsoluteFill>
  );
};
