// Kit de CURIOSITY ENGINE (copiado de pq-rrss/src/curio/kit.tsx, serie Curiosidades sin marca): 3D real con @remotion/three, voz tranquila del narrador y subtítulos
// palabra a palabra. Cada reel = guion (guiones/curioNN.voz.json) + escenas 3D que cambian al empezar ciertas frases.
// Regla de Remotion: nada se anima solo; todo sale de useCurrentFrame().
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, delayRender, continueRender, random } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Word = { w: string; s: number; e: number };
export type Line = { text: string; start: number; end: number; words?: Word[] };
export type CurioProps = { id: string; lines: Line[]; duration: number };
// t = segundos desde que empieza la escena; w(i, /palabra/) = cuándo suena esa palabra de la frase i (en tiempo de la escena)
export type SceneProps = { t: number; f: number; len: number; line: (i: number) => Line; w: (i: number, re: RegExp) => number };

export const SANS = "Hanken Grotesk, sans-serif";
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const out = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
// 0→1 entre a y a+d segundos
export const k = (t: number, a: number, d: number, e = out) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
// Escala con muelle que entra en `at` (segundos)
export const useSpring = (t: number, at: number, damping = 13) => {
  const { fps } = useVideoConfig();
  return t < at ? 0 : spring({ frame: (t - at) * fps, fps, config: { damping, mass: 0.7 } });
};

export const useFonts = () => {
  const [h] = useState(() => delayRender("fuentes"));
  useEffect(() => {
    const f = new FontFace("Hanken Grotesk", `url(${staticFile("fonts/hanken.woff2")})`, { weight: "100 900" });
    f.load().then((l) => { document.fonts.add(l); continueRender(h); });
  }, [h]);
};

