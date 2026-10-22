// Episodio 2026-10-22 · Por qué las llantas parecen girar al revés en vídeo. Guion y claims: episodes/2026-10-22/episode.json.
// Cifras en pantalla: solo 5 radios, 24 fps, 72°, 4,8 vueltas/s y 1996 (storyboard.md).
// Motor de giro: la llanta filmada depende solo del índice entero floor(f*24/fps); la real va con desenfoque por
// submuestreo (12 copias) para que el render a 30 fps no la haga parecer ir hacia atrás.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Reel, Stage, Clay, Glow, Tag, Stat, Source, k, mix, inOut, useSpring, SANS, type CurioProps, type SceneProps, type SceneDef } from "../kit";

type V3 = [number, number, number];
const AMBER = "#ffb547", CYAN = "#6fd3ff", MINT = "#7fe0c4", ROSE = "#ff7a6b";
const CHROME = "#cfd8e6", CHROME_D = "#7d8798", TIRE = "#14161b", INK = "#dfe6ff";
const BG = { top: "#05070c", mid: "#0e1420", glow: "#1c2840" };

// ---------- motor de giro ----------
const FILM = 24;
const SPOKES = 5, PITCH = 360 / SPOKES; // 72°
const STEP_FREEZE = 72, STEP_LESS = 68, STEP_MORE = 76; // grados por fotograma filmado (nunca se rotulan)
const filmN = (f: number, fps: number) => Math.floor((f * FILM) / fps);
const filmedDeg = (n: number, step: number, n0 = 0, deg0 = 0) => deg0 + (n - n0) * step;
const realDeg = (t: number, step: number) => step * FILM * t;
const apparent = (step: number) => ((((step + PITCH / 2) % PITCH) + PITCH) % PITCH) - PITCH / 2;
const IDX = [0, 1, 2, 3, 4];

// ---------- utilidades SVG ----------
const pol = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>{children}</svg>
);
const cornersD = (x0: number, y0: number, x1: number, y1: number, L: number) =>
  `M ${x0} ${y0 + L} L ${x0} ${y0} L ${x0 + L} ${y0} M ${x1 - L} ${y0} L ${x1} ${y0} L ${x1} ${y0 + L} M ${x1} ${y1 - L} L ${x1} ${y1} L ${x1 - L} ${y1} M ${x0 + L} ${y1} L ${x0} ${y1} L ${x0} ${y1 - L}`;
// Flecha curva: a0 en grados SVG (0 = derecha); cw = horario en pantalla
const ArcArrow: React.FC<{ cx: number; cy: number; r: number; a0: number; span: number; cw: boolean; c: string; o?: number; dash?: boolean; sw?: number }> = ({ cx, cy, r, a0, span, cw, c, o = 1, dash, sw = 8 }) => {
  if (o <= 0) return null;
  const a1 = a0 + (cw ? span : -span);
  const [sx, sy] = pol(cx, cy, r, a0), [ex, ey] = pol(cx, cy, r, a1);
  const rad = (a1 * Math.PI) / 180, sg = cw ? 1 : -1, h = sw * 2.6;
  const tx = -Math.sin(rad) * sg, ty = Math.cos(rad) * sg, nx = Math.cos(rad), ny = Math.sin(rad);
  const head = `M ${ex + tx * h} ${ey + ty * h} L ${ex + nx * h * 0.6} ${ey + ny * h * 0.6} L ${ex - nx * h * 0.6} ${ey - ny * h * 0.6} Z`;
  return (
    <g opacity={o}>
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${span > 180 ? 1 : 0} ${cw ? 1 : 0} ${ex} ${ey}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash ? `${sw * 2.2} ${sw * 1.8}` : undefined} />
      <path d={head} fill={c} />
    </g>
  );
};

