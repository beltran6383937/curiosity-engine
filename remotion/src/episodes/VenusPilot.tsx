// Piloto CURIOSITY ENGINE · Venus: un giro dura más que su año. Guion, datos y fuentes: episodes/venus-pilot/episode.json.
// Datos (NASA): rotación sideral 243,02 d (retrógrada), órbita 224,70 d, día solar 116,75 d.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, random } from "remotion";
import { Reel, Stage, Tag, Stat, Source, k, mix, inOut, useSpring, useEarth, SANS, type CurioProps, type SceneProps, type SceneDef } from "../kit";
import { Planet, Sun, Atmosphere, Arc, SpinArrow, Stars, planetTexture, type Palette } from "../space";
import { Glow } from "../kit";

const ROT = 243.02, ORB = 224.7, SOL = 116.75;
const GOLD = "#ffc86b", CYAN = "#7fd6ff", ROSE = "#ff7a6b";
const BG = { top: "#04030a", mid: "#120d22", glow: "#2c1f3a" };
const VENUS: Palette = ["#b98a52", "#d6b27a", "#e9cf9c", "#f6e6c2"]; // Venus en luz visible: crema pálido, casi sin rasgos (no rayado como Júpiter)
const useVenus = () => planetTexture(7, VENUS, 0.28);

// Tramo de órbita centrada en el Sol S que pasa por el planeta P (p = 0..1 dibuja el tramo)
const OrbitThrough: React.FC<{ S: [number, number, number]; P: [number, number, number]; p: number; c: string; span?: number }> = ({ S, P, p, c, span = 1.1 }) => {
  const geo = useMemo(() => {
    const s = new THREE.Vector3(...S), d = new THREE.Vector3(...P).sub(s), R = d.length(), u = d.normalize();
    const n = new THREE.Vector3().crossVectors(u, new THREE.Vector3(0, 1, 0)).normalize();
    const w = n.clone(); // perpendicular horizontal: plano de la órbita casi horizontal
    const a0 = -span * 0.75, a1 = a0 + span * Math.max(0.002, p);
    const pts = Array.from({ length: 80 }, (_, i) => { const a = a0 + (a1 - a0) * (i / 79); return s.clone().add(u.clone().multiplyScalar(Math.cos(a) * R)).add(w.clone().multiplyScalar(Math.sin(a) * R)); });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.03, 8, false);
  }, [S[0], S[1], S[2], P[0], P[1], P[2], p, span]);
  return <mesh geometry={geo}><meshBasicMaterial color={c} transparent opacity={0.85} toneMapped={false} /></mesh>;
};

const Num: React.FC<{ v: string; x: number; y: number; c: string; size?: number; o?: number; sub?: string }> = ({ v, x, y, c, size = 120, o = 1, sub }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", textAlign: "center", fontFamily: SANS, opacity: o }}>
    <div style={{ fontSize: size, fontWeight: 900, color: c, letterSpacing: -size * 0.04, lineHeight: 0.95, textShadow: `0 0 50px ${c}55` }}>{v}</div>
    {sub && <div style={{ fontSize: size * 0.24, fontWeight: 750, color: "#e8e3f5", letterSpacing: 3, textTransform: "uppercase", marginTop: 10 }}>{sub}</div>}
  </div>
);