// ---------- fondo ----------
export const Backdrop: React.FC<{ top: string; mid: string; glow: string }> = ({ top, mid, glow }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 52%, ${glow} 0%, ${mid} 45%, ${top} 100%)` }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grano"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 6} /></filter>
        <rect width="100%" height="100%" filter="url(#grano)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---------- 3D ----------
// Escenario: cámara, luz principal con sombra suave, contraluz de color y reflejos de estudio (sin descargar HDR).
export const Stage: React.FC<{ children: React.ReactNode; cam?: [number, number, number]; look?: [number, number, number]; fov?: number; rim?: string; shadows?: boolean; sun?: [number, number, number]; amb?: number; env?: boolean }> = ({ children, cam = [0, 1.5, 10], look = [0, 0.8, 0], fov = 40, rim = "#6fd3ff", shadows = true, sun = [5, 9, 6], amb = 0.35, env = true }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows={shadows} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: cam, fov, near: 0.1, far: 400 }} onCreated={({ camera }) => camera.lookAt(...look)}>
      <CamLook cam={cam} look={look} />
      <ambientLight intensity={amb} />
      <directionalLight position={sun} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={10}
        shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004} />
      <pointLight position={[-6, 3, -4]} intensity={40} color={rim} />
      {env && <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, -6]} scale={[12, 3, 1]} />
        <Lightformer intensity={1.2} color="#9cc4ff" position={[-6, 1, 3]} scale={[3, 8, 1]} />
        <Lightformer intensity={0.8} color="#ffd9b0" position={[6, 2, 3]} scale={[3, 6, 1]} />
      </Environment>}
      {children}
    </ThreeCanvas>
  );
};
// La cámara se mueve con props (cam/look) en cada fotograma.
const CamLook: React.FC<{ cam: [number, number, number]; look: [number, number, number] }> = ({ cam, look }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...cam);
  camera.lookAt(...look);
  return null;
};

// Material "arcilla barnizada": el sello visual de la serie.
export const Clay: React.FC<{ c: string; r?: number; emissive?: string; ei?: number; o?: number; metal?: number; vc?: boolean }> = ({ c, r = 0.42, emissive, ei = 0, o = 1, metal = 0, vc }) => (
  <meshPhysicalMaterial vertexColors={vc} color={c} roughness={r} metalness={metal} clearcoat={0.55} clearcoatRoughness={0.3} emissive={emissive ?? "#000"} emissiveIntensity={ei} transparent={o < 1} opacity={o} />
);
// Suelo invisible que solo recibe la sombra
export const Floor: React.FC<{ y?: number; o?: number; size?: number }> = ({ y = 0, o = 0.32, size = 30 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <shadowMaterial opacity={o} />
  </mesh>
);
// Partículas deterministas (polvo, estrellas, chispas)
export const Dust: React.FC<{ n: number; seed: string; spread: [number, number, number]; center?: [number, number, number]; size?: number; c?: string; drift?: number; t: number; o?: number }> = ({ n, seed, spread, center = [0, 0, 0], size = 0.04, c = "#bfe6ff", drift = 0.05, t, o = 0.9 }) => (
  <group position={center}>
    {Array.from({ length: n }, (_, i) => {
      const r = (s: string) => random(`${seed}${s}${i}`) - 0.5;
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + random(`${seed}tw${i}`) * 2) + i);
      return (
        <mesh key={i} position={[r("x") * spread[0], r("y") * spread[1] + Math.sin(t * 0.6 + i) * drift, r("z") * spread[2]]} scale={size * (0.5 + random(`${seed}s${i}`)) * tw}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={c} transparent opacity={o * tw} />
        </mesh>
      );
    })}
  </group>
);

// ---------- capas 2D ----------
// Subtítulos: grupos de hasta 3 palabras que cortan en signos de puntuación; la palabra que suena entra suave,
// las palabras clave (`keys`) llevan caja de color. Zona segura: arriba, lejos de los botones de Instagram.
export const Captions: React.FC<{ lines: Line[]; keys: string[]; accent: string; ink?: string; y?: number }> = ({ lines, keys, accent, ink = "#0b1022", y = 300 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const words = lines.flatMap((l) => l.words ?? []);
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length >= 3 || /[.,:;?!…]$/.test(w.w) || !next || next.s - w.e > 0.35) { groups.push(cur); cur = []; }
  });
  const g = groups.find((gr, i) => t >= gr[0].s - 0.05 && t < (groups[i + 1]?.[0].s ?? Infinity) - 0.05 && t < gr[gr.length - 1].e + 0.9);
  if (!g) return null;
  const clean = (x: string) => x.toLowerCase().replace(/[^a-z0-9áéíóúñü%]/g, "");
  const isKey = (w: string) => keys.some((k) => clean(w) === clean(k));
  return (
    <div style={{ position: "absolute", top: y, left: 70, right: 70, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 22px", fontFamily: SANS, fontSize: 76, lineHeight: 1.18, letterSpacing: -1 }}>
      {g.map((w, i) => {
        const p = k(t, w.s - 0.06, 0.22);
        const key = isKey(w.w);
        const said = t >= w.s - 0.06;
        return (
          <span key={i} style={{ opacity: said ? mix(0, 1, p) : 0.0, translate: `0 ${mix(18, 0, p)}px`, filter: `blur(${mix(6, 0, p)}px)`, fontWeight: key ? 850 : 650, color: key ? ink : "#f3f6ff",
            background: key ? accent : "transparent", padding: key ? "0 14px" : 0, borderRadius: 14, textShadow: key ? "none" : "0 4px 24px rgba(0,0,0,0.55)", scale: key ? `${mix(0.85, 1, p)}` : "1" }}>
            {w.w.replace(/[,;:]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

// Etiqueta infográfica: punto + texto en mayúsculas pequeñas, entra deslizando.
export const Tag: React.FC<{ t: number; at: number; x: number; y: number; text: string; c: string; align?: "left" | "center" | "right"; size?: number; solid?: boolean }> = ({ t, at, x, y, text, c, align = "left", size = 34, solid }) => {
  const p = k(t, at, 0.45);
  if (p <= 0) return null;
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: `${tx} ${mix(14, 0, p)}px`, opacity: p, fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 2, textTransform: "uppercase",
      color: solid ? "#0b1022" : c, background: solid ? c : "rgba(8,12,30,0.55)", border: `3px solid ${c}`, borderRadius: 999, padding: `${size * 0.32}px ${size * 0.7}px`, display: "flex", alignItems: "center", gap: size * 0.4, whiteSpace: "nowrap", backdropFilter: "blur(6px)" }}>
      {!solid && <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: 99, background: c, boxShadow: `0 0 ${size * 0.6}px ${c}` }} />}
      {text}
    </div>
  );
};

// Cifra grande que cuenta hacia su valor.
export const Stat: React.FC<{ t: number; at: number; to: number; from?: number; x?: number; y: number; c: string; suffix?: string; prefix?: string; size?: number; dur?: number; decimals?: number; sub?: string }> = ({ t, at, to, x = 540, y, c, suffix = "", prefix = "", size = 230, dur = 0.9, decimals = 0, sub, from = 0 }) => {
  const p = k(t, at, dur, Easing.bezier(0.22, 1, 0.36, 1));
  if (t < at) return null;
  const v = mix(from, to, p).toLocaleString("es-ES", { useGrouping: from === 0, minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", textAlign: "center", fontFamily: SANS, opacity: k(t, at, 0.25) }}>
      <div style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.04, color: c, lineHeight: 0.9, textShadow: `0 0 60px ${c}66` }}>{prefix}{v}{suffix}</div>
      {sub && <div style={{ fontSize: size * 0.2, fontWeight: 700, color: "#dfe6ff", letterSpacing: 3, textTransform: "uppercase", marginTop: 16, whiteSpace: "nowrap", opacity: k(t, at + 0.3, 0.4) }}>{sub}</div>}
    </div>
  );
};

export const Source: React.FC<{ text: string; t: number; at?: number }> = ({ text, t, at = 0 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 380, textAlign: "center", fontFamily: SANS, fontSize: 28, fontWeight: 600, color: "rgba(220,230,255,0.55)", letterSpacing: 1, opacity: k(t, at, 0.5) }}>{text}</div>
);

// Caja de comentario final ("Comenta …"), como la de la app: invita a responder.
export const CommentBox: React.FC<{ t: number; at: number; prompt: string; typed: string; accent: string }> = ({ t, at, prompt, typed, accent }) => {
  const s = useSpring(t, at, 15);
  if (s <= 0) return null;
  const n = Math.floor(k(t, at + 0.5, Math.max(0.6, typed.length * 0.07), Easing.linear) * typed.length);
  const caret = Math.floor(t * 2) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 1080, scale: `${s}`, background: "#f6f7fb", borderRadius: 36, padding: "36px 44px", fontFamily: SANS, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 34, fontWeight: 800, color: "#11131a", textAlign: "center", marginBottom: 26 }}>Comentarios</div>
      <div style={{ fontSize: 30, color: "#6b7080", marginBottom: 14 }}>{prompt}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid #e3e5ec", paddingTop: 22 }}>
        <span style={{ fontSize: 44, fontWeight: 800, color: "#11131a" }}>{typed.slice(0, n)}<span style={{ opacity: caret ? 1 : 0, color: accent }}>|</span></span>
        <span style={{ fontSize: 34, fontWeight: 800, color: accent, opacity: n >= typed.length ? 1 : 0.35 }}>Publicar</span>
      </div>
    </div>
  );
};

// ---------- montaje ----------
// Cada escena empieza al empezar la frase `from` y entra con un leve zoom + desenfoque (sin cortes secos).
export type SceneDef = { from: number; C: React.FC<SceneProps> };
export const Reel: React.FC<CurioProps & { scenes: SceneDef[]; keys: string[]; accent: string; bg: { top: string; mid: string; glow: string }; sfx?: { at: number; s: string; v?: number }[]; music?: string; musicVol?: number }> = ({ id, lines, duration, scenes, keys, accent, bg, sfx = [], music, musicVol = 0.5 }) => {
  useFonts();
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  const starts = scenes.map((s) => (s.from === 0 ? 0 : (lines[s.from]?.start ?? 0) - 0.12));
  const line = (i: number) => lines[i] ?? { text: "", start: 0, end: 0 };
  return (
    <AbsoluteFill style={{ background: bg.top }}>
      <Backdrop {...bg} />
      {scenes.map(({ C }, i) => {
        const a = Math.round(starts[i] * fps), b = Math.round((starts[i + 1] ?? duration) * fps);
        if (b <= a) return null;
        return (
          <Sequence key={i} from={a} durationInFrames={b - a + (i < scenes.length - 1 ? 8 : 0)} premountFor={10}>
            <SceneWrap fade={i > 0} out={i < scenes.length - 1 ? b - a : Infinity}>
              <C t={(f - a) / fps} f={f - a} len={(b - a) / fps} line={line} w={(li, re) => (line(li).words?.find((x) => re.test(x.w))?.s ?? line(li).start) - a / fps} />
            </SceneWrap>
          </Sequence>
        );
      })}
      <Captions lines={lines} keys={keys} accent={accent} />
      <Audio src={staticFile(`audio/${id}.mp3`)} />
      {music && <Audio src={staticFile(music)} volume={(fr) => musicVol * interpolate(fr, [0, 20, duration * fps - 45, duration * fps], [0, 1, 1, 0], clamp)} />}
      {starts.slice(1).map((s, i) => <Sequence key={`w${i}`} from={Math.max(0, Math.round((s - 0.15) * fps))} durationInFrames={30}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} /></Sequence>)}
      {sfx.map((x, i) => <Sequence key={`s${i}`} from={Math.round(x.at * fps)} durationInFrames={45}><Audio src={staticFile(`sfx/${x.s}.wav`)} volume={x.v ?? 0.12} /></Sequence>)}
    </AbsoluteFill>
  );
};
const SceneWrap: React.FC<{ children: React.ReactNode; fade: boolean; out: number }> = ({ children, fade, out: o }) => {
  const f = useCurrentFrame();
  const pin = fade ? interpolate(f, [0, 9], [0, 1], { ...clamp, easing: out }) : 1;
  const pout = Number.isFinite(o) ? interpolate(f, [o, o + 8], [1, 0], clamp) : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(pin, pout), scale: `${mix(1.06, 1, pin) * mix(0.97, 1, pout)}`, filter: pin < 1 ? `blur(${mix(10, 0, pin)}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

// ---------- piezas 3D reutilizables ----------
// Texto dentro del 3D: se dibuja en un canvas con la fuente de la serie y va como textura sobre un plano
// (determinista; troika/drei Text no llega a cargar en el render sin pantalla). Solo textos fijos.
const t3Fonts = new Map<number, Promise<void>>();
const loadT3 = (w: number) => {
  if (!t3Fonts.has(w)) t3Fonts.set(w, new FontFace(`T3-${w}`, `url(${staticFile(`fonts/hanken-${w}.ttf`)})`).load().then((l) => { document.fonts.add(l); }));
  return t3Fonts.get(w)!;
};
export const T3: React.FC<{ children: string; size?: number; c?: string; position?: [number, number, number]; rotation?: [number, number, number]; weight?: 800 | 500; anchorX?: "left" | "center" | "right"; o?: number }> = ({ children, size = 1, c = "#fff", position, rotation, weight = 800, anchorX = "center", o = 1 }) => {
  const advance = useThree((st) => st.advance);
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender("texto 3d"));
  useEffect(() => { loadT3(weight).then(() => setReady(true)); }, [weight]);
  const tex = useMemo(() => {
    if (!ready) return null;
    const px = 220, cv = document.createElement("canvas"), g = cv.getContext("2d")!;
    const font = `${px}px "T3-${weight}"`; g.font = font;
    const wpx = Math.ceil(g.measureText(children).width) + 40;
    cv.width = wpx; cv.height = Math.ceil(px * 1.3);
    g.font = font; g.fillStyle = c; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(children, wpx / 2, cv.height / 2 + px * 0.04);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return { t, aspect: wpx / cv.height };
  }, [ready, children, c, weight]);
  // Al renderizar, R3F solo pinta cuando cambia el fotograma: forzamos un pintado con el texto ya puesto.
  useEffect(() => { if (tex) { advance(performance.now()); continueRender(h); } }, [tex, advance, h]);
  if (!tex) return null;
  const w = size * 1.3 * tex.aspect;
  const dx = anchorX === "left" ? w / 2 : anchorX === "right" ? -w / 2 : 0;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[dx, 0, 0]}><planeGeometry args={[w, size * 1.3]} /><meshBasicMaterial map={tex.t} transparent opacity={o} depthWrite={false} toneMapped={false} /></mesh>
    </group>
  );
};

