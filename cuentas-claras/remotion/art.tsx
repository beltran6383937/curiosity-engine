// Hand-built flat cartoon kit (thick aubergine outline, flat fills, dot eyes) in the style of the reference Beltran sent.
import React from "react";

export const OUT = "#2a1840";
export const SW = 8;
export const st = { stroke: OUT, strokeWidth: SW, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
export const COL = {
  skin: "#F4B78F", skin2: "#EBA67C", hair: "#7B4426", violet: "#6A47E8", violetD: "#4B2FB8", lilac: "#CDBBF7", lilacL: "#E9E0FC", lilacD: "#B7A1F2",
  white: "#FFFFFF", cream: "#FFF6EA", silver: "#E5E9F2", silverD: "#A9B2C6", blue: "#5B7BE8", blueD: "#3F58C2", orange: "#F5964A", red: "#E8574B", green: "#38A874", goo: "#6E4A2E", pink: "#EF7A8A",
};
export const FONT = "'Fredoka', 'Manrope', system-ui, sans-serif";

export type Mouth = "smile" | "open" | "grin" | "tongue" | "worry" | "flat" | "shock";
export type FaceProps = { mouth?: Mouth; brow?: number; angry?: number; lookX?: number; lookY?: number; blink?: number; hairKind?: "quiff" | "bob" | "cap"; skin?: string; hair?: string; stache?: boolean; hat?: string; sweat?: boolean };

// head centred on (0,0): face ~250 wide, 280 tall
export const Head: React.FC<FaceProps> = ({ mouth = "smile", brow = 0, angry = 0, lookX = 0, lookY = 0, blink = 0, hairKind = "quiff", skin = COL.skin, hair = COL.hair, stache = false, hat = COL.green, sweat = false }) => {
  const eyeY = -8; const shock = mouth === "shock";
  return (
    <g>
      {hairKind === "bob" && <path d="M-150 20 C-175 -120 -90 -190 0 -190 C90 -190 175 -120 150 20 C150 120 135 150 110 160 L-110 160 C-135 150 -150 120 -150 20 Z" fill={hair} {...st} />}
      <circle cx={-128} cy={14} r={27} fill={skin} {...st} />
      <circle cx={128} cy={14} r={27} fill={skin} {...st} />
      <path d="M-122 -10 C-122 -112 -66 -148 0 -148 C66 -148 122 -112 122 -10 C122 94 70 146 0 146 C-70 146 -122 94 -122 -10 Z" fill={skin} {...st} />
      {hairKind === "quiff" && <path d="M-128 -22 C-146 -128 -62 -182 18 -164 C94 -196 160 -128 128 -34 C112 -92 62 -104 22 -88 C-30 -72 -92 -64 -128 -22 Z" fill={hair} {...st} />}
      {hairKind === "bob" && <path d="M-124 -20 C-120 -118 -50 -160 20 -158 C86 -156 126 -110 124 -20 C96 -70 34 -92 -10 -88 C-60 -84 -100 -58 -124 -20 Z" fill={hair} {...st} />}
      {hairKind === "cap" && (
        <g>
          <path d="M-134 -44 C-132 -150 -60 -176 0 -176 C60 -176 132 -150 134 -44 Z" fill={hat} {...st} />
          <path d="M-20 -48 C60 -66 150 -60 190 -30 C170 -14 90 -22 -20 -30 Z" fill={hat} {...st} />
        </g>
      )}
      {/* brows */}
      <path d={`M-72 ${-52 - brow - angry * -10} Q-46 ${-66 - brow} -20 ${-52 - brow + angry * 14}`} fill="none" {...st} />
      <path d={`M72 ${-52 - brow - angry * -10} Q46 ${-66 - brow} 20 ${-52 - brow + angry * 14}`} fill="none" {...st} />
      {/* eyes */}
      {shock ? (
        <g>
          <circle cx={-46} cy={eyeY} r={30} fill={COL.white} {...st} /><circle cx={46} cy={eyeY} r={30} fill={COL.white} {...st} />
          <circle cx={-46 + lookX} cy={eyeY + lookY} r={9} fill={OUT} /><circle cx={46 + lookX} cy={eyeY + lookY} r={9} fill={OUT} />
        </g>
      ) : (
        <g transform={`translate(${lookX},${lookY})`}>
          <ellipse cx={-46} cy={eyeY} rx={11} ry={Math.max(1.5, 14 * (1 - blink))} fill={OUT} />
          <ellipse cx={46} cy={eyeY} rx={11} ry={Math.max(1.5, 14 * (1 - blink))} fill={OUT} />
        </g>
      )}
      <path d="M2 14 Q18 30 2 44" fill="none" {...st} strokeWidth={6} />
      {stache && <path d="M-62 56 C-40 34 -10 44 0 58 C10 44 40 34 62 56 C40 74 10 66 0 62 C-10 66 -40 74 -62 56 Z" fill="#4a2a1a" {...st} />}
      {/* mouth */}
      {mouth === "smile" && <path d="M-42 64 Q0 102 42 64" fill="none" {...st} />}
      {mouth === "grin" && (<g><path d="M-54 56 Q0 134 54 56 Z" fill="#5a1d2e" {...st} /><ellipse cx={0} cy={96} rx={24} ry={12} fill={COL.pink} /></g>)}
      {mouth === "open" && <ellipse cx={0} cy={80} rx={24} ry={32} fill="#5a1d2e" {...st} />}
      {mouth === "shock" && <ellipse cx={0} cy={86} rx={32} ry={44} fill="#5a1d2e" {...st} />}
      {mouth === "tongue" && (<g><path d="M-30 74 L30 74" fill="none" {...st} /><ellipse cx={20} cy={86} rx={15} ry={12} fill={COL.pink} {...st} strokeWidth={5} /></g>)}
      {mouth === "worry" && <path d="M-42 84 Q-21 64 0 84 T42 84" fill="none" {...st} />}
      {mouth === "flat" && <path d="M-34 78 L34 78" fill="none" {...st} />}
      {sweat && <path d="M118 -90 C100 -62 100 -40 118 -40 C136 -40 136 -62 118 -90 Z" fill="#9FD3F5" {...st} strokeWidth={5} />}
    </g>
  );
};

// torso centred so the neck is at (0,0); width ~520; drawn down to y=520 (cropped by the scene)
export const Torso: React.FC<{ shirt?: string; bib?: string | null; collar?: string }> = ({ shirt = COL.cream, bib = COL.blue, collar = COL.cream }) => (
  <g>
    <rect x={-46} y={-30} width={92} height={86} rx={20} fill={COL.skin2} {...st} />
    <path d="M-250 560 L-250 90 Q-250 20 -150 10 L-46 0 Q0 40 46 0 L150 10 Q250 20 250 90 L250 560 Z" fill={shirt} {...st} />
    {bib && (<g>
      <path d="M-150 560 L-150 190 L150 190 L150 560 Z" fill={bib} {...st} />
      <path d="M-150 190 L-120 20 L-82 20 L-96 190 Z M150 190 L120 20 L82 20 L96 190 Z" fill={bib} {...st} />
      <rect x={-84} y={250} width={168} height={110} rx={26} fill={COL.blueD} {...st} />
      <circle cx={-110} cy={200} r={11} fill={COL.orange} {...st} strokeWidth={5} /><circle cx={110} cy={200} r={11} fill={COL.orange} {...st} strokeWidth={5} />
    </g>)}
  </g>
);

export const Arm: React.FC<{ a: [number, number]; b: [number, number]; bend?: [number, number]; sleeve?: string; goo?: boolean; hand?: number }> = ({ a, b, bend, sleeve = COL.cream, goo = false, hand = 30 }) => {
  const c = bend ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const d = `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={OUT} strokeWidth={62} strokeLinecap="round" />
      <path d={d} fill="none" stroke={sleeve} strokeWidth={46} strokeLinecap="round" />
      <circle cx={b[0]} cy={b[1]} r={hand} fill={goo ? COL.goo : COL.skin} {...st} />
      {goo && (<g><circle cx={b[0] - 14} cy={b[1] + hand + 8} r={9} fill={COL.goo} /><circle cx={b[0] + 12} cy={b[1] + hand + 20} r={7} fill={COL.goo} /></g>)}
    </g>
  );
};

export const Wrench: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-17} y={-10} width={34} height={190} rx={17} fill={COL.orange} {...st} />
    <path d="M-44 -10 L-44 -64 Q-44 -92 -20 -94 L-20 -58 L20 -58 L20 -94 Q44 -92 44 -64 L44 -10 Z" fill={COL.silver} {...st} />
  </g>
);

export const Phone: React.FC<{ w?: number; h?: number; screen?: string; children?: React.ReactNode }> = ({ w = 200, h = 350, screen = COL.lilacL, children }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={42} fill="#352352" {...st} />
    <rect x={-w / 2 + 14} y={-h / 2 + 26} width={w - 28} height={h - 52} rx={26} fill={screen} />
    <rect x={-26} y={-h / 2 + 10} width={52} height={9} rx={5} fill="#0e0817" />
    {children}
  </g>
);

export const Coin: React.FC<{ r?: number; label?: string; size?: number }> = ({ r = 100, label = "€", size }) => (
  <g>
    <circle r={r} fill={COL.silver} {...st} />
    <circle r={r * 0.78} fill="none" stroke={COL.silverD} strokeWidth={6} />
    <path d={`M${-r * 0.55} ${-r * 0.5} A${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.1} ${-r * 0.78}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
    <text y={r * 0.2} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size ?? r * 0.62} fill={COL.violetD}>{label}</text>
  </g>
);