// 0-1 · Gancho: Venus sale de la oscuridad; aparecen el giro (sobre sí mismo) y la órbita (alrededor del Sol)
const Hook: React.FC<SceneProps> = ({ t, w, len }) => {
  const tex = useVenus();
  const spin = w(0, /girar/), orbit = w(0, /vuelta/);
  const z = mix(15, 10.5, k(t, 0, len, inOut));
  const light = mix(0.45, 1, k(t, 0, 1.6));
  return (
    <AbsoluteFill>
      <Stage cam={[0, 0.6, z]} look={[0, -0.1, 0]} sun={[-14, 4, 6]} amb={mix(0, 0.05, light)} env={false} shadows={false}>
        <Stars t={t} />
        <Sun r={0.32} position={[-2.2, 3.1, -7]} o={light} />
        <directionalLight position={[-14, 4, 6]} intensity={mix(0, 2.6, light)} />
        <group position={[0, -0.1, 0]} rotation={[0.38, 0, 0.05]}>
          <Planet r={1.45} tex={tex} rot={-t * 0.05 + 1.2} atmo="#ffd59a" />
          {t > spin && <group rotation={[0.42, 0, 0]}><SpinArrow r={1.9} dir={-1} c={GOLD} p={k(t, spin, 0.7)} span={1.8} start={0.9} /></group>}
        </group>
        {t > orbit && <OrbitThrough S={[-2.2, 3.1, -7]} P={[0, -0.1, 0]} p={k(t, orbit, 1.4)} c={CYAN} />}
      </Stage>
      <Tag t={t} at={0.6} x={540} y={1440} text="Venus" c={GOLD} align="center" />
      {t > w(1, /NASA/) - 0.2 && <Source t={t} at={w(1, /NASA/) - 0.2} text="Datos: NASA · Planetary Fact Sheet" />}
    </AbsoluteFill>
  );
};

// 2-4 · Comparación: a la izquierda gira sobre sí mismo, a la derecha da la vuelta al Sol, con el mismo reloj.
const Compare: React.FC<SceneProps> = ({ t, w, line }) => {
  const tex = useVenus();
  const t0 = 0.3, t1 = Math.max(t0 + 2, w(4, /año/) - 0.1); // el reloj llega a 224,7 días justo cuando dice "año"
  const day = mix(0, ORB, k(t, t0, t1 - t0, inOut));
  const rotP = day / ROT, orbP = day / ORB;
  const done = orbP >= 0.999;
  const a243 = w(2, /243/) - 0.2, a225 = w(3, /225/) - 0.2;
  const pulse = done ? 1 + 0.06 * Math.sin((t - t1) * 9) * Math.exp(-(t - t1) * 2) : 1;
  return (
    <AbsoluteFill>
      <Stage cam={[0, 0, 14]} look={[0, 0, 0]} sun={[-10, 3, 8]} amb={0.08} env={false} shadows={false}>
        <Stars t={t} />
        <directionalLight position={[-10, 3, 8]} intensity={2.4} />
        {/* izquierda: giro sobre sí mismo (retrógrado), con un marcador en el ecuador */}
        <group position={[-1.45, -0.1, 0]}>
          <group rotation={[0.25, 0, 0]}>
            <Planet r={0.82} tex={tex} rot={-rotP * Math.PI * 2}>
              <mesh position={[0, 0, 0.84]}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color={GOLD} toneMapped={false} /></mesh>
              <mesh position={[0, 0, 0.84]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, 0.25, 8]} /><meshBasicMaterial color={GOLD} toneMapped={false} /></mesh>
            </Planet>
          </group>
          <Arc r={1.12} p={1} c="#ffffff" w={0.03} o={0.12} />
          <Arc r={1.12} p={rotP} c={GOLD} w={0.07} cw />
        </group>
        {/* derecha: vuelta al Sol (prograda), órbita vista en perspectiva */}
        <group position={[1.45, -0.1, 0]}>
          <group rotation={[1.05, 0, 0]}>
            <Arc r={1.12} p={1} c="#ffffff" w={0.025} o={0.14} />
            <Arc r={1.12} p={orbP} c={CYAN} w={0.06} />
            <Planet r={0.16} tex={tex} rot={-rotP * Math.PI * 2} position={[Math.cos(Math.PI / 2 + orbP * Math.PI * 2) * 1.12, Math.sin(Math.PI / 2 + orbP * Math.PI * 2) * 1.12, 0]} />
          </group>
          <Sun r={0.2} position={[0, 0, 0]} />
        </group>
      </Stage>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: SANS, color: "#efeaf8", opacity: k(t, t0, 0.3) }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 5, opacity: 0.7 }}>DÍAS TERRESTRES</div>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -3, fontVariantNumeric: "tabular-nums", scale: `${pulse}` }}>{Math.round(day)}</div>
      </div>
      <Num v="243" sub="1 giro" x={268} y={1235} c={GOLD} size={110} o={k(t, a243, 0.35)} />
      <Num v="225" sub="1 vuelta al Sol" x={812} y={1235} c={CYAN} size={110} o={k(t, a225, 0.35)} />
      {done && <Tag t={t} at={t1} x={812} y={1392} text="Año completo" c={CYAN} align="center" size={28} solid />}
      {done && <Tag t={t} at={t1 + 0.25} x={268} y={1392} text={`${Math.round((ORB / ROT) * 100)} % del giro`} c={GOLD} align="center" size={28} />}
      <Source t={t} at={t0} text="Esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 5-6 · Desde la superficie: de amanecer a amanecer, ~117 días (el Sol sería un resplandor tras las nubes)
