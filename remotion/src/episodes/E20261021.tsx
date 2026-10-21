// Episodio 2026-10-21 · Wombat: un intestino que fabrica heces casi cúbicas. Guion y claims: episodes/2026-10-21/episode.json.
// Cifras en pantalla: solo 2021, 17 %, ×2 (grosor) y ×4 (rigidez), con proporciones calculadas en código.
// Frases 9-13: modelo matemático (MINT), nunca imagen real ni grabación del interior de un wombat.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { RoundedBox } from "@react-three/drei";
import { Reel, Stage, Clay, Floor, Tag, Stat, Source, k, mix, inOut, useSpring, SANS, type CurioProps, type SceneProps, type SceneDef } from "../kit";

type V3 = [number, number, number];
const OCHRE = "#e3a96b", WALL = "#c98478", STIFF = "#ff9a5c", MINT = "#7fe0c4", ROSE = "#ff7a6b", RIM = "#6fb8ff", INK = "#dfe6ff";
const FUR = "#8a6242", POO = "#5b3e2a", WALL_LIGHT = "#e8a99c";
const BG = { top: "#07050a", mid: "#1a1210", glow: "#3a2618" };
// Reparto de sectores de la pared: ilustrativo (no es un dato del estudio). Desfasado 11° para no sugerir
// en qué posición caen las esquinas respecto a las zonas rígidas (los claims no lo precisan).
const SECT = 8;
const OFF = (11 * Math.PI) / 180;

// ---------- utilidades ----------
// Superelipse |x|^n + |y|^n = R^n: n = 2 es un círculo; n = 4, un cuadrado de esquinas redondeadas (nunca vivas).
const superPts = (R: number, n: number, N = 96): [number, number][] =>
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return [R * Math.sign(c) * Math.abs(c) ** (2 / n), R * Math.sign(s) * Math.abs(s) ** (2 / n)];
  });
