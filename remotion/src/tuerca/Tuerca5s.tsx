// Tuerca · prueba de 5 s. Personaje 100 % por código (una tuerca hexagonal con tripa, gorra y brazos de goma) sobre
// una foto real. Gag: lunes, la tuerca cansada mete tripa para parecer en forma… no aguanta, la tripa sale, la hebilla
// del cinturón sale disparada contra la cámara. Mirada a cámara. 12 dibujos/s sobre 24 fps (D = floor(frame/2)).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { track, wave, noise } from "../ratopin/anim";
import { Boil } from "../ratopin/rig";

const INK = "#161616", STEEL = "#9ea7ae", STEEL_HI = "#c9d0d5", STEEL_LO = "#7a838a", CAP = "#e8742a", BELT = "#6b4423";
const f = (n: number) => n.toFixed(1);
type P = [number, number];

// brazo/pierna de goma: curva con contorno (trazo negro ancho + relleno encima), sin codos ni juntas
const Hose: React.FC<{ a: P; c: P; b: P; w: number; color: string }> = ({ a, c, b, w, color }) => {
  const d = `M ${f(a[0])} ${f(a[1])} Q ${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
  return (<><path d={d} stroke={INK} strokeWidth={w + 16} fill="none" strokeLinecap="round" />
    <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" /></>);
};

const hex = (r: number, sx = 1, sy = 1) =>
  Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 3 * i; return `${f(Math.cos(a) * r * sx)},${f(Math.sin(a) * r * sy)}`; }).join(" ");

export const Tuerca5s: React.FC<{ camera?: boolean; boil?: boolean }> = ({ camera = true, boil = true }) => {
  const frame = useCurrentFrame(), D = Math.floor(frame / 2);
  // ── poses (D 0‥59) ──
  // 0‥17 respira cansado · 18‥26 mete tripa (se estira) · 27‥29 aguanta temblando · 30 ¡POP! · 31‥40 tripa rebota · 41‥59 mira a cámara
  const breathe = D < 18 ? wave(D, 14, 1) : 0;
  const belly = track([[0, 1], [18, 1], [26, 0.55, "inOut"], [29, 0.5], [30, 1.32, "linear"], [32, 0.9, "out"], [34, 1.14, "inOut"], [36, 0.97, "inOut"], [39, 1.04, "inOut"], [42, 1]], D)
    + breathe * 0.03;
  const sy = track([[0, 1], [18, 1], [26, 1.09, "inOut"], [29, 1.1], [30, 0.86, "linear"], [32, 1.04, "out"], [34, 0.98, "inOut"], [37, 1]], D) + breathe * 0.012;
  const sx = 2 - sy;
  const shake = D >= 27 && D < 30 ? Math.sin(frame * 2.7) * 3 : 0;
  const lid = track([[0, 0.55], [9, 0.55], [10, 1, "linear"], [11, 0.55, "linear"], [18, 0.55], [24, 0.15, "inOut"], [29, 0.1], [30, 0, "linear"], [33, 0], [38, 0.6, "inOut"],
    [50, 0.62], [51, 1, "linear"], [53, 1], [54, 0.65, "linear"]], D);           // 0 abierto · 1 cerrado
  const brow = track([[0, 0], [18, 0], [24, -10, "inOut"], [29, -14], [30, -34, "linear"], [33, -30], [38, 6, "inOut"]], D); // + = cae (cansado)
  const pupil = track([[0, 0], [16, 0], [18, -10, "inOut"], [30, -10], [31, 0, "linear"], [40, 0], [42, 0]], D);            // mira a un lado al meter tripa
  const mouthO = track([[0, 0], [24, 0], [26, 0.25, "inOut"], [29, 0.3], [30, 1, "linear"], [33, 0.8], [37, 0, "inOut"]], D);
  const cheeks = D >= 24 && D < 30 ? 1 : 0;                                       // aguanta el aire: mofletes
  // hebilla: sale en D30 hacia la cámara (crece) y se va por arriba
  const bk = D >= 30 ? Math.min(1, (D - 30) / 7) : 0;
  const crack = D >= 37 && D < 41;                                                // golpe contra la lente
  const sweat = D >= 41 ? Math.min(1, (D - 41) / 14) : 0;

  // ── geometría (px del lienzo; origen = pies) ──
  const X = 540, FEET = 1640, R = 175;                                            // radio del hexágono
  const H = R * Math.sqrt(3) / 2;                                                 // medio alto
  const cy = FEET - 210 - H * sy;                                                 // centro del cuerpo
  const bellyY = cy + H * 0.95 * sy, brx = 150 * belly, bry = 92 * (0.75 + 0.25 * belly);
  const legTop: [P, P] = [[X - 70, cy + H * sy - 10], [X + 70, cy + H * sy - 10]];
  const sh: [P, P] = [[X - R * sx * 0.92, cy + 20], [X + R * sx * 0.92, cy + 20]];
  const tuck = D >= 18 && D < 30 ? 1 : 0;                                         // manos a las caderas mientras aguanta
  const handL: P = tuck ? [X - 210, cy + 120 + shake] : [X - 250 - breathe * 4, cy + 230];
  const handR: P = tuck ? [X + 210, cy + 120 - shake] : D >= 41 ? [X + 175, cy - 40] : [X + 250 + breathe * 4, cy + 230]; // al final se rasca la gorra
  const cam = camera ? { x: noise(frame * 0.05, 1) * 6 + (crack ? Math.sin(frame * 3) * 10 : 0), y: noise(frame * 0.05, 7) * 6 } : { x: 0, y: 0 };

  return (
    <AbsoluteFill style={{ background: "#222", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(1.04)` }}>
        <Img src={staticFile("tuerca/fondo-cocina.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <Boil d={D} scale={boil ? 2.5 : 0}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {/* sombra de contacto */}
            <ellipse cx={X} cy={FEET + 18} rx={230 * sx} ry={34} fill="#000" opacity={0.32} />
            {/* piernas + botas */}
            {legTop.map((t, i) => { const s = i ? 1 : -1, foot: P = [X + s * 95, FEET - 10];
              return <g key={i}><Hose a={t} c={[t[0] + s * 30, (t[1] + foot[1]) / 2]} b={foot} w={34} color={STEEL_LO} />
                <path d={`M ${f(foot[0] - 48 * (s < 0 ? 1.4 : 0.6))} ${FEET + 10} Q ${f(foot[0])} ${FEET - 60} ${f(foot[0] + 48 * (s > 0 ? 1.4 : 0.6))} ${FEET + 10} Z`}
                  fill="#3b3b3b" stroke={INK} strokeWidth={9} strokeLinejoin="round" /></g>; })}
            {/* brazos */}
            <Hose a={sh[0]} c={[sh[0][0] - 60, (sh[0][1] + handL[1]) / 2 + 40]} b={handL} w={30} color={STEEL_LO} />
            <Hose a={sh[1]} c={[sh[1][0] + 60, D >= 41 ? sh[1][1] - 40 : (sh[1][1] + handR[1]) / 2 + 40]} b={handR} w={30} color={STEEL_LO} />
            {/* cuerpo: tuerca hexagonal con bisel */}
            <g transform={`translate(${f(X + shake)} ${f(cy)})`}>
              <polygon points={hex(R, sx, sy)} fill={STEEL} stroke={INK} strokeWidth={11} strokeLinejoin="round" />
              <polygon points={hex(R * 0.8, sx, sy)} fill={STEEL_HI} opacity={0.55} />
              <path d={`M ${f(-R * 0.5 * sx)} ${f(-H * sy + 14)} L ${f(-R * 0.85 * sx)} ${f(-14 * sy)}`} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
              {/* gorra */}
              <path d={`M ${f(-112 * sx)} ${f(-H * sy + 8)} Q 0 ${f(-H * sy - 120)} ${f(112 * sx)} ${f(-H * sy + 8)} Z`} fill={CAP} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
              <path d={`M ${f(70 * sx)} ${f(-H * sy + 4)} Q ${f(170 * sx)} ${f(-H * sy - 8)} ${f(200 * sx)} ${f(-H * sy + 20)} L ${f(60 * sx)} ${f(-H * sy + 16)} Z`} fill={CAP} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
              {/* gota de sudor al final */}
              {sweat > 0 && <path transform={`translate(${f(-150 * sx)} ${f(-H * sy + 50 + sweat * 70)})`} d="M 0 -26 Q 16 0 0 12 Q -16 0 0 -26 Z" fill="#bfe3ff" stroke={INK} strokeWidth={5} />}
              {/* ojos: grandes, con párpado caído y ojeras */}
              {[-1, 1].map((s) => { const ex = s * 62 * sx, ey = -H * sy * 0.42;
                return <g key={s}>
                  <path d={`M ${f(ex - 38)} ${f(ey + 44)} Q ${f(ex)} ${f(ey + 66)} ${f(ex + 38)} ${f(ey + 44)}`} stroke="#5d646a" strokeWidth={6} fill="none" strokeLinecap="round" />
                  <ellipse cx={ex} cy={ey} rx={40} ry={44} fill="#fff" stroke={INK} strokeWidth={8} />
                  <circle cx={ex + pupil + s * 4} cy={ey + 10 * (1 - lid) + 4} r={13} fill={INK} />
                  <clipPath id={`eye${s}`}><ellipse cx={ex} cy={ey} rx={40} ry={44} /></clipPath>
                  <rect clipPath={`url(#eye${s})`} x={ex - 45} y={ey - 50} width={90} height={8 + 92 * lid} fill={STEEL} />
                  <line x1={ex - 40} x2={ex + 40} y1={ey - 44 + 92 * lid} y2={ey - 44 + 92 * lid} stroke={INK} strokeWidth={8} strokeLinecap="round" />
                  <path d={`M ${f(ex - 36)} ${f(ey - 58 + brow * (s < 0 ? 0.6 : 1))} L ${f(ex + 36)} ${f(ey - 58 + brow * (s < 0 ? 1 : 0.6))}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
                </g>; })}
              {/* bigote de obrero + boca */}
              <ellipse cx={0} cy={f(22 + mouthO * 10)} rx={f(16 + mouthO * 22)} ry={f(4 + mouthO * 28)} fill="#3a1d1d" stroke={INK} strokeWidth={7} />
              <path d={`M -78 ${f(-H * sy * 0.02)} Q -40 -26 0 ${f(-H * sy * 0.02 - 6)} Q 40 -26 78 ${f(-H * sy * 0.02)} Q 40 22 0 6 Q -40 22 -78 ${f(-H * sy * 0.02)} Z`}
                fill="#4a3a2e" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
              {cheeks > 0 && [-1, 1].map((s) => <circle key={s} cx={s * 115 * sx} cy={20} r={30} fill="#e9a3a3" opacity={0.65} />)}
            </g>
            {/* tripa: sale por delante del hexágono, con el agujero de la tuerca de ombligo */}
            <g transform={`translate(${f(X + shake)} ${f(bellyY)})`}>
              <ellipse cx={0} cy={0} rx={brx} ry={bry} fill={STEEL} stroke={INK} strokeWidth={11} />
              <ellipse cx={-brx * 0.35} cy={-bry * 0.4} rx={brx * 0.35} ry={bry * 0.18} fill="#fff" opacity={0.35} />
              <circle cx={0} cy={-bry * 0.05} r={22 * (0.7 + 0.3 * belly)} fill="#2a2d30" stroke={INK} strokeWidth={6} />
              <path d={`M -16 ${f(-bry * 0.05 - 6)} L 16 ${f(-bry * 0.05 - 2)} M -16 ${f(-bry * 0.05 + 4)} L 16 ${f(-bry * 0.05 + 8)}`} stroke="#6b7177" strokeWidth={3} />
              {/* cinturón de herramientas bajo la tripa */}
              <path d={`M ${f(-brx * 0.98)} ${f(bry * 0.48)} Q 0 ${f(bry * 1.08)} ${f(brx * 0.98)} ${f(bry * 0.48)}`} stroke={INK} strokeWidth={42} fill="none" />
              <path d={`M ${f(-brx * 0.98)} ${f(bry * 0.48)} Q 0 ${f(bry * 1.08)} ${f(brx * 0.98)} ${f(bry * 0.48)}`} stroke={BELT} strokeWidth={28} fill="none" />
              <rect x={f(brx * 0.55)} y={f(bry * 0.55)} width={34} height={62} rx={6} fill="#c9a24a" stroke={INK} strokeWidth={6} transform={`rotate(-20 ${f(brx * 0.6)} ${f(bry * 0.6)})`} />
              {bk === 0 && <rect x={-30} y={f(bry * 0.6)} width={60} height={44} rx={8} fill="#d9b44a" stroke={INK} strokeWidth={7} />}
            </g>
            {/* manos: guantes */}
            {[handL, handR].map((h, i) => <circle key={i} cx={h[0]} cy={h[1]} r={36} fill="#f2efe6" stroke={INK} strokeWidth={9} />)}
            {/* líneas de "POP" */}
            {D >= 30 && D < 34 && [0, 1, 2, 3, 4, 5].map((i) => { const a = -Math.PI / 2 + (i - 2.5) * 0.45, r0 = brx + 30, r1 = brx + 70 + (D - 30) * 12;
              return <line key={i} x1={X + Math.cos(a) * r0 * 1.1} y1={bellyY + 40 + Math.sin(a) * -r0 * -1} x2={X + Math.cos(a) * r1 * 1.1} y2={bellyY + 40 + Math.sin(a) * -r1 * -1}
                stroke={INK} strokeWidth={9} strokeLinecap="round" />; })}
          </svg>
        </Boil>
      </AbsoluteFill>
      {/* hebilla volando hacia la cámara (fuera de la cámara movida: va «hacia» el espectador) */}
      {bk > 0 && !crack && D < 41 && (() => { const s = 1 + bk * bk * 7, x = 540 + bk * 60, y = bellyY + 80 - bk * 700;
        return <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(bk * 540)}) scale(${f(s)})`}>
            <rect x={-30} y={-22} width={60} height={44} rx={8} fill="#d9b44a" stroke={INK} strokeWidth={7 / Math.sqrt(s)} />
            <rect x={-14} y={-10} width={28} height={20} rx={4} fill="none" stroke={INK} strokeWidth={5 / Math.sqrt(s)} />
          </g></svg>; })()}
      {/* cristal roto: la hebilla da en la lente */}
      {D >= 37 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * Math.PI / 4 + 0.3, l = 260 + (i % 3) * 120;
              return <path key={i} d={`M 640 520 L ${f(640 + Math.cos(a) * l * 0.5 + 20)} ${f(520 + Math.sin(a) * l * 0.5)} L ${f(640 + Math.cos(a) * l)} ${f(520 + Math.sin(a) * l)}`} />; })}
            <circle cx={640} cy={520} r={40} /><circle cx={640} cy={520} r={110} strokeDasharray="40 30" />
          </g>
        </svg>
      )}
      {/* texto meme arriba */}
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Hanken Grotesk, Arial Black, sans-serif", fontWeight: 900,
        fontSize: 84, color: "#fff", WebkitTextStroke: "4px #111", paintOrder: "stroke", lineHeight: 1.05, whiteSpace: "pre-line" }}>
        {D < 30 ? "Lunes, 7:58.\nModo «en forma»" : "Lunes, 7:59."}
      </div>
    </AbsoluteFill>
  );
};