// ---------- llanta SVG ----------
type Blur = { at: (tt: number) => number; t: number; fps: number };
const K_BLUR = 12;
const spokeD = (cx: number, cy: number, R: number) => {
  const r0 = 0.16 * R, r1 = 0.74 * R, b = 0.065 * R, p = 0.045 * R;
  return `M ${cx - b} ${cy - r0} L ${cx - p} ${cy - r1} L ${cx + p} ${cy - r1} L ${cx + b} ${cy - r0} Z`;
};
const SpokeSet: React.FC<{ cx: number; cy: number; R: number; deg: number; gid: string; o: number; hi?: number[]; hiC: string }> = ({ cx, cy, R, deg, gid, o, hi, hiC }) => (
  <g transform={`rotate(${deg} ${cx} ${cy})`} opacity={o}>
    {IDX.map((i) => <path key={i} d={spokeD(cx, cy, R)} transform={`rotate(${i * PITCH} ${cx} ${cy})`} fill={`url(#${gid})`} stroke={CHROME} strokeWidth={0.02 * R} strokeLinejoin="round" />)}
    {hi && IDX.map((i) => (hi[i] > 0 ? <path key={`h${i}`} d={spokeD(cx, cy, R)} transform={`rotate(${i * PITCH} ${cx} ${cy})`} fill="none" stroke={hiC} strokeWidth={0.028 * R} strokeLinejoin="round" opacity={hi[i]} /> : null))}
  </g>
);
const NutSet: React.FC<{ cx: number; cy: number; R: number; deg: number; o: number; mark?: string; markO: number }> = ({ cx, cy, R, deg, o, mark, markO }) => (
  <g transform={`rotate(${deg} ${cx} ${cy})`} opacity={o}>
    {IDX.map((i) => {
      const [x, y] = pol(cx, cy, 0.095 * R, -90 + PITCH / 2 + i * PITCH);
      return <circle key={i} cx={x} cy={y} r={0.024 * R} fill={CHROME_D} stroke="#3a4150" strokeWidth={0.006 * R} />;
    })}
    {mark && markO > 0 && <circle cx={cx} cy={cy - 0.7 * R} r={0.05 * R} fill={mark} opacity={markO} />}
  </g>
);
const Rim: React.FC<{ id: string; cx: number; cy: number; R: number; deg?: number; mark?: string; markO?: number; blur?: Blur; hi?: number[]; hiC?: string; o?: number; shadow?: boolean }> = ({ id, cx, cy, R, deg = 0, mark, markO = 1, blur, hi, hiC = AMBER, o = 1, shadow = true }) => {
  if (o <= 0) return null;
  const gid = `${id}-sp`, sid = `${id}-hl`, fid = `${id}-sh`;
  const copies = blur ? Array.from({ length: K_BLUR }, (_, j) => blur.at(blur.t + j / (blur.fps * K_BLUR))) : [deg];
  const co = blur ? 0.16 : 1;
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={CHROME_D} /><stop offset="0.45" stopColor={CHROME} /><stop offset="0.62" stopColor="#f4f7fc" /><stop offset="1" stopColor={CHROME_D} />
        </linearGradient>
        <radialGradient id={sid} gradientUnits="userSpaceOnUse" cx={cx - 0.35 * R} cy={cy - 0.4 * R} r={0.95 * R}>
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.18} /><stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        <filter id={fid} x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation={R * 0.04} /></filter>
      </defs>
      {shadow && <ellipse cx={cx} cy={cy + R * 0.99} rx={R * 0.85} ry={R * 0.07} fill="#000000" opacity={0.6} filter={`url(#${fid})`} />}
      <circle cx={cx} cy={cy} r={0.9 * R} fill="none" stroke={TIRE} strokeWidth={0.2 * R} />
      <circle cx={cx} cy={cy} r={0.8 * R} fill="none" stroke="#262a33" strokeWidth={0.014 * R} />
      <circle cx={cx} cy={cy} r={0.77 * R} fill="none" stroke={CHROME_D} strokeWidth={0.06 * R} />
      <circle cx={cx} cy={cy} r={0.74 * R} fill="#06080d" />
      {copies.map((d, j) => <SpokeSet key={j} cx={cx} cy={cy} R={R} deg={d} gid={gid} o={co} hi={blur ? undefined : hi} hiC={hiC} />)}
      <circle cx={cx} cy={cy} r={0.16 * R} fill={CHROME} stroke={CHROME_D} strokeWidth={0.012 * R} />
      {copies.map((d, j) => <NutSet key={j} cx={cx} cy={cy} R={R} deg={d} o={co} mark={mark} markO={markO} />)}
      <circle cx={cx} cy={cy} r={R} fill={`url(#${sid})`} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

// ---------- reloj de fotogramas (sin dígitos) ----------
const TIC_W = 22, TIC_G = 11, TIC_X0 = 540 - (24 * TIC_W + 23 * TIC_G) / 2;
const Clock: React.FC<{ n: number; o: number; lab?: number }> = ({ n, o, lab = 0 }) => {
  if (o <= 0) return null;
  const lit = ((n % 24) + 24) % 24;
  return (
    <>
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: TIC_X0 + i * (TIC_W + TIC_G), top: 610, width: TIC_W, height: 34, borderRadius: 5, background: AMBER,
          opacity: o * (i === lit ? 1 : 0.18), boxShadow: i === lit ? `0 0 18px ${AMBER}` : "none" }} />
      ))}
      {lab > 0 && (
        <div style={{ position: "absolute", right: 70, top: 540, display: "flex", alignItems: "center", gap: 12, fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: AMBER, opacity: o * lab, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: AMBER }} />24 FPS
        </div>
      )}
    </>
  );
};
const Label: React.FC<{ x: number; y?: number; text: string; c: string; o?: number; size?: number }> = ({ x, y = 1190, text, c, o = 1, size = 28 }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 3, color: c, opacity: o, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{text}</div>
);
const Note: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "absolute", left: 70, top: 1462, fontFamily: SANS, fontWeight: 600, fontSize: 24, color: INK, opacity: 0.55 * k(t, 0.3, 0.5) }}>Esquema, no a escala</div>
);