const superPath = (cx: number, cy: number, R: number, n: number) => "M " + superPts(R, n).map(([x, y]) => `${(cx + x).toFixed(1)} ${(cy + y).toFixed(1)}`).join(" L ") + " Z";
// Radio de la superelipse cuya esquina toca el círculo de radio Rc (así círculo y cuadrado redondeado caben en el mismo hueco)
const inscribed = (Rc: number, n: number) => Rc / 2 ** (0.5 - 1 / n);
// Sector de anillo (SVG, y hacia abajo)
const sector = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const P = (r: number, a: number) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${P(r1, a0)} A ${r1} ${r1} 0 ${lg} 1 ${P(r1, a1)} L ${P(r0, a1)} A ${r0} ${r0} 0 ${lg} 0 ${P(r0, a0)} Z`;
};

// Silueta esquemática del wombat (corte) y recorrido plegado del intestino: diagrama, no anatomía real.
const BODY = "M 120 980 C 110 900 160 820 240 800 L 250 740 L 300 790 C 380 760 470 720 600 720 C 800 720 930 800 940 950 C 950 1080 880 1170 760 1180 L 740 1230 L 680 1230 L 680 1185 L 400 1185 L 400 1230 L 340 1230 L 330 1170 C 250 1140 190 1080 160 1040 C 140 1020 120 1000 120 980 Z";
const GUT = "M 400 860 C 520 840 700 840 820 870 C 880 890 880 950 820 960 C 700 980 520 940 440 970 C 380 995 390 1050 460 1050 C 580 1050 720 1020 820 1050 C 870 1070 870 1110 840 1120";

// Caja de alambre: 12 aristas como tubos finos
const WireBox: React.FC<{ s: number; r: number; c: string; o: number; position?: V3; rotation?: V3 }> = ({ s, r, c, o, position, rotation }) => {
  if (o <= 0) return null;
  const h = s / 2;
  const edges: { p: V3; rot: V3 }[] = [];
  for (const a of [-h, h]) for (const b of [-h, h]) {
    edges.push({ p: [0, a, b], rot: [0, 0, Math.PI / 2] });
    edges.push({ p: [a, 0, b], rot: [0, 0, 0] });
    edges.push({ p: [a, b, 0], rot: [Math.PI / 2, 0, 0] });
  }
  return (
    <group position={position} rotation={rotation}>
      {edges.map((e, i) => (
        <mesh key={i} position={e.p} rotation={e.rot}>
          <cylinderGeometry args={[r, r, s + r * 2, 6]} />
          <meshBasicMaterial color={c} transparent opacity={o} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

// Wombat de arcilla: cápsula achatada, cabeza ancha, hocico, orejas cónicas y patas cortas. La cabeza mira a -x.
const Wombat: React.FC<{ position?: V3; rotation?: V3; s?: number; c?: string }> = ({ position, rotation, s = 1, c = FUR }) => (
  <group position={position} rotation={rotation} scale={s}>
    <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.88, 1, 1.08]} castShadow><capsuleGeometry args={[0.45, 0.9, 8, 24]} /><Clay c={c} r={0.6} /></mesh>
    <mesh position={[-0.85, 0.62, 0]} scale={[1.05, 0.9, 1.1]} castShadow><sphereGeometry args={[0.36, 32, 32]} /><Clay c={c} r={0.6} /></mesh>
    <mesh position={[-1.13, 0.54, 0]} scale={[0.8, 0.7, 1.1]} castShadow><sphereGeometry args={[0.17, 24, 24]} /><Clay c="#6e4c34" r={0.6} /></mesh>
    <mesh position={[-1.25, 0.6, 0]}><sphereGeometry args={[0.065, 16, 16]} /><Clay c="#22150e" r={0.3} /></mesh>
    {[-1, 1].map((sd) => (
      <React.Fragment key={sd}>
        <mesh position={[-0.78, 0.97, sd * 0.19]} rotation={[sd * -0.25, 0, 0.25]} castShadow><coneGeometry args={[0.09, 0.2, 16]} /><Clay c={c} r={0.6} /></mesh>
        <mesh position={[-1.14, 0.72, sd * 0.2]}><sphereGeometry args={[0.035, 12, 12]} /><Clay c="#0d0806" r={0.2} /></mesh>
      </React.Fragment>
    ))}
    {[[-0.45, -0.28], [-0.45, 0.28], [0.45, -0.28], [0.45, 0.28]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.17, z]} castShadow><capsuleGeometry args={[0.11, 0.12, 6, 12]} /><Clay c="#6e4c34" r={0.6} /></mesh>
    ))}
  </group>
);

// Malla de simulación del anillo (SVG, centrada en 0,0): nodos interior/exterior por columna, sectores rígidos más gruesos.
const RingMesh: React.FC<{ Ri: number; thin: number; thick: number; cR: number; cT: number; n: number; Rc: number; o?: number }> = ({ Ri, thin, thick, cR, cT, n, Rc, o = 1 }) => {
  const COLS = SECT * 4;
  const cols = Array.from({ length: COLS }, (_, j) => {
    const a = OFF + (j / COLS) * Math.PI * 2;
    const s = Math.floor(j / 4);
    const wg = j % 4 === 0 ? 0.5 : s % 2 === 0 ? 1 : 0; // 1 = rígida, 0 = fina, 0,5 = frontera
    const ri = Ri - mix(cT, cR, wg);
    return { a, ri, ro: ri + mix(thin, thick, wg) };
  });
  const P = (r: number, a: number) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  const ring = (key: "ri" | "ro") => "M " + cols.map((c) => P(c[key], c.a)).join(" L ") + " Z";
  const sectors = Array.from({ length: SECT }, (_, s) => {
    const cs = [0, 1, 2, 3, 4].map((m) => cols[(s * 4 + m) % COLS]);
    return { rigid: s % 2 === 0, d: "M " + cs.map((c) => P(c.ro, c.a)).join(" L ") + " L " + [...cs].reverse().map((c) => P(c.ri, c.a)).join(" L ") + " Z" };
  });
  return (
    <g opacity={o}>
      {sectors.map((s, i) => <path key={i} d={s.d} fill={MINT} fillOpacity={s.rigid ? 0.26 : 0.06} />)}
      <path d={ring("ri")} fill="none" stroke={MINT} strokeWidth={2.5} strokeOpacity={0.75} />
      <path d={ring("ro")} fill="none" stroke={MINT} strokeWidth={2.5} strokeOpacity={0.75} />
      {cols.map((c, j) => (
        <line key={`l${j}`} x1={Math.cos(c.a) * c.ri} y1={Math.sin(c.a) * c.ri} x2={Math.cos(c.a) * c.ro} y2={Math.sin(c.a) * c.ro} stroke={MINT} strokeWidth={2} strokeOpacity={0.55} />
      ))}
      {cols.map((c, j) => (
        <g key={`n${j}`}>
          <circle cx={Math.cos(c.a) * c.ri} cy={Math.sin(c.a) * c.ri} r={4.5} fill={MINT} />
          <circle cx={Math.cos(c.a) * c.ro} cy={Math.sin(c.a) * c.ro} r={4.5} fill={MINT} />
        </g>
      ))}
      <path d={superPath(0, 0, inscribed(Rc, n), n)} fill={OCHRE} fillOpacity={0.92} />
    </g>
  );
};

// ---------- escenas ----------
const POOS: { p: V3; r: V3; s: V3 }[] = [
  { p: [1.0, 0.18, 0.95], r: [0, 0.35, 0], s: [0.38, 0.36, 0.37] },
  { p: [1.42, 0.17, 0.72], r: [0, -0.25, 0.03], s: [0.36, 0.34, 0.39] },
  { p: [1.18, 0.53, 0.82], r: [0.06, 0.6, -0.08], s: [0.35, 0.35, 0.36] },
];

// 0-1 · Gancho: wombat de arcilla y heces casi cúbicas; contorno de cubo ideal (MINT) y molde tachado.
const Hook: React.FC<SceneProps> = ({ t, w, len }) => {
  const cub = w(0, /cúbicas/) - 0.1, mol = w(1, /molde/) - 0.15;
  const p = k(t, 0, len, inOut);
  const cam: V3 = [mix(1.6, 0.6, p), mix(1.1, 0.9, p), mix(9, 7.8, p)];
  const ideal = k(t, cub, 0.35) * (1 - k(t, cub + 1.3, 0.6));
  const mold = k(t, mol, 0.5) * (1 - k(t, len - 0.7, 0.6));
  const cross = k(t, mol + 0.35, 0.45);
  return (
    <AbsoluteFill>
      <Stage cam={cam} look={[0.25, 0.45, 0.3]} sun={[-5, 8, 5]} rim={RIM} amb={0.3}>
        <group scale={0.8}>
          <Floor o={0.35} />
          <Wombat position={[-0.45, 0, 0]} rotation={[0, 0.5, 0]} />
          {POOS.map((q, i) => (
            <RoundedBox key={i} args={q.s} radius={0.11} smoothness={5} position={q.p} rotation={q.r} castShadow receiveShadow>
              <Clay c={POO} r={0.55} />
            </RoundedBox>
          ))}
          <WireBox s={0.42} r={0.008} c={MINT} o={ideal} position={POOS[0].p} rotation={POOS[0].r} />
          {mold > 0 && (
            <group position={[-1.1, 1.75, 0.4]} rotation={[0.25, 0.5, 0]}>
              <WireBox s={0.8} r={0.012} c="#ffffff" o={0.4 * mold} />
              {cross > 0 && [1, -1].map((sd) => (
                <mesh key={sd} position={[0, 0, 0.45]} rotation={[0, 0, (sd * Math.PI) / 4]}>
                  <boxGeometry args={[0.05, 1.3 * cross, 0.05]} />
                  <meshBasicMaterial color={ROSE} transparent opacity={mold} toneMapped={false} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      </Stage>
      <Tag t={t} at={mol + 0.3} x={540} y={1360} text="Sin molde" c={ROSE} align="center" />
    </AbsoluteFill>
  );
};

// 2-3 · Corte esquemático: el intestino se dibuja dentro del cuerpo; luego un tramo recto en 3D con sección circular.
const Inside: React.FC<SceneProps> = ({ t, w, len }) => {
  const gi = w(2, /intestino/) - 0.2, s3 = w(3, /./), esq = w(3, /esquina/) - 0.1;
  const draw = k(t, gi, 1.1, inOut);
  const svgO = k(t, 0, 0.5) * (1 - k(t, s3 - 0.25, 0.5));
  const o3 = k(t, s3 - 0.1, 0.6);
  const orb = k(t, s3, Math.max(1, len - s3), inOut);
  const cam: V3 = [mix(3, 1.5, orb), mix(1, 1.4, orb), mix(8, 8.4, orb)];
  const q = useSpring(t, esq, 14);
  const L2 = 3.4, R2 = 0.6;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: svgO }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <path d={BODY} fill="#000000" fillOpacity={0.22} stroke={OCHRE} strokeOpacity={0.3} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={205} cy={895} r={9} fill={OCHRE} fillOpacity={0.35} />
          <path d={GUT} pathLength={1} fill="none" stroke={WALL} strokeWidth={30} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <path d={GUT} pathLength={1} fill="none" stroke={WALL_LIGHT} strokeOpacity={0.5} strokeWidth={9} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: o3 }}>
        <Stage cam={cam} look={[-0.3, 0, 0]} sun={[-5, 7, 6]} rim={RIM} shadows={false}>
          <group position={[-0.9, 0, 0]} rotation={[0, -0.8, 0]}>
            <group rotation={[0, 0, -Math.PI / 2]}>
              <mesh>
                <cylinderGeometry args={[R2, R2, L2, 64, 1, true]} />
                <meshPhysicalMaterial color={WALL} roughness={0.45} clearcoat={0.55} clearcoatRoughness={0.3} transparent opacity={0.85} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, L2 / 2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[R2, 0.045, 16, 96]} /><Clay c={WALL_LIGHT} /></mesh>
              <mesh position={[0, -L2 / 2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[R2, 0.045, 16, 96]} /><Clay c={WALL_LIGHT} /></mesh>
            </group>
          </group>
        </Stage>
      </AbsoluteFill>
      {q > 0 && (
        <div style={{ position: "absolute", left: 800, top: 1180, width: 170, height: 170, translate: "-50% -50%", scale: `${q}`, border: "6px solid #ffffff", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 120, lineHeight: 1, color: OCHRE }}>?</div>
      )}
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 4 · El estudio: el año con muelle sobre el tubo desenfocado.
const Study: React.FC<SceneProps> = ({ t, w, len }) => {
  const at = w(4, /2021|dos/) - 0.1;
  const s = useSpring(t, at, 12);
  const shrink = k(t, len - 0.7, 0.6, inOut);
  const focus = k(t, len - 0.9, 0.8, inOut);
  const h = mix(150, 70, focus);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: mix(190, 110, focus), width: mix(700, 860, focus), top: 1000 - h / 2, height: h, borderRadius: 999, background: WALL, opacity: mix(0.3, 0.55, focus), filter: `blur(${mix(30, 2, focus)}px)` }} />
      <div style={{ position: "absolute", left: 540, top: 690, translate: `-50% ${mix(0, -110, shrink)}px`, scale: `${s * mix(1, 0.55, shrink)}`, opacity: k(t, at, 0.25),
        fontFamily: SANS, fontSize: 270, fontWeight: 900, letterSpacing: -10, lineHeight: 0.95, color: OCHRE, textShadow: `0 0 60px ${OCHRE}55` }}>2021</div>
      <Tag t={t} at={at + 0.4} x={540} y={1120} text="Estudio" c={INK} align="center" size={32} />
      <Source t={t} at={at} text="Yang et al., Soft Matter, 2021" />
    </AbsoluteFill>
  );
};

// 5 · El último 17 %: barra rectificada; el tramo final mide exactamente 0,17 de la barra.
const BX = 110, BW = 860, BY = 1000, BH = 70, SEG = 0.17 * BW, SX = BX + BW - SEG;
const Last17: React.FC<SceneProps> = ({ t, w, len }) => {
  const ul = w(5, /último/) - 0.1, n17 = w(5, /17|diecisiete/) - 0.1;
  const pin = k(t, 0, 0.6);
  const lit = k(t, ul, 0.7, inOut);
  const brace = k(t, ul + 0.4, 0.4);
  const drift = mix(0, 20, k(t, 0, len, inOut));
  const lbl = { position: "absolute", top: BY + 56, fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: INK, opacity: 0.75 * pin } as const;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ translate: `${drift}px 0` }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <defs>
            <clipPath id="e1021-bar"><rect x={BX} y={BY - BH / 2} width={BW} height={BH} rx={BH / 2} /></clipPath>
            <linearGradient id="e1021-lit" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={STIFF} /><stop offset="1" stopColor={OCHRE} /></linearGradient>
          </defs>
          <g opacity={pin}>
            <rect x={BX} y={BY - BH / 2} width={BW} height={BH} rx={BH / 2} fill={WALL} fillOpacity={0.55} />
            <g clipPath="url(#e1021-bar)">
              <rect x={BX + BW - SEG * lit} y={BY - BH / 2} width={SEG * lit} height={BH} fill="url(#e1021-lit)" />
            </g>
            {[300, 450, 600, 740].map((cx) => <circle key={cx} cx={cx} cy={BY} r={17} fill={POO} fillOpacity={0.55} />)}
            {[2, 3, 4].map((n, i) => (
              <path key={n} d={superPath(SX + SEG * (0.2 + i * 0.3), BY, inscribed(18, n), n)} fill={POO} opacity={k(t, ul + 0.3 + i * 0.2, 0.4)} />
            ))}
          </g>
          <path d={`M ${SX} ${BY - 50} L ${SX} ${BY - 66} L ${SX + SEG} ${BY - 66} L ${SX + SEG} ${BY - 50} M ${SX + SEG / 2} ${BY - 66} L ${SX + SEG / 2} ${BY - 82}`}
            fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={4} strokeLinejoin="round" opacity={brace} />
        </svg>
        <div style={{ ...lbl, left: BX }}>INICIO</div>
        <div style={{ ...lbl, right: 1080 - (BX + BW) }}>FINAL</div>
      </AbsoluteFill>
      <Stat t={t} at={n17} to={17} suffix=" %" y={640} c={OCHRE} size={200} sub="del intestino" />
      <Source t={t} at={ul} text="Proporción del 17 % a escala; resto, esquema" />
    </AbsoluteFill>
  );
};

// 6-8 · La pared: anillo en corte; sectores gruesos al doble exacto y barras de rigidez 4:1.
const Wall: React.FC<SceneProps> = ({ t, w }) => {
  const aI = w(6, /igual/) - 0.1, aD = w(7, /doble/) - 0.1, aC = w(8, /cuatro/) - 0.1;
  const pin = k(t, 0, 0.6), pI = k(t, aI, 0.6), pD = k(t, aD, 0.9, inOut), pC = k(t, aC, 0.9, inOut);
  const cx = 540, cy = 930, Ri = 230, TH = 30, U = 170;
  const thick = TH * mix(1, 2, pD); // exactamente 2 × TH al terminar
  const rot = t * 4; // grados
  const step = (Math.PI * 2) / SECT;
  const mid = (s: number) => OFF + (s + 0.5) * step;
  const cota = (a: number, r0: number, r1: number) => {
    const c = Math.cos(a), s = Math.sin(a), tx = -s * 12, ty = c * 12;
    const X = (r: number) => cx + c * r, Y = (r: number) => cy + s * r;
    return `M ${X(r0)} ${Y(r0)} L ${X(r1)} ${Y(r1)} M ${X(r0) - tx} ${Y(r0) - ty} L ${X(r0) + tx} ${Y(r0) + ty} M ${X(r1) - tx} ${Y(r1) - ty} L ${X(r1) + tx} ${Y(r1) + ty}`;
  };
  const lab = (a: number, r: number, text: string, o: number) => {
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    return <text x={x} y={y} transform={`rotate(${-rot} ${x} ${y})`} textAnchor="middle" dominantBaseline="middle" fontFamily={SANS} fontWeight={800} fontSize={26} letterSpacing={2} fill="#ffffff" fillOpacity={0.8 * o}>{text}</text>;
  };
  const pCota = k(t, aD, 0.4);
  const pBars = k(t, aC, 0.4);
  const rowLbl = { position: "absolute", left: 70, fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: INK, opacity: 0.85 * pBars } as const;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g opacity={pin} transform={`rotate(${rot} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={Ri - 3} fill="#0c0807" fillOpacity={0.55} />
          {Array.from({ length: SECT }, (_, s) => {
            const a0 = OFF + s * step, a1 = a0 + step, rigid = s % 2 === 0;
            const d = sector(cx, cy, Ri, Ri + (rigid ? thick : TH), a0, a1);
            return (
              <g key={s}>
                <path d={d} fill={WALL} />
                {rigid && <path d={d} fill={STIFF} opacity={pI} />}
              </g>
            );
          })}
          <path d={cota(mid(5), Ri, Ri + TH)} fill="none" stroke="#ffffff" strokeOpacity={0.7 * pCota} strokeWidth={3} />
          <path d={cota(mid(6), Ri, Ri + thick)} fill="none" stroke="#ffffff" strokeOpacity={0.7 * pCota} strokeWidth={3} />
          {lab(mid(5), Ri + TH + 45, "FINA", pCota)}
          {lab(mid(6), Ri + thick + 45, "GRUESA", pCota)}
        </g>
      </svg>
      <Tag t={t} at={aD + 0.4} x={70} y={1290} text="×2 grosor" c={STIFF} size={30} />
      <div style={{ position: "absolute", right: 70, top: 1300, fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 1, color: MINT, opacity: k(t, aC + 0.7, 0.4) }}>medido en tejido</div>
      <div style={{ ...rowLbl, top: 1364 }}>ZONA FINA</div>
      <div style={{ position: "absolute", left: 330, top: 1365, width: U * pC, height: 30, background: WALL, borderRadius: 8 }} />
      <div style={{ ...rowLbl, top: 1424 }}>ZONA GRUESA</div>
      <div style={{ position: "absolute", left: 330, top: 1425, width: 4 * U * pC, height: 30, background: STIFF, borderRadius: 8, overflow: "hidden" }}>
        {[1, 2, 3].map((i) => <div key={i} style={{ position: "absolute", left: U * i - 1.5, top: 0, width: 3, height: 30, background: "#1a1210", opacity: 0.6 }} />)}
      </div>
      <Tag t={t} at={aC + 0.5} x={1010} y={1352} text="×4 rigidez" c={STIFF} size={28} align="right" solid />
      <Source t={t} at={0.3} text="Esquema, no a escala · proporciones ×2 y ×4 sí" />
    </AbsoluteFill>
  );
};