export const Wing: React.FC<{ flip?: boolean; ang: number }> = ({ flip, ang }) => (
  <g transform={`scale(${flip ? -1 : 1},1) rotate(${ang})`}>
    <path d="M0 0 C40 -70 120 -90 170 -50 C140 -50 130 -34 138 -22 C112 -30 96 -14 104 6 C78 -4 54 8 0 0 Z" fill={COL.white} {...st} strokeWidth={6} />
  </g>
);

export const Drop: React.FC<{ r?: number }> = ({ r = 18 }) => (<path d={`M0 ${-r * 2} C${-r * 1.2} ${-r * 0.4} ${-r} ${r} 0 ${r} C${r} ${r} ${r * 1.2} ${-r * 0.4} 0 ${-r * 2} Z`} fill="#9FD3F5" {...st} strokeWidth={5} />);

export const Star: React.FC<{ r?: number; fill?: string }> = ({ r = 40, fill = "#fff" }) => {
  const p = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(" ");
  return <polygon points={p} fill={fill} {...st} strokeWidth={5} />;
};

export const Burst: React.FC<{ r: number; n?: number; fill?: string }> = ({ r, n = 14, fill = "#fff" }) => {
  const p = Array.from({ length: n * 2 }, (_, i) => { const a = (Math.PI / n) * i; const rr = i % 2 ? r * 0.78 : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr}`; }).join(" ");
  return <polygon points={p} fill={fill} {...st} />;
};

// speech bubble (round) with a tail pointing to (tx,ty) relative to its centre
export const Bubble: React.FC<{ w: number; h: number; tx: number; ty: number; fill?: string; children?: React.ReactNode }> = ({ w, h, tx, ty, fill = COL.white, children }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(h / 2, 70)} fill={fill} {...st} />
    <path d={`M${-24 + Math.sign(tx) * 0} ${h / 2 - 4} L${tx} ${ty} L${30} ${h / 2 - 4} Z`} fill={fill} {...st} strokeWidth={SW} />
    <path d={`M${-18} ${h / 2 - 4} L${28} ${h / 2 - 4}`} stroke={fill} strokeWidth={SW + 3} />
    {children}
  </g>
);