// ---------- 3D: llanta, coche y carretera ----------
const hw = (r: number) => mix(0.065, 0.045, Math.min(1, Math.max(0, (r - 0.16) / 0.58)));
const rimShape = (R: number) => {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.8 * R, 0, Math.PI * 2, false);
  const ro = 0.74, ri = 0.24, N = 18, D = 180 / Math.PI;
  const dO = Math.asin(hw(ro) / ro) * D, dI = Math.asin(hw(ri) / ri) * D;
  for (let i = 0; i < SPOKES; i++) {
    const th = 90 + i * PITCH;
    const h = new THREE.Path();
    for (let j = 0; j <= N; j++) {
      const a = mix(th + dO, th + PITCH - dO, j / N) / D;
      if (j === 0) h.moveTo(ro * R * Math.cos(a), ro * R * Math.sin(a)); else h.lineTo(ro * R * Math.cos(a), ro * R * Math.sin(a));
    }
    for (let j = 0; j <= N; j++) {
      const a = mix(th + PITCH - dI, th + dI, j / N) / D;
      h.lineTo(ri * R * Math.cos(a), ri * R * Math.sin(a));
    }
    h.closePath();
    s.holes.push(h);
  }
  return s;
};
// Con la cámara mirando a -z, rotation.z = -deg es giro horario (avance de un coche que va hacia la derecha)
const Rim3: React.FC<{ R: number; deg: number; position?: V3 }> = ({ R, deg, position }) => {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(rimShape(R), { depth: 0.3 * R, bevelEnabled: true, bevelThickness: 0.05 * R, bevelSize: 0.04 * R, bevelSegments: 3, curveSegments: 48 });
    g.translate(0, 0, -0.15 * R);
    return g;
  }, [R]);
  return (
    <group position={position} rotation={[0, 0, (-deg * Math.PI) / 180]}>
      <mesh geometry={geo} castShadow><meshPhysicalMaterial color={CHROME} metalness={0.85} roughness={0.3} clearcoat={0.3} /></mesh>
      <mesh castShadow><torusGeometry args={[0.9 * R, 0.12 * R, 24, 96]} /><meshPhysicalMaterial color={TIRE} roughness={0.9} /></mesh>
      <mesh position={[0, 0, -0.3 * R]}><circleGeometry args={[0.82 * R, 48]} /><meshStandardMaterial color="#05070b" roughness={1} /></mesh>
      <mesh position={[0, 0, 0.2 * R]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12 * R, 0.15 * R, 0.12 * R, 32]} /><meshPhysicalMaterial color={CHROME} metalness={0.9} roughness={0.25} /></mesh>
    </group>
  );
};