// 9-10 · MODELO: malla de simulación; las zonas rígidas se contraen antes y el contenido pasa de círculo a cuadrado redondeado.
const Model: React.FC<SceneProps> = ({ t, w }) => {
  const c0 = w(9, /rápido/) - 0.35, esq = w(10, /esquinas/) - 0.1;
  const A = 34, Ri = 200;
  const pR = k(t, c0, 0.9, inOut), pT = k(t, c0, 2.0, inOut); // misma salida, la rígida termina antes
  const n = mix(2, 4, k(t, esq, 1.4, inOut));
  const pin = k(t, 0, 0.6);
  const blink = 0.75 + 0.25 * Math.sin(t * 5);
  const bar = (top: number, label: string, p: number, strong: boolean) => (
    <>
      <div style={{ position: "absolute", left: 720, top, fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: MINT, opacity: pin * (strong ? 1 : 0.75) }}>{label}</div>
      <div style={{ position: "absolute", left: 720, top: top + 44, width: 290, height: 24, border: `3px solid ${MINT}`, borderRadius: 999, opacity: pin, overflow: "hidden" }}>
        <div style={{ width: `${p * 100}%`, height: "100%", background: MINT, opacity: strong ? 0.95 : 0.5 }} />
      </div>
    </>
  );
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <pattern id="e1021-grid" width={40} height={40} patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 L 0 40" fill="none" stroke={MINT} strokeWidth={1.5} /></pattern>
        </defs>
        <rect x={0} y={500} width={1080} height={1040} fill="url(#e1021-grid)" opacity={0.08} />
        <g transform="translate(400 1000)" opacity={pin}>
          <RingMesh Ri={Ri} thin={26} thick={52} cR={A * pR} cT={A * pT} n={n} Rc={Ri - A - 12} />
        </g>
      </svg>
      <Tag t={t} at={0.1} x={70} y={540} text="Modelo" c={MINT} />
      <div style={{ position: "absolute", left: 340, top: 559, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: MINT, opacity: k(t, 0.3, 0.4) * blink }}>
        <span style={{ width: 12, height: 12, borderRadius: 99, background: MINT }} />SIMULACIÓN
      </div>
      <div style={{ position: "absolute", left: 720, top: 820, fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: INK, opacity: 0.6 * pin }}>CONTRACCIÓN</div>
      {bar(870, "RÍGIDA", pR, true)}
      {bar(990, "FINA", pT, false)}
      <Tag t={t} at={esq + 0.3} x={540} y={1290} text="Propuesta" c={MINT} align="center" size={30} />
      <Source t={t} at={0.3} text="Modelo matemático (Yang et al., 2021) · esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 11-12 · No observado: silueta a contraluz con visor vacío; después, cálculo frente a grabación.
const NotSeen: React.FC<SceneProps> = ({ t, w }) => {
  const s12 = w(12, /./), dir = w(11, /directo/) - 0.2;
  const cu = w(12, /cuentas/) - 0.15, gr = w(12, /grabación/) - 0.15;
  const sc = useSpring(t, cu, 14), sg = useSpring(t, gr, 14);
  const oA = k(t, 0, 0.5) * (1 - k(t, s12 - 0.2, 0.4));
  const pan = mix(-30, 30, k(t, 0, Math.max(1, s12), inOut));
  const oB = k(t, s12 - 0.1, 0.4);
  const x0 = 360, y0 = 810, x1 = 900, y1 = 1150, L = 50;
  const visor = `M ${x0} ${y0 + L} L ${x0} ${y0} L ${x0 + L} ${y0} M ${x1 - L} ${y0} L ${x1} ${y0} L ${x1} ${y0 + L} M ${x1} ${y1 - L} L ${x1} ${y1} L ${x1 - L} ${y1} M ${x0 + L} ${y1} L ${x0} ${y1} L ${x0} ${y1 - L}`;
  const card = (left: number, c: string, s: number) => ({ position: "absolute", left, top: 760, width: 450, height: 540, borderRadius: 36, border: `4px solid ${c}`, background: "rgba(8,10,20,0.45)", scale: `${s}`, opacity: Math.min(1, s) } as const);
  const title = (c: string) => ({ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 850, fontSize: 40, letterSpacing: 4, color: c } as const);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: oA, translate: `${pan}px 0` }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <defs><filter id="e1021-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={7} /></filter></defs>
          <path d={BODY} fill="none" stroke={RIM} strokeWidth={12} strokeOpacity={0.45} filter="url(#e1021-glow)" />
          <path d={BODY} fill="#0b0807" stroke={RIM} strokeWidth={3} strokeOpacity={0.85} strokeLinejoin="round" />
          <path d={GUT} fill="none" stroke={WALL} strokeOpacity={0.7} strokeWidth={14} strokeDasharray="18 14" strokeLinecap="round" />
          <path d={visor} fill="none" stroke="#ffffff" strokeOpacity={0.5 * k(t, dir, 0.4)} strokeWidth={5} strokeLinecap="round" />
        </svg>
        <Tag t={t} at={dir + 0.2} x={540} y={1290} text="No observado en vivo" c={ROSE} align="center" size={30} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: oB }}>
        {sc > 0 && (
          <div style={card(70, MINT, sc)}>
            <div style={title(MINT)}>CÁLCULO</div>
            <svg width={450} height={540} style={{ position: "absolute", left: -4, top: -4 }}>
              <g transform="translate(225 300) scale(0.68)">
                <RingMesh Ri={200} thin={26} thick={52} cR={34} cT={34} n={4} Rc={154} />
              </g>
              <circle cx={400} cy={58} r={26} fill={MINT} />
              <path d="M 388 58 L 397 68 L 413 48" fill="none" stroke="#0b1022" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {sg > 0 && (
          <div style={card(560, `${ROSE}99`, sg)}>
            <div style={{ ...title(ROSE), opacity: 0.6 }}>GRABACIÓN</div>
            <svg width={450} height={540} style={{ position: "absolute", left: -4, top: -4 }}>
              <rect x={75} y={130} width={300} height={320} rx={18} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="14 12" />
              <path d="M 135 210 L 315 370 M 315 210 L 135 370" fill="none" stroke={ROSE} strokeOpacity={0.85} strokeWidth={10} strokeLinecap="round" />
            </svg>
          </div>
        )}
      </AbsoluteFill>
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 13 · Cierre: tubo blando de arcilla con malla MINT tenue; asoma el contenido de sección cuadrada redondeada.
const Close: React.FC<SceneProps> = ({ t, w, len }) => {
  const esq = w(13, /esquinas/) - 0.1;
  const p = k(t, 0, len, inOut);
  const cam: V3 = [mix(1.2, 2.2, p), mix(0.6, 0.9, p), mix(8, 10, p)];
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.75, 0.35, 0.56).normalize()), []);
  const core = useMemo(() => {
    const sh = new THREE.Shape();
    superPts(inscribed(0.6, 4), 4).forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 4, curveSegments: 4 });
  }, []);
  const fade = k(t, len - 0.6, 0.6);
  return (
    <AbsoluteFill>
      <Stage cam={cam} look={[0.2, 0.3, 0]} sun={[-5, 7, 6]} rim="#ffb070" amb={0.3} shadows={false}>
        <group scale={0.72} quaternion={q}>
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 3.4, 64, 1, true]} />
            <meshPhysicalMaterial color={WALL} roughness={0.5} clearcoat={0.55} clearcoatRoughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.05, 16, 96]} /><Clay c={WALL_LIGHT} r={0.5} /></mesh>
          <mesh position={[0, -1.7, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.05, 16, 96]} /><Clay c={WALL_LIGHT} r={0.5} /></mesh>
          <mesh>
            <cylinderGeometry args={[0.715, 0.715, 3.4, 32, 10, true]} />
            <meshBasicMaterial color={MINT} wireframe transparent opacity={0.25} toneMapped={false} />
          </mesh>
          <mesh geometry={core} position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><Clay c={OCHRE} r={0.5} /></mesh>
        </group>
      </Stage>
      <div style={{ position: "absolute", top: 1300, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 140, letterSpacing: 18, color: "#f2d3a8", opacity: k(t, esq, 0.8), textShadow: `0 0 60px ${OCHRE}55` }}>WOMBAT</div>
      <Source t={t} at={0.3} text="Yang et al., Soft Matter 17, 475-488 (2021) · esquema, no a escala" />
      <AbsoluteFill style={{ background: BG.top, opacity: fade }} />
    </AbsoluteFill>
  );
};

const SCENES: SceneDef[] = [
  { from: 0, C: Hook },
  { from: 2, C: Inside },
  { from: 4, C: Study },
  { from: 5, C: Last17 },
  { from: 6, C: Wall },
  { from: 9, C: Model },
  { from: 11, C: NotSeen },
  { from: 13, C: Close },
];
// "17" y "%" llegan como palabras separadas a los subtítulos: van sueltas para que se resalten.
const KEYS = ["wombat", "cúbicas", "molde", "intestino", "esquina", "2021", "17", "%", "17 %", "doble", "grosor", "cuatro", "rígidas", "modelo", "proponen", "esquinas"];

export const id = "2026-10-21";
const E20261021: React.FC<CurioProps> = (p) => <Reel {...p} scenes={SCENES} keys={KEYS} accent={OCHRE} bg={BG} />;
export default E20261021;