// Halo radial (sol, coma del cometa, bola de fuego). Sprite siempre de cara a la cámara.
const glowTex = new Map<string, THREE.Texture>();
const glow = (c: string) => {
  if (!glowTex.has(c)) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const g = cv.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, c); gr.addColorStop(0.25, c + "aa"); gr.addColorStop(0.6, c + "22"); gr.addColorStop(1, c + "00");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; glowTex.set(c, t);
  }
  return glowTex.get(c)!;
};
export const Glow: React.FC<{ c: string; s: number; position?: [number, number, number]; o?: number }> = ({ c, s, position, o = 1 }) => (
  <sprite position={position} scale={[s, s, 1]}>
    <spriteMaterial map={glow(c)} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} />
  </sprite>
);

// Roca irregular determinista (meteoroide, núcleo de cometa)
export const useRock = (seed: string, detail = 3, amp = 0.28, stretch: [number, number, number] = [1, 1, 1], speckle?: [string, string]) => useMemo(() => {
  const ico = new THREE.IcosahedronGeometry(1, detail); ico.deleteAttribute("normal"); ico.deleteAttribute("uv");
  const g = mergeVertices(ico); // vértices compartidos: superficie suave, no facetada
  const p = g.attributes.position; const v = new THREE.Vector3();
  const bumps = Array.from({ length: 9 }, (_, i) => new THREE.Vector3(random(`${seed}a${i}`) - 0.5, random(`${seed}b${i}`) - 0.5, random(`${seed}c${i}`) - 0.5).normalize());
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let d = 0; bumps.forEach((b, j) => { d += Math.max(0, v.dot(b)) ** 3 * (random(`${seed}d${j}`) - 0.45); });
    v.multiplyScalar(1 + d * amp * 2).multiply(new THREE.Vector3(...stretch));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  if (speckle) { // motas minerales: mezcla de dos colores por vértice
    const c0 = new THREE.Color(speckle[0]), c1 = new THREE.Color(speckle[1]), cols: number[] = [];
    for (let i = 0; i < p.count; i++) { const m = random(`${seed}m${i}`); const c = c0.clone().lerp(c1, m > 0.82 ? 1 : m * 0.35); cols.push(c.r, c.g, c.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  }
  g.computeVertexNormals(); return g;
}, [seed, detail, amp, stretch[0], stretch[1], stretch[2], speckle?.[0], speckle?.[1]]);

// Planeta Tierra estilizado: océano + continentes por ruido (colores por vértice, sin texturas descargadas)
export const useEarth = (detail = 48) => useMemo(() => {
  const g = new THREE.SphereGeometry(1, detail * 2, detail);
  const p = g.attributes.position; const cols: number[] = []; const v = new THREE.Vector3();
  const sea = new THREE.Color("#2f6fd6"), land = new THREE.Color("#5fbf7a"), ice = new THREE.Color("#eef4ff"), sand = new THREE.Color("#d9c27a");
  const n3 = (x: number, y: number, z: number) => Math.sin(x * 2.1 + Math.sin(y * 1.7)) * Math.cos(y * 2.3 + Math.sin(z * 1.9)) + 0.6 * Math.sin(z * 3.1 + x * 1.3) * Math.cos(x * 2.7 - y);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = n3(v.x * 1.6, v.y * 1.6, v.z * 1.6);
    const c = Math.abs(v.y) > 0.86 ? ice : n > 0.55 ? land : n > 0.42 ? sand : sea;
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); return g;
}, [detail]);

// Estrella de 5 puntas con volumen (la "estrella fugaz" de dibujo)
export const useStar = (r = 1, inner = 0.45, depth = 0.35) => useMemo(() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 6, curveSegments: 4 });
  g.center(); return g;
}, [r, inner, depth]);