const WR = 0.38; // radio de rueda en coordenadas del coche
const bodyShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.4);
  s.lineTo(-2.05, 0.3);
  s.lineTo(-1.66, 0.3);
  s.absarc(-1.2, WR, 0.46, Math.PI, 0, true);
  s.lineTo(-0.74, 0.3);
  s.lineTo(1.04, 0.3);
  s.absarc(1.5, WR, 0.46, Math.PI, 0, true);
  s.lineTo(1.96, 0.3);
  s.lineTo(2.12, 0.32);
  s.lineTo(2.2, 0.7);
  s.lineTo(1.9, 0.86);
  s.lineTo(0.8, 0.96);
  s.lineTo(0.15, 1.42);
  s.lineTo(-1.0, 1.48);
  s.lineTo(-1.75, 1.06);
  s.lineTo(-2.15, 0.98);
  s.closePath();
  return s;
};
const windowShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-1.62, 1.04);
  s.lineTo(-0.98, 1.4);
  s.lineTo(0.12, 1.36);
  s.lineTo(0.62, 0.99);
  s.lineTo(-1.62, 0.99);
  s.closePath();
  return s;
};
const CarBody: React.FC<{ o?: number }> = ({ o = 1 }) => {
  const g = useMemo(() => {
    const x = new THREE.ExtrudeGeometry(bodyShape(), { depth: 1.6, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 24 });
    x.translate(0, 0, -0.8);
    return x;
  }, []);
  const win = useMemo(() => new THREE.ShapeGeometry(windowShape()), []);
  if (o <= 0) return null;
  return (
    <group>
      <mesh geometry={g} castShadow receiveShadow><Clay c="#2c3a55" r={0.35} o={o} /></mesh>
      <mesh geometry={win} position={[0, 0, 0.846]}><meshStandardMaterial color="#0b0f18" roughness={0.2} metalness={0.4} transparent={o < 1} opacity={o} /></mesh>
      <mesh position={[-0.42, 1.18, 0.85]}><boxGeometry args={[0.07, 0.42, 0.01]} /><Clay c="#2c3a55" r={0.35} o={o} /></mesh>
      <mesh position={[2.17, 0.62, 0.55]} scale={[0.05, 0.09, 0.16]}><sphereGeometry args={[1, 16, 12]} /><Clay c="#fff4dc" emissive="#fff1d0" ei={2.5} o={o} /></mesh>
      <mesh position={[-2.18, 0.85, 0.55]} scale={[0.04, 0.08, 0.12]}><sphereGeometry args={[1, 16, 12]} /><Clay c="#ff5a4a" emissive="#ff3a2a" ei={1.4} o={o} /></mesh>
    </group>
  );
};
// Carretera: discontinuas de periodo 2,4 que corren hacia -x (máximo 1/4 de periodo por fotograma de 30 fps)
const Road: React.FC<{ off: number }> = ({ off }) => {
  const sh = ((off % 2.4) + 2.4) % 2.4;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 30]} /><meshStandardMaterial color="#0f1218" roughness={0.95} /></mesh>
      {[1.9, -2.4].flatMap((z) => Array.from({ length: 26 }, (_, i) => (
        <mesh key={`${z}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 13) * 2.4 - sh, 0.004, z]}>
          <planeGeometry args={[1.2, 0.09]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>
      )))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.006, -1.4]} scale={[2.6, 0.9, 1]}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color="#ffb070" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};
const CAR_POS: V3 = [-0.48, 0.122, 0], CAR_S = 0.6;
const REAR_W: V3 = [CAR_POS[0] + CAR_S * -1.2, CAR_POS[1] + CAR_S * WR, CAR_POS[2] + CAR_S * 0.9];
const CarScene: React.FC<{ deg: number; off: number }> = ({ deg, off }) => (
  <group position={CAR_POS} scale={CAR_S}>
    <Road off={off} />
    <CarBody />
    <Rim3 R={WR} deg={deg} position={[-1.2, WR, 0.9]} />
    <Rim3 R={WR} deg={deg} position={[1.5, WR, 0.9]} />
  </group>
);
// Proyección de la rueda trasera al lienzo (misma cámara que Stage): para anclar flechas y visor
const FOV = 50;
const projector = new THREE.PerspectiveCamera(FOV, 1080 / 1920, 0.1, 400);
const project = (cam: V3, look: V3, p: V3, r: number) => {
  projector.position.set(...cam);
  projector.lookAt(...look);
  projector.updateMatrixWorld();
  const a = new THREE.Vector3(...p).project(projector);
  const b = new THREE.Vector3(p[0], p[1] + r, p[2]).project(projector);
  const X = (v: THREE.Vector3) => ((v.x + 1) / 2) * 1080, Y = (v: THREE.Vector3) => ((1 - v.y) / 2) * 1920;
  return { x: X(a), y: Y(a), r: Math.hypot(X(b) - X(a), Y(b) - Y(a)) };
};
const roadOff = (deg: number) => (deg / 360) * 2 * Math.PI * WR; // rodadura sin deslizar

// ---------- escenas ----------
// 0-1 · Gancho: coche nocturno; ruedas filmadas a 24 fps con paso algo menor de 72°: se leen hacia atrás.
const LOOK1: V3 = [REAR_W[0], REAR_W[1], REAR_W[2]];
const Hook: React.FC<SceneProps> = ({ t, f, w, len }) => {
  const { fps } = useVideoConfig();
  const p = k(t, 0, len, inOut);
  const cam: V3 = [mix(-0.6, 0.4, p), mix(0.55, 0.45, p), mix(7.2, 6.4, p)];
  const deg = filmedDeg(filmN(f, fps), STEP_LESS);
  const off = roadOff(realDeg(t, STEP_LESS));
  const av = w(1, /avanza/) - 0.1, re = w(1, /retroceder/) - 0.1;
  const wp = project(cam, LOOK1, REAR_W, WR * CAR_S);
  const pa = k(t, av, 0.4);
  return (
    <AbsoluteFill>
      <Stage cam={cam} look={LOOK1} fov={FOV} sun={[-5, 8, 5]} rim="#ffb070" amb={0.25}>
        <fog attach="fog" args={[BG.mid, 6, 22]} />
        <CarScene deg={deg} off={off} />
      </Stage>
      <Svg>
        <g opacity={pa}>
          <path d={`M 330 1380 L ${mix(330, 715, pa)} 1380`} stroke={CYAN} strokeWidth={10} strokeLinecap="round" />
          <path d="M 752 1380 L 714 1358 L 714 1402 Z" fill={CYAN} />
        </g>
        <ArcArrow cx={wp.x} cy={wp.y} r={wp.r * 1.45} a0={-20} span={230} cw={false} c={ROSE} o={k(t, re, 0.4)} sw={9} />
      </Svg>
      <Tag t={t} at={re + 0.2} x={540} y={1440} text="Parece retroceder" c={ROSE} align="center" size={32} />
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 2-3 · La cámara: rueda sola (3D) y después llanta SVG con visor, reloj y tira de instantáneas sueltas.
const PX2 = 960 / (5 * Math.tan((20 * Math.PI) / 180)); // px por unidad en z = 0 (fov 40, cámara a 5)
const R2 = 260 / PX2, Y2 = (960 - 900) / PX2, S2 = R2 / WR;
const CELL = 170, CELL_P = 190, SX0 = 540 - (5 * CELL_P) / 2 + 10;
const CameraScene: React.FC<SceneProps> = ({ t, f, w, len }) => {
  const { fps } = useVideoConfig();
  const rueda = w(2, /rueda/) - 0.1, s3 = w(3, /./) - 0.1, camW = w(3, /cámara/) - 0.1, fotos = w(3, /fotos/) - 0.1;
  const stopF = Math.round((len - 0.6) * fps); // al final la llanta se queda quieta
  const n = filmN(Math.min(f, stopF), fps);
  const deg = filmedDeg(n, STEP_LESS);
  const o3 = 1 - k(t, s3, 0.2), o2 = k(t, s3, 0.2);
  const glowB = k(t, rueda, 0.3) * (1 - k(t, rueda + 0.9, 0.6));
  const vf = k(t, camW, 0.4);
  const strip = mix(1100, 0, k(t, fotos, 0.7)) + mix(0, -1250, k(t, len - 0.9, 0.7, inOut));
  const carPos: V3 = [1.2 * S2, Y2 - WR * S2, -0.9 * S2];
  return (
    <AbsoluteFill>
      {o3 > 0 && (
        <AbsoluteFill style={{ opacity: o3 }}>
          <Stage cam={[0, 0, 5]} look={[0, 0, 0]} fov={40} sun={[-5, 8, 5]} rim="#ffb070" amb={0.25} shadows={false}>
            <group position={carPos} scale={S2}><CarBody o={1 - k(t, 0, 0.9)} /></group>
            <Rim3 R={R2} deg={deg} position={[0, Y2, 0]} />
            <pointLight position={[0, Y2, -0.8]} intensity={30 * glowB} color={CYAN} />
            {glowB > 0 && <Glow c={CYAN} s={R2 * 4} position={[0, Y2, -0.5]} o={0.8 * glowB} />}
          </Stage>
        </AbsoluteFill>
      )}
      <Svg>
        <Rim id="e1022-cam" cx={540} cy={900} R={260} deg={deg} o={o2} />
        <path d={cornersD(250, 665, 830, 1185, 56)} fill="none" stroke={AMBER} strokeOpacity={0.7 * vf} strokeWidth={6} strokeLinecap="round" />
        <g transform={`translate(${strip} 0)`} opacity={k(t, fotos, 0.3)}>
          <rect x={SX0 - 10} y={1240} width={5 * CELL_P} height={200} rx={6} fill="#030407" />
          {Array.from({ length: 20 }, (_, j) => (
            <g key={j}>
              <rect x={SX0 + j * 47.5} y={1243} width={22} height={8} rx={2} fill="#2a2f3a" />
              <rect x={SX0 + j * 47.5} y={1429} width={22} height={8} rx={2} fill="#2a2f3a" />
            </g>
          ))}
          {IDX.map((i) => (
            <g key={i}>
              <rect x={SX0 + i * CELL_P} y={1255} width={CELL} height={CELL} fill="#0e1420" />
              <Rim id={`e1022-cell${i}`} cx={SX0 + i * CELL_P + CELL / 2} cy={1340} R={70} deg={filmedDeg(n - 4 + i, STEP_LESS)} mark={AMBER} shadow={false} />
            </g>
          ))}
        </g>
      </Svg>
      <Clock n={n} o={vf} />
      <div style={{ opacity: 1 - k(t, s3 - 0.1, 0.3) }}>
        <Tag t={t} at={rueda + 0.2} x={540} y={1360} text="La rueda va bien" c={INK} align="center" size={32} />
      </div>
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 4 · Supuesto: 5 radios, reloj a 24 fps; la llanta aún no gira.
const Setup: React.FC<SceneProps> = ({ t, f, w, len }) => {
  const { fps } = useVideoConfig();
  const a5 = w(4, /^5$|cinco/) - 0.1, a24 = w(4, /24|veinticuatro/) - 0.1, aC = w(4, /cálculo/) - 0.1;
  const f24 = Math.round(a24 * fps);
  const n = f < f24 ? 0 : filmN(f - f24, fps);
  const end = k(t, len - 0.7, 0.5);
  const hi = IDX.map((i) => k(t, a5 + i * 0.12, 0.25) * (i === 0 ? 1 : 1 - end));
  return (
    <AbsoluteFill>
      <Svg><Rim id="e1022-set" cx={540} cy={980} R={300} deg={0} hi={hi} mark={AMBER} markO={end} /></Svg>
      <Clock n={n} o={k(t, 0, 0.4)} lab={k(t, a24, 0.4)} />
      <Tag t={t} at={a5 + 0.2} x={540} y={1330} text="5 radios" c={CHROME} align="center" size={32} />
      <Tag t={t} at={aC} x={70} y={540} text="Cálculo, no medición" c={MINT} size={30} />
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 5 · Fotograma a fotograma: mismos índices del muestreo, cada uno 0,6 s; giro exacto de 72° por paso.
const HOLD = 0.6;
const Step72: React.FC<SceneProps> = ({ t, w, len }) => {
  const a72 = w(5, /72|setenta/) - 0.1, aL = w(5, /lugar|hueco/) - 0.1;
  const tEnd = len - 0.9;
  const s = Math.floor(Math.max(0, Math.min(t, tEnd)) / HOLD);
  const deg = filmedDeg(s, STEP_FREEZE), prev = filmedDeg(s - 1, STEP_FREEZE);
  const tr = k(t, len - 0.7, 0.6, inOut);
  const cx = mix(540, 790, tr), cy = mix(980, 960, tr), R = mix(300, 200, tr);
  const fade = 1 - k(t, tEnd, 0.3);
  const oArc = k(t, a72, 0.4) * fade, oL = k(t, aL, 0.4) * fade, oG = s > 0 ? fade : 0;
  const A0 = -90 + deg; // ángulo SVG del radio marcado
  const rA = R + 24;
  const [ax, ay] = pol(cx, cy, rA, A0), [bx, by] = pol(cx, cy, rA, A0 + PITCH);
  const tick = (a: number) => { const [x0, y0] = pol(cx, cy, R + 8, a), [x1, y1] = pol(cx, cy, R + 42, a); return `M ${x0} ${y0} L ${x1} ${y1}`; };
  const [lx, ly] = pol(cx, cy, R + 60, A0 + PITCH / 2);
  const [gx, gy] = pol(cx, cy, 0.7 * R, -90 + prev);
  const [nx, ny] = pol(cx, cy, 0.7 * R, A0 + PITCH);
  return (
    <AbsoluteFill>
      <Svg>
        <Rim id="e1022-s72" cx={cx} cy={cy} R={R} deg={deg} mark={AMBER} markO={fade} />
        {oG > 0 && (
          <g opacity={oG}>
            <g transform={`rotate(${prev} ${cx} ${cy})`}>
              {IDX.map((i) => <path key={i} d={spokeD(cx, cy, R)} transform={`rotate(${i * PITCH} ${cx} ${cy})`} fill="none" stroke={CHROME} strokeOpacity={0.22} strokeWidth={4} />)}
            </g>
            <circle cx={gx} cy={gy} r={0.06 * R} fill="none" stroke={AMBER} strokeOpacity={0.45} strokeWidth={4} />
          </g>
        )}
        {oL > 0 && (
          <g opacity={oL}>
            <path d={spokeD(cx, cy, R)} transform={`rotate(${deg + PITCH} ${cx} ${cy})`} fill="none" stroke={MINT} strokeWidth={5} strokeLinejoin="round" />
            <circle cx={nx} cy={ny} r={0.08 * R} fill="none" stroke={MINT} strokeWidth={4} strokeDasharray="8 7" />
          </g>
        )}
        {oArc > 0 && (
          <g opacity={oArc}>
            <path d={`M ${ax} ${ay} A ${rA} ${rA} 0 0 1 ${bx} ${by}`} fill="none" stroke={MINT} strokeWidth={5} strokeLinecap="round" />
            <path d={`${tick(A0)} ${tick(A0 + PITCH)}`} stroke={MINT} strokeWidth={4} strokeLinecap="round" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontFamily={SANS} fontWeight={800} fontSize={56} fill={MINT} style={{ fontVariantNumeric: "tabular-nums" }}>72°</text>
          </g>
        )}
      </Svg>
      <Clock n={s} o={1} lab={1} />
      <Tag t={t} at={-1} x={70} y={540} text="Cálculo, no medición" c={MINT} size={30} />
      <Label x={540} y={1460} text="FOTOGRAMA A FOTOGRAMA" c={INK} size={26} o={k(t, 0.1, 0.4) * fade} />
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 6 · Real frente a vídeo a 72° por fotograma: la filmada (muestreo real a 24 fps) se ve quieta.
const Frozen: React.FC<SceneProps> = ({ t, f, w, len }) => {
  const { fps } = useVideoConfig();
  const a48 = w(6, /4,8|cuatro/) - 0.1, aQ = w(6, /quieta/) - 0.1;
  const n = filmN(f, fps);
  const vdeg = filmedDeg(n, STEP_FREEZE);
  const out = k(t, len - 0.7, 0.6, inOut);
  return (
    <AbsoluteFill>
      <Svg>
        <Rim id="e1022-fr" cx={290} cy={960} R={200} mark={CYAN} blur={{ at: (tt) => realDeg(tt, STEP_FREEZE), t, fps }} />
        <ArcArrow cx={290} cy={960} r={222} a0={-150} span={110} cw c={CYAN} sw={8} />
        <Rim id="e1022-fv" cx={790} cy={960} R={200} deg={vdeg} />
      </Svg>
      <Label x={290} text="REAL" c={CYAN} />
      <Label x={790} text="VÍDEO · 24 FPS" c={AMBER} />
      <Clock n={n} o={1} lab={1} />
      <Tag t={t} at={-1} x={70} y={540} text="Cálculo, no medición" c={MINT} size={30} />
      <Tag t={t} at={aQ} x={790} y={690} text="Parece quieta" c={AMBER} align="center" size={30} />
      <AbsoluteFill style={{ translate: `0 ${mix(0, 160, out)}px`, opacity: 1 - out }}>
        <Stat t={t} at={a48} from={4.8} to={4.8} decimals={1} sub="vueltas/s" y={1250} size={150} c={CHROME} />
        {t >= a48 && <Label x={540} y={1455} text="72° por fotograma × 24 fps" c={MINT} size={26} o={k(t, a48 + 0.4, 0.4)} />}
      </AbsoluteFill>
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 7 · Algo menos: retrocede; algo más: avanza despacio. El sentido lo decide apparent(step).
const LessMore: React.FC<SceneProps> = ({ t, f, w, len }) => {
  const { fps } = useVideoConfig();
  const aM = w(7, /más/) - 0.05;
  const nC = filmN(Math.round(aM * fps), fps);
  const n = filmN(Math.min(f, Math.round((len - 0.7) * fps)), fps); // al final el reloj y la llanta se congelan
  const more = n >= nC;
  const step = more ? STEP_MORE : STEP_LESS;
  const vdeg = more ? filmedDeg(n, STEP_MORE, nC, filmedDeg(nC, STEP_LESS)) : filmedDeg(n, STEP_LESS);
  const realAt = (tt: number) => (tt < aM ? realDeg(tt, STEP_LESS) : realDeg(aM, STEP_LESS) + realDeg(tt - aM, STEP_MORE));
  const back = apparent(step) < 0;
  const end = k(t, len - 0.7, 0.6, inOut);
  const rcx = mix(290, 540, end), ro = 1 - k(t, len - 0.45, 0.45);
  const vo = 1 - end;
  return (
    <AbsoluteFill>
      <Svg>
        <Rim id="e1022-lr" cx={rcx} cy={960} R={200} mark={CYAN} o={ro} blur={{ at: realAt, t, fps }} />
        <ArcArrow cx={rcx} cy={960} r={222} a0={-150} span={110} cw c={CYAN} sw={8} o={ro} />
        <Rim id="e1022-lv" cx={790} cy={960} R={200} deg={vdeg} mark={AMBER} o={vo} />
        {back
          ? <ArcArrow cx={790} cy={960} r={222} a0={-40} span={110} cw={false} c={ROSE} sw={8} o={vo} />
          : <ArcArrow cx={790} cy={960} r={222} a0={-150} span={110} cw c={AMBER} sw={8} o={vo} />}
      </Svg>
      <Label x={290} text="REAL" c={CYAN} o={vo} />
      <Label x={790} text="VÍDEO · 24 FPS" c={AMBER} o={vo} />
      <Label x={790} y={1240} text={back ? "algo menos de 72°" : "algo más de 72°"} c={MINT} size={26} o={vo} />
      <Clock n={n} o={1} lab={1} />
      <Tag t={t} at={-1} x={70} y={540} text="Cálculo, no medición" c={MINT} size={30} />
      <div style={{ opacity: back ? vo : 0 }}>
        <Tag t={t} at={0.2} x={790} y={690} text="Retrocede" c={ROSE} align="center" size={30} />
      </div>
      <div style={{ opacity: back ? 0 : vo }}>
        <Tag t={t} at={aM} x={790} y={690} text="Avanza despacio" c={AMBER} align="center" size={30} />
      </div>
      <Source t={t} at={0.3} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 8 · Purves et al., PNAS, 1996: tarjeta de revista sin texto inventado; el año entra con muelle.
const Purves: React.FC<SceneProps> = ({ t, w, len }) => {
  const a96 = w(8, /1996|mil/) - 0.1, aP = w(8, /Purves/) - 0.1;
  const s = useSpring(t, a96, 12);
  const pin = k(t, 0, 0.8);
  const out = k(t, len - 0.7, 0.6, inOut);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 190, top: 760, width: 700, height: 480, borderRadius: 18, background: "rgba(242,244,248,0.92)", boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
        translate: `0 ${mix(30, 0, pin) - 90 * out}px`, opacity: pin * (1 - out), padding: "44px 60px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: 6, color: "#11131a", lineHeight: 1 }}>PNAS</div>
        {[560, 600, 520, 580, 470, 330].map((wd, i) => (
          <div key={i} style={{ width: wd, height: 22, borderRadius: 11, background: i === 0 ? "#aeb4c0" : "#c9ced8", marginTop: i === 0 ? 40 : 26 }} />
        ))}
      </div>
      {s > 0 && (
        <div style={{ position: "absolute", left: 540, top: 540, translate: "-50% 0", scale: `${s}`, opacity: k(t, a96, 0.25) * (1 - out), fontFamily: SANS, fontWeight: 900, fontSize: 230,
          letterSpacing: -8, lineHeight: 0.9, color: CHROME, textShadow: `0 0 60px ${CHROME}44`, fontVariantNumeric: "tabular-nums" }}>1996</div>
      )}
      <div style={{ opacity: 1 - out }}>
        <Tag t={t} at={aP + 0.1} x={540} y={1300} text="Purves y su equipo" c={INK} align="center" size={32} />
      </div>
      <Source t={t} at={0.3} text="Purves et al., PNAS, 1996" />
    </AbsoluteFill>
  );
};

// 9-10 · Luz continua: lámpara de haz constante; ilusión parecida y causa sin resolver (sin ilustrar ningún mecanismo).
const Continuous: React.FC<SceneProps> = ({ t, w, len }) => {
  const { fps } = useVideoConfig();
  const aC = w(9, /continua/) - 0.1, aI = w(9, /ilusión/) - 0.1, aCa = w(10, /causa/) - 0.1;
  const end = 1 - k(t, len - 0.7, 0.5);
  const q = useSpring(t, aCa, 14);
  const pl = k(t, aC, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        <defs>
          <linearGradient id="e1022-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={CYAN} stopOpacity={0.12} /><stop offset="1" stopColor={CYAN} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        {pl > 0 && (
          <g opacity={pl}>
            <path d="M 170 735 L 205 705 L 930 1010 L 600 1380 Z" fill="url(#e1022-beam)" />
            <path d="M 0 690 L 118 690" stroke={CHROME_D} strokeWidth={8} strokeLinecap="round" />
            <g transform="rotate(38 140 705)">
              <rect x={100} y={680} width={80} height={50} rx={14} fill={CHROME_D} />
              <rect x={168} y={688} width={14} height={34} rx={4} fill={CYAN} opacity={0.9} />
            </g>
          </g>
        )}
        <Rim id="e1022-ct" cx={540} cy={1000} R={280} mark={CYAN} blur={{ at: (tt) => realDeg(tt, STEP_FREEZE), t, fps }} />
        <ArcArrow cx={540} cy={1000} r={304} a0={-145} span={110} cw c={CYAN} sw={8} />
        <ArcArrow cx={540} cy={1000} r={324} a0={150} span={120} cw={false} c={ROSE} sw={7} dash o={0.7 * k(t, aI, 0.4) * end} />
      </Svg>
      <Tag t={t} at={aC} x={70} y={560} text="Luz continua" c={CYAN} size={30} />
      <div style={{ opacity: end }}>
        <Tag t={t} at={aI + 0.2} x={540} y={1360} text="Ilusión parecida" c={ROSE} align="center" size={30} />
        <Tag t={t} at={aCa + 0.2} x={540} y={1430} text="Causa sin resolver" c={INK} align="center" size={30} />
      </div>
      {q > 0 && (
        <div style={{ position: "absolute", left: 900, top: 760, translate: "-50% -50%", scale: `${q}`, opacity: 0.85 * end, fontFamily: SANS, fontWeight: 900, fontSize: 220, lineHeight: 1, color: INK }}>?</div>
      )}
      <Note t={t} />
      <Source t={t} at={0.3} text="Purves et al., PNAS, 1996" />
    </AbsoluteFill>
  );
};

// 11 · Cierre: el coche con ruedas que giran de verdad a 1 vuelta/s (12° por fotograma de 30 fps, sin aliasing).
const LOOK9: V3 = [-0.4, 0.4, 0.3];
const Close: React.FC<SceneProps> = ({ t, w, len }) => {
  const p = k(t, 0, len, inOut);
  const cam: V3 = [mix(0.4, 1.2, p), mix(0.45, 0.7, p), mix(6.4, 8.2, p)];
  const deg = realDeg(t, 15); // 15° por fotograma filmado × 24 = 360°/s
  const off = roadOff(deg);
  const av = w(11, /avanza/) - 0.1, mi = w(11, /vemos|mira/) - 0.1;
  const wp = project(cam, LOOK9, REAR_W, WR * CAR_S);
  const cl = k(t, mi, 0.8, inOut);
  const hs = mix(wp.r * 3.2, wp.r * 1.55, cl);
  const fade = k(t, len - 0.6, 0.6);
  return (
    <AbsoluteFill>
      <Stage cam={cam} look={LOOK9} fov={FOV} sun={[-5, 8, 5]} rim="#ffb070" amb={0.25}>
        <fog attach="fog" args={[BG.mid, 6, 22]} />
        <CarScene deg={deg} off={off} />
      </Stage>
      <Svg>
        <ArcArrow cx={wp.x} cy={wp.y} r={wp.r * 1.45} a0={-150} span={120} cw c={CYAN} sw={8} o={k(t, av, 0.4)} />
        <path d={cornersD(wp.x - hs, wp.y - hs, wp.x + hs, wp.y + hs, hs * 0.35)} fill="none" stroke={AMBER} strokeOpacity={0.7 * k(t, mi, 0.3)} strokeWidth={6} strokeLinecap="round" />
      </Svg>
      <Note t={t} />
      <Source t={t} at={0.3} text="Cálculo: 5 radios, 24 fps · Purves et al., PNAS, 1996" />
      <AbsoluteFill style={{ background: BG.top, opacity: fade }} />
    </AbsoluteFill>
  );
};

const SCENES: SceneDef[] = [
  { from: 0, C: Hook },
  { from: 2, C: CameraScene },
  { from: 4, C: Setup },
  { from: 5, C: Step72 },
  { from: 6, C: Frozen },
  { from: 7, C: LessMore },
  { from: 8, C: Purves },
  { from: 9, C: Continuous },
  { from: 11, C: Close },
];
// Captions parte por espacios: claves de una sola palabra. clean("72°") = "72" y clean("4,8") = "48".
const KEYS = ["llantas", "revés", "vídeo", "retroceder", "cámara", "sueltas", "5", "radios", "24", "fps", "cálculo", "72°", "lugar", "4,8", "quieta", "retrocede", "despacio", "1996", "purves", "pnas", "luz", "continua", "resuelta"];

export const id = "2026-10-22";
const E20261022: React.FC<CurioProps> = (p) => <Reel {...p} scenes={SCENES} keys={KEYS} accent={AMBER} bg={BG} />;
export default E20261022;