const Surface: React.FC<SceneProps> = ({ t, w, len }) => {
  const a117 = w(6, /117|ciento/) - 0.25;
  const sp = k(t, 0.2, Math.max(2, len - 0.4), inOut); // un arco del cielo durante la escena
  const sx = mix(-2.6, 2.6, sp), sy = -1.6 + Math.sin(sp * Math.PI) * 4.2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #2a1a12 0%, #8a4a1f 46%, #e0a05a 59.5%, #3b2416 60%, #1c120c 100%)" }} />
      <Stage cam={[0, 0.6, 9]} look={[0, 0.9, 0]} sun={[sx, sy + 2, 4]} amb={0.25} env={false} shadows={false}>
        <group position={[sx, sy + 1.2, -6]}>
          <Glow c="#fff4dc" s={1.4} o={0.9} />
          <Glow c="#ffd9a0" s={4.5} o={0.5} />
        </group>
        {/* llanura volcánica: rocas bajas y planas */}
        {Array.from({ length: 26 }, (_, i) => {
          const zz = 2.5 - random(`rz${i}`) * 9, x = (random(`rx${i}`) - 0.5) * (3.2 + (2.5 - zz) * 0.55), s = 0.07 + random(`rs${i}`) * 0.2;
          return <mesh key={i} position={[x, -1.55 + s * 0.12, zz]} scale={[s * 1.7, s * 0.45, s * 1.2]} rotation={[0, random(`rr${i}`) * 6, 0]}><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial color={i % 3 ? "#5a3a26" : "#6e4a30"} roughness={1} flatShading /></mesh>;
        })}
      </Stage>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1148, height: 6, background: "linear-gradient(90deg, transparent, #ffd59a88, transparent)", opacity: 0.6 }} />
      <Stat t={t} at={a117} to={117} y={1180} c={GOLD} size={220} sub="días de amanecer a amanecer" />
      <Tag t={t} at={0.4} x={540} y={760} text="Un día en Venus" c={GOLD} align="center" size={30} />
      <Source t={t} at={a117} text="≈ 116,75 días · NASA" />
    </AbsoluteFill>
  );
};