// Personaje de arcilla sencillo (escala, mira al cielo)
export const Person: React.FC<{ position?: [number, number, number]; s?: number; c?: string; look?: number }> = ({ position, s = 1, c = "#f2b880", look = 0.5 }) => (
  <group position={position} scale={s}>
    <mesh position={[0, 0.55, 0]} castShadow><capsuleGeometry args={[0.22, 0.6, 8, 16]} /><Clay c={c} /></mesh>
    <mesh position={[0, 1.18, 0]} rotation={[-look, 0, 0]} castShadow><sphereGeometry args={[0.22, 32, 32]} /><Clay c="#ffd9b8" /></mesh>
  </group>
);

// Metadatos: tiempos de public/audio/<id>.json (scripts/alinear_voz.py); sin locución, tiempos estimados para previsualizar.
export const curioMeta = (id: string, script: string[]) => async (): Promise<{ props: CurioProps; durationInFrames: number }> => {
  let v: { duration: number; lines: Line[] };
  try { const r = await fetch(staticFile(`audio/${id}.json`)); if (!r.ok) throw new Error(); v = await r.json(); }
  catch {
    let t = 0;
    const lines = script.map((text) => { const words = text.split(" ").map((w) => { const d = 0.12 + w.length * 0.055; const x = { w, s: t, e: t + d }; t += d + 0.04; return x; }); const l = { text, start: words[0].s, end: t, words }; t += 0.35; return l; });
    v = { lines, duration: t + 0.6 };
  }
  return { props: { id, lines: v.lines, duration: v.duration + 0.4 }, durationInFrames: Math.round((v.duration + 0.4) * 30) };
};