// 7 · Por qué: giro y órbita se suman (esquema 2D visto desde el norte)
const Why: React.FC<SceneProps> = ({ t, w }) => {
  const sum = w(7, /suman/) - 0.15;
  const cx = 540, cy = 1080, R = 330;
  const th = mix(-0.35, 0.9, k(t, 0.2, 4, inOut)); // posición en la órbita (antihoraria)
  const vx = cx + Math.cos(th) * R, vy = cy - Math.sin(th) * R;
  const spin = t * 2.2; // en SVG (y hacia abajo) un ángulo creciente gira en sentido horario: retrógrado
  const pa = k(t, 0.5, 0.6), pb = k(t, 1.4, 0.6), ps = k(t, sum, 0.4);
  const arc = (r: number, a0: number, a1: number, x = cx, y = cy) => {
    const p0 = [x + Math.cos(a0) * r, y - Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, y - Math.sin(a1) * r];
    return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 ${a1 > a0 ? 0 : 1} ${p1[0]} ${p1[1]}`;
  };
  return (
    <AbsoluteFill>
      <Stage cam={[0, 0, 14]} look={[0, 0, 0]} shadows={false} env={false}><Stars t={t} /></Stage>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="sol"><stop offset="0" stopColor="#fff4d8" /><stop offset="0.35" stopColor="#ffc25e" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
          <radialGradient id="ven" cx="0.35" cy="0.35"><stop offset="0" stopColor="#fbeccb" /><stop offset="0.6" stopColor="#d9a35a" /><stop offset="1" stopColor="#7a4a22" /></radialGradient>
          <marker id="hc" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={CYAN} /></marker>
          <marker id="hg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={GOLD} /></marker>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={3} strokeDasharray="6 14" />
        <circle cx={cx} cy={cy} r={150} fill="url(#sol)" />
        <circle cx={cx} cy={cy} r={46} fill="#fff4d8" />
        {/* flecha de la órbita: antihoraria */}
        <path d={arc(R + 70, th - 0.05, th - 0.05 + 0.9 * pa)} fill="none" stroke={CYAN} strokeWidth={10} strokeLinecap="round" markerEnd={pa > 0.05 ? "url(#hc)" : undefined} opacity={pa} />
        <g transform={`translate(${vx} ${vy})`}>
          <circle r={58} fill="url(#ven)" />
          {/* marcador en la superficie: muestra el giro */}
          <line x1={0} y1={0} x2={Math.cos(spin) * 58} y2={Math.sin(spin) * 58} stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* flecha del giro: horaria (al revés que la órbita) */}
        <path d={arc(96, th + 1.9, th + 1.9 - 2.2 * pb, vx, vy)} fill="none" stroke={GOLD} strokeWidth={9} strokeLinecap="round" markerEnd={pb > 0.05 ? "url(#hg)" : undefined} opacity={pb} />
      </svg>
      <div style={{ position: "absolute", top: 1440, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 28, fontFamily: SANS, fontWeight: 850, fontSize: 40, letterSpacing: 3 }}>
        <span style={{ color: CYAN, opacity: pa }}>ÓRBITA</span>
        <span style={{ color: "#fff", fontSize: 64, opacity: ps, scale: `${mix(0.4, 1, ps)}` }}>+</span>
        <span style={{ color: GOLD, opacity: pb }}>GIRO</span>
      </div>
      <Source t={t} at={sum} text="1/243 + 1/224,7 = 1/116,75 · esquema, no a escala" />
    </AbsoluteFill>
  );
};

// 8 · Gira al revés: Tierra frente a Venus, vistas desde el mismo lado
const Retro: React.FC<SceneProps> = ({ t, w }) => {
  const tex = useVenus();
  const earth = useEarth(96);
  const rev = w(8, /revés/) - 0.2;
  const sE = useSpring(t, 0.1, 14), sV = useSpring(t, 0.35, 14);
  return (
    <AbsoluteFill>
      <Stage cam={[0, 1.2, 13.5]} look={[0, -0.1, 0]} sun={[-6, 5, 9]} amb={0.12} env={false} shadows={false}>
        <Stars t={t} />
        <directionalLight position={[-6, 5, 9]} intensity={2.2} />
        <group position={[-1.3, 0, 0]} scale={sE * 0.85} rotation={[0.18, 0, 0]}>
          <group rotation={[0, t * 1.1, 0]}><mesh geometry={earth} scale={0.95}><meshStandardMaterial vertexColors roughness={0.8} /></mesh></group>
          <Atmosphere r={0.95} c="#8fd0ff" />
          <SpinArrow r={1.25} dir={1} c={CYAN} p={k(t, 0.6, 0.6)} span={1.7} start={-0.85} />
        </group>
        <group position={[1.3, 0, 0]} scale={sV * 0.85} rotation={[0.18, 0, 0]}>
          <Planet r={0.95} tex={tex} rot={-t * 1.1} atmo="#ffd59a" />
          <SpinArrow r={1.25} dir={-1} c={ROSE} p={k(t, rev, 0.6)} span={1.7} start={0.85} />
        </group>
      </Stage>
      <Tag t={t} at={0.3} x={268} y={1300} text="Tierra" c={CYAN} align="center" size={30} />
      <Tag t={t} at={0.55} x={812} y={1300} text="Venus" c={ROSE} align="center" size={30} />
      <Tag t={t} at={rev + 0.3} x={812} y={1400} text="Al revés" c={ROSE} align="center" size={28} solid />
    </AbsoluteFill>
  );
};

// 9 · El Sol sale por el oeste y se pone por el este
const Sunrise: React.FC<SceneProps> = ({ t, w }) => {
  const ow = w(9, /oeste/) - 0.6, es = w(9, /^este/);
  const sp = k(t, ow, Math.max(1.2, es - ow + 0.4), inOut);
  const x = mix(150, 930, sp), y = 1060 - Math.sin(sp * Math.PI) * 420;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, #1c1020 0%, #6a3a24 ${mix(40, 50, Math.sin(sp * Math.PI))}%, #d08a48 62%, #3b2416 63%, #160e09 100%)` }} />
      <div style={{ position: "absolute", left: x - 160, top: y - 160, width: 320, height: 320, borderRadius: 999, background: "radial-gradient(circle, #fff3d6 0%, #ffd27acc 18%, #ff9a3c44 45%, transparent 70%)", opacity: k(t, ow, 0.4) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1066, height: 900, background: "linear-gradient(180deg, #3b2416, #120b07)" }} />
      <div style={{ position: "absolute", top: 1110, left: 70, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: GOLD, letterSpacing: 4, opacity: k(t, ow, 0.4) }}>OESTE</div>
      <div style={{ position: "absolute", top: 1110, right: 70, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: "#efe6da", letterSpacing: 4, opacity: k(t, es - 0.4, 0.4) }}>ESTE</div>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.55 * k(t, ow + 0.3, 0.5) }}>
        <path d="M 150 1060 Q 540 220 930 1060" fill="none" stroke="#ffe2a8" strokeWidth={4} strokeDasharray="4 18" strokeLinecap="round" />
      </svg>
      <Tag t={t} at={0.2} x={540} y={1300} text="En Venus" c={GOLD} align="center" size={30} />
    </AbsoluteFill>
  );
};

// 10 · Cierre: Venus a contraluz
const Close: React.FC<SceneProps> = ({ t, len }) => {
  const tex = useVenus();
  const z = mix(9, 12, k(t, 0, len, inOut));
  return (
    <AbsoluteFill>
      <Stage cam={[0, 0, z]} look={[0, -0.3, 0]} sun={[6, 1.5, -8]} amb={0.03} env={false} shadows={false}>
        <Stars t={t} />
        <Sun r={0.5} position={[1.9, 1.6, -9]} />
        <directionalLight position={[6, 1.5, -8]} intensity={3} />
        <directionalLight position={[-4, 2, 6]} intensity={1.0} color="#b0a4ff" />
        <Planet r={1.5} tex={tex} rot={-t * 0.06 + 2.4} position={[0, 0.2, 0]} atmo="#ffcf8a" />
      </Stage>
      <div style={{ position: "absolute", top: 1330, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 150, letterSpacing: 18, color: "#f6e3c0", opacity: k(t, 0.6, 0.8), textShadow: "0 0 60px #ffb35a55" }}>VENUS</div>
    </AbsoluteFill>
  );
};

const SCENES: SceneDef[] = [
  { from: 0, C: Hook }, { from: 2, C: Compare }, { from: 5, C: Surface }, { from: 7, C: Why }, { from: 8, C: Retro }, { from: 9, C: Sunrise }, { from: 10, C: Close },
];
const KEYS = ["venus", "243", "225", "117", "nasa", "año", "giro", "revés", "oeste", "este", "suman"];

export const id = "venus-pilot";
const VenusPilot: React.FC<CurioProps> = (p) => (
  <Reel {...p} scenes={SCENES} keys={KEYS} accent={GOLD} bg={BG} music="music/venus-pilot.wav" musicVol={0.4} />
);
export default VenusPilot;
