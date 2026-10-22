// Kit P&Q AI CONTENT ENGINE: mundo ilustrado (SVG en código), personajes con esqueleto, interfaces (llamada, WhatsApp,
// agenda, buscador), efectos (ondas, golpe, partículas, temblor de cámara) y montaje de marca. Lo usan las escenas de
// remotion/src/episodes/*.tsx (import ... from "../pq"). Escenarios y personajes: "../pqworld".
// Reglas: todo sale de useCurrentFrame() (nada de CSS animado ni Math.random: random(seed)); el mundo va en SVG
// 1080×1920 y la interfaz en HTML encima, en coordenadas de pantalla. Zonas: arriba 140-560 rótulos, en medio la
// acción, subtítulos 1330-1480, nada importante por debajo de 1540 ni a la derecha de 960 entre 1000 y 1540.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, delayRender, continueRender, random } from "remotion";
import type { CurioProps, Line, Word, SceneDef } from "./kit";

export type { CurioProps, Line, Word, SceneDef, SceneProps } from "./kit";
export { curioMeta } from "./kit";

// ---------- marca ----------
// Paleta de Beltrán (22-10-2026): noche, pizarra, oro, lino y luz. Colores intensos SOLO para avisos puntuales.
export const C = {
  noche: "#111820", hondo: "#0C1117", pizarra: "#303B43", pizarraClaro: "#56636B",
  oro: "#C5A574", oroClaro: "#DCC49C", oroOscuro: "#8E7449", lino: "#EAE5DA", linoSombra: "#D6CFC0", luz: "#FAF9F6",
  alerta: "#E5484D", ok: "#3FB97A", aviso: "#F0A04B",
} as const;
export const SANS = "Jost, sans-serif", SERIF = "'Instrument Serif', serif", MONO = "'IBM Plex Mono', monospace";
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const out = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const back = Easing.out(Easing.back(1.8));
/** 0→1 entre a y a+d segundos */
export const k = (t: number, a: number, d: number, e: (n: number) => number = out) => (Number.isFinite(a) ? interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: e }) : a < 0 ? 1 : 0); // a = ±Infinity: «siempre» / «nunca»
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** sube en `a`, se mantiene y baja en `b` (para cosas que aparecen y se van) */
export const inout = (t: number, a: number, b: number, d = 0.35) => Math.min(k(t, a, d), 1 - k(t, b - d, d, inOut));
/** muelle que entra en `at` (s) */
export const useSpring = (t: number, at: number, damping = 13) => {
  const { fps } = useVideoConfig();
  return t < at ? 0 : spring({ frame: (t - at) * fps, fps, config: { damping, mass: 0.7 } });
};
/** temblor de cámara que decae: [dx, dy] */
export const shake = (t: number, at: number, dur = 0.6, amp = 26): [number, number] => {
  if (t < at || t > at + dur) return [0, 0];
  const d = 1 - (t - at) / dur;
  return [amp * d * Math.sin(t * 91), amp * d * Math.cos(t * 73)];
};

export const useBrandFonts = () => {
  const [h] = useState(() => delayRender("fuentes P&Q"));
  useEffect(() => {
    const fonts = [
      new FontFace("Jost", `url(${staticFile("fonts/jost.woff2")})`, { weight: "100 900" }),
      new FontFace("Instrument Serif", `url(${staticFile("fonts/instrument-serif-italic.woff2")})`, { style: "italic" }),
      new FontFace("IBM Plex Mono", `url(${staticFile("fonts/plex-mono-500.woff2")})`, { weight: "500" }),
    ];
    Promise.all(fonts.map((f) => f.load())).then((ls) => { ls.forEach((l) => document.fonts.add(l)); continueRender(h); });
  }, [h]);
};

// ---------- mundo SVG ----------
/** Lienzo del mundo (1080×1920). Todo lo de dentro va en coordenadas del mundo. */
export const World: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>
);
/** Cámara: (x, y) del mundo queda en el centro de la pantalla; z = zoom; r = giro en grados; sh = temblor. */
export const Cam: React.FC<{ x?: number; y?: number; z?: number; r?: number; sh?: [number, number]; children: React.ReactNode }> = ({ x = 540, y = 960, z = 1, r = 0, sh = [0, 0], children }) => (
  <g transform={`translate(${540 + sh[0]} ${960 + sh[1]}) scale(${z}) rotate(${r}) translate(${-x} ${-y})`}>{children}</g>
);
/** Paralaje: capas con depth < 1 se mueven menos que la cámara (fondo), > 1 más (primer plano). */
export const Par: React.FC<{ cx: number; cy: number; depth: number; children: React.ReactNode }> = ({ cx, cy, depth, children }) => (
  <g transform={`translate(${(cx - 540) * (1 - depth)} ${(cy - 960) * (1 - depth)})`}>{children}</g>
);
/** Halo de luz suave (radial) */
export const Glow: React.FC<{ x: number; y: number; r: number; c: string; o?: number; id: string }> = ({ x, y, r, c, o = 1, id }) => (
  <g opacity={o}>
    <defs><radialGradient id={id}><stop offset="0" stopColor={c} stopOpacity={0.9} /><stop offset="0.4" stopColor={c} stopOpacity={0.35} /><stop offset="1" stopColor={c} stopOpacity={0} /></radialGradient></defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </g>
);
/** Ondas de llamada: arcos concéntricos que salen del punto */
export const RingWaves: React.FC<{ x: number; y: number; t: number; c?: string; n?: number; size?: number; o?: number }> = ({ x, y, t, c = C.oro, n = 3, size = 120, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: n }, (_, i) => {
      const p = ((t * 1.4 + i / n) % 1);
      return <circle key={i} cx={x} cy={y} r={20 + p * size} fill="none" stroke={c} strokeWidth={8 * (1 - p)} opacity={(1 - p) * 0.9} />;
    })}
  </g>
);
/** Ráfaga de partículas con gravedad (polvo, chispas, tornillos) que sale en `at` */
export const Burst: React.FC<{ x: number; y: number; t: number; at: number; n?: number; seed: string; c?: string[]; speed?: number; g?: number; size?: number; dur?: number; up?: number }> = ({ x, y, t, at, n = 26, seed, c = [C.lino, C.oro, C.pizarraClaro], speed = 900, g = 1800, size = 10, dur = 1.4, up = 0.6 }) => {
  const dt = t - at;
  if (dt < 0 || dt > dur) return null;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = -Math.PI * (0.05 + 0.9 * random(`${seed}a${i}`)) * (random(`${seed}u${i}`) < up ? 1 : -0.25);
        const v = speed * (0.35 + 0.65 * random(`${seed}v${i}`));
        const px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt + 0.5 * g * dt * dt;
        const s = size * (0.4 + random(`${seed}s${i}`)) * (1 - dt / dur);
        return <rect key={i} x={px - s / 2} y={py - s / 2} width={s} height={s * (random(`${seed}r${i}`) < 0.5 ? 1 : 0.4)} rx={s / 3} fill={c[i % c.length]} transform={`rotate(${dt * 600 * (random(`${seed}w${i}`) - 0.5)} ${px} ${py})`} />;
      })}
    </g>
  );
};
/** Onda de choque + estrella de impacto (el «BOOM», sin texto) */
export const Impact: React.FC<{ x: number; y: number; t: number; at: number; c?: string; size?: number }> = ({ x, y, t, at, c = C.luz, size = 260 }) => {
  const dt = t - at;
  if (dt < 0 || dt > 0.9) return null;
  const p = k(t, at, 0.5);
  const star = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2, r = (i % 2 ? 0.45 : 1) * size * mix(0.4, 1, p);
    return `${x + Math.cos(a) * r},${y + Math.sin(a) * r * 0.62}`;
  }).join(" ");
  return (
    <g opacity={1 - k(t, at + 0.25, 0.6)}>
      <ellipse cx={x} cy={y} rx={size * 1.6 * p} ry={size * 0.5 * p} fill="none" stroke={c} strokeWidth={14 * (1 - p) + 2} />
      <polygon points={star} fill={c} opacity={0.85 * (1 - p)} />
    </g>
  );
};
/** Líneas de velocidad (caída, golpe de cámara) */
export const SpeedLines: React.FC<{ t: number; o: number; seed: string; c?: string; vertical?: boolean }> = ({ t, o, seed, c = C.lino, vertical = true }) => (
  <g opacity={o}>
    {Array.from({ length: 18 }, (_, i) => {
      const x = random(`${seed}x${i}`) * 1080, y = ((random(`${seed}y${i}`) * 2400 - t * 3200) % 2400 + 2400) % 2400 - 240, l = 120 + random(`${seed}l${i}`) * 260;
      return vertical ? <line key={i} x1={x} y1={y} x2={x} y2={y + l} stroke={c} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        : <line key={i} x1={y * 0.45} y1={x * 1.7} x2={y * 0.45 + l} y2={x * 1.7} stroke={c} strokeWidth={3} strokeLinecap="round" opacity={0.5} />;
    })}
  </g>
);

// ---------- capas de pantalla ----------
export const Flash: React.FC<{ t: number; at: number; c?: string; dur?: number }> = ({ t, at, c = "#fff", dur = 0.35 }) => {
  const o = t < at ? 0 : 1 - k(t, at, dur, Easing.out(Easing.quad));
  return o > 0 ? <AbsoluteFill style={{ background: c, opacity: o * 0.85 }} /> : null;
};
export const Vignette: React.FC<{ o?: number }> = ({ o = 0.6 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 110% 75% at 50% 48%, transparent 55%, rgba(8,11,15,${o}) 100%)`, pointerEvents: "none" }} />
);
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <filter id="pq-grano"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 7} /></filter>
      <rect width="100%" height="100%" filter="url(#pq-grano)" />
    </svg>
  );
};

// ---------- tipografía e interfaz (HTML, coordenadas de pantalla) ----------
/** Rótulo fijo de honestidad: «RECREACIÓN», «DEMO · DATOS FICTICIOS» (arriba a la izquierda, siempre legible) */
export const Label: React.FC<{ text: string; t: number; at?: number; c?: string }> = ({ text, t, at = 0, c = C.lino }) => (
  <div style={{ position: "absolute", left: 64, top: 150, opacity: k(t, at, 0.4) * 0.92, fontFamily: MONO, fontSize: 24, letterSpacing: "0.18em", color: c, border: `2px solid ${c}`, borderRadius: 8, padding: "8px 14px", background: "rgba(12,17,23,0.55)" }}>{text}</div>
);
/** Número de opción gigante en serif (1, 2, 3…) con su etiqueta */
export const BigNum: React.FC<{ t: number; at: number; n: string; label: string; c?: string; x?: number; y?: number; until?: number }> = ({ t, at, n, label, c = C.oro, x = 70, y = 210, until = Infinity }) => {
  const s = useSpring(t, at, 12);
  const o = Math.min(k(t, at, 0.2), 1 - k(t, until - 0.3, 0.3));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 28, opacity: o }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 260, lineHeight: 0.8, color: c, scale: `${mix(0.6, 1, s)}`, textShadow: `0 0 60px ${c}55` }}>{n}</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 52, letterSpacing: "0.04em", color: C.luz, textTransform: "uppercase", lineHeight: 1.05, translate: `${mix(-30, 0, k(t, at + 0.12, 0.4))}px 0`, opacity: k(t, at + 0.12, 0.4), maxWidth: 620, textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}>{label}</div>
    </div>
  );
};
/** Píldora de texto que entra con rebote */
export const Chip: React.FC<{ t: number; at: number; text: string; x: number; y: number; c?: string; solid?: boolean; size?: number; align?: "left" | "center" | "right"; until?: number }> = ({ t, at, text, x, y, c = C.oro, solid, size = 40, align = "left", until = Infinity }) => {
  const s = useSpring(t, at, 14);
  const o = Math.min(k(t, at, 0.15), 1 - k(t, until - 0.25, 0.25));
  if (o <= 0) return null;
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: `${tx} 0`, scale: `${mix(0.7, 1, s)}`, opacity: o, fontFamily: SANS, fontWeight: 700, fontSize: size, color: solid ? C.noche : c, background: solid ? c : "rgba(12,17,23,0.72)", border: `3px solid ${c}`, borderRadius: 999, padding: `${size * 0.3}px ${size * 0.7}px`, whiteSpace: "nowrap", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>{text}</div>
  );
};
/** Titular en dos tonos: lo que va entre *asteriscos* sale en serif dorada */
export const Headline: React.FC<{ t: number; at: number; text: string; x?: number; y: number; size?: number; w?: number; align?: "left" | "center"; until?: number }> = ({ t, at, text, x = 80, y, size = 84, w = 920, align = "left", until = Infinity }) => {
  const parts = text.split("*");
  const o = Math.min(1, 1 - k(t, until - 0.3, 0.3));
  let word = 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: align, fontFamily: SANS, fontWeight: 650, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.015em", color: C.luz, opacity: o }}>
      {parts.map((p, i) => p.split(/(\s+)/).map((tok, j) => {
        if (!tok.trim()) return tok;
        const p2 = k(t, at + word++ * 0.07, 0.4);
        return <span key={`${i}-${j}`} style={{ display: "inline-block", opacity: p2, translate: `0 ${mix(26, 0, p2)}px`, ...(i % 2 ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, color: C.oro, fontSize: size * 1.12 } : {}) }}>{tok}</span>;
      }))}
    </div>
  );
};
/** Nota de fuente (pequeña, legible, con su norma o enlace corto) */
export const SourceNote: React.FC<{ t: number; at: number; text: string; y?: number; until?: number }> = ({ t, at, text, y = 560, until = Infinity }) => (
  <div style={{ position: "absolute", left: 70, right: 120, top: y, opacity: Math.min(k(t, at, 0.4), 1 - k(t, until - 0.3, 0.3)), fontFamily: MONO, fontSize: 26, lineHeight: 1.35, color: C.lino, background: "rgba(12,17,23,0.7)", borderLeft: `4px solid ${C.oro}`, padding: "14px 20px", borderRadius: 6 }}>{text}</div>
);
/** Tarjeta base de interfaz (sale con muelle desde abajo) */
export const Card: React.FC<{ t: number; at: number; x: number; y: number; w: number; children: React.ReactNode; dark?: boolean; until?: number; from?: "up" | "down" | "left" | "right"; style?: React.CSSProperties }> = ({ t, at, x, y, w, children, dark, until = Infinity, from = "down", style }) => {
  const s = useSpring(t, at, 15);
  const o = Math.min(k(t, at, 0.18), 1 - k(t, until - 0.3, 0.3));
  if (o <= 0) return null;
  const d = mix(1, 0, s) * 90;
  const tr = from === "down" ? `0 ${d}px` : from === "up" ? `0 ${-d}px` : from === "left" ? `${-d}px 0` : `${d}px 0`;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, translate: tr, opacity: o, background: dark ? "rgba(17,24,32,0.94)" : C.luz, color: dark ? C.luz : C.noche, borderRadius: 34, padding: "28px 32px", fontFamily: SANS, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", border: dark ? `2px solid ${C.pizarra}` : "none", ...style }}>{children}</div>
  );
};
/** Pantalla de llamada: «entrante», «IA contestando», «sin respuesta», «llamando» */
export const CallCard: React.FC<{ t: number; at: number; x: number; y: number; w?: number; name: string; state: "entrante" | "ia" | "perdida" | "llamando" | "colgada"; sub?: string; until?: number; since?: number }> = ({ t, at, x, y, w = 600, name, state, sub, until, since = at }) => {
  const c = state === "ia" ? C.oro : state === "perdida" || state === "colgada" ? C.alerta : C.ok;
  const secs = Math.max(0, Math.floor(t - since));
  const status = { entrante: "Llamada entrante", ia: `IA contestando · 00:${String(secs).padStart(2, "0")}`, perdida: "Llamada perdida", llamando: "Llamando…", colgada: "Sin respuesta" }[state];
  return (
    <Card t={t} at={at} x={x} y={y} w={w} dark until={until}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 92, height: 92, borderRadius: 99, background: state === "ia" ? C.noche : C.pizarra, border: `4px solid ${c}`, display: "grid", placeItems: "center", boxShadow: `0 0 ${state === "ia" ? 40 : 0}px ${c}88`, overflow: "hidden" }}>
          {state === "ia" ? <Img src={staticFile("brand/mark-claro.png")} style={{ width: 74 }} /> : <PhoneGlyph c={C.lino} size={44} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650, fontSize: 42, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontFamily: MONO, fontSize: 25, color: c, marginTop: 6 }}>{status}</div>
          {sub && <div style={{ fontSize: 26, opacity: 0.7, marginTop: 4 }}>{sub}</div>}
        </div>
      </div>
      {state === "ia" && <Wave t={t} c={C.oro} />}
    </Card>
  );
};
export const PhoneGlyph: React.FC<{ c: string; size: number }> = ({ c, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill={c} /></svg>
);
/** Ecualizador de voz */
export const Wave: React.FC<{ t: number; c: string; n?: number; h?: number }> = ({ t, c, n = 28, h = 70 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, height: h, marginTop: 22 }}>
    {Array.from({ length: n }, (_, i) => {
      const v = 0.2 + 0.8 * Math.abs(Math.sin(t * 7.3 + i * 0.9) * Math.sin(t * 3.1 + i * 0.37));
      return <div key={i} style={{ flex: 1, height: `${v * 100}%`, borderRadius: 6, background: c, opacity: 0.85 }} />;
    })}
  </div>
);
/** Burbuja de conversación (transcripción de la llamada o chat) */
export const Bubble: React.FC<{ t: number; at: number; text: string; who: "cliente" | "ia" | "yo"; x: number; y: number; w?: number; until?: number; label?: string }> = ({ t, at, text, who, x, y, w = 640, until = Infinity, label }) => {
  const s = useSpring(t, at, 16);
  const o = Math.min(k(t, at, 0.15), 1 - k(t, until - 0.25, 0.25));
  if (o <= 0) return null;
  const n = Math.ceil(k(t, at + 0.1, Math.max(0.35, text.length * 0.022), Easing.linear) * text.length);
  const right = who !== "cliente";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", flexDirection: "column", alignItems: right ? "flex-end" : "flex-start", opacity: o, scale: `${mix(0.85, 1, s)}`, transformOrigin: right ? "right bottom" : "left bottom" }}>
      {label && <div style={{ fontFamily: MONO, fontSize: 22, color: right ? C.oro : C.linoSombra, marginBottom: 6, letterSpacing: "0.1em" }}>{label}</div>}
      <div style={{ maxWidth: w * 0.88, fontFamily: SANS, fontSize: 36, lineHeight: 1.25, padding: "18px 26px", borderRadius: 28, borderBottomRightRadius: right ? 6 : 28, borderBottomLeftRadius: right ? 28 : 6,
        background: who === "ia" ? C.oro : who === "yo" ? "#DCF3D8" : C.luz, color: C.noche, boxShadow: "0 14px 40px rgba(0,0,0,0.3)" }}>
        {text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span>
      </div>
    </div>
  );
};
/** Notificación del móvil (WhatsApp, agenda, llamada perdida) */
export const Toast: React.FC<{ t: number; at: number; app: string; title: string; body: string; x?: number; y: number; w?: number; c?: string; until?: number; icon?: React.ReactNode }> = ({ t, at, app, title, body, x = 70, y, w = 940, c = C.ok, until = Infinity, icon }) => (
  <Card t={t} at={at} x={x} y={y} w={w} until={until} from="up" style={{ padding: "22px 26px", borderRadius: 30, background: "rgba(250,249,246,0.97)" }}>
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: c, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon ?? <PhoneGlyph c="#fff" size={36} />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 21, color: C.pizarraClaro, letterSpacing: "0.06em" }}><span>{app.toUpperCase()}</span><span>ahora</span></div>
        <div style={{ fontWeight: 650, fontSize: 34, marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 30, lineHeight: 1.25, color: C.pizarra, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  </Card>
);
export const ChatGlyph: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="#fff" /><path d="M9 8.5c.3 2.6 2.9 5.4 5.6 6l1.2-1.4-1.9-1-1 .9c-1-.4-2.1-1.5-2.5-2.5l.9-1-1-1.9z" fill={C.ok} /></svg>
);
/** Tarjeta de agenda con la cita nueva (se «sella» con un check) */
export const AgendaCard: React.FC<{ t: number; at: number; x: number; y: number; w?: number; day: string; time: string; title: string; who: string; until?: number; tag?: string }> = ({ t, at, x, y, w = 620, day, time, title, who, until, tag = "NUEVA CITA" }) => {
  const chk = k(t, at + 0.5, 0.4, back);
  return (
    <Card t={t} at={at} x={x} y={y} w={w} until={until}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.14em", color: C.oroOscuro }}>{tag}</div>
        <div style={{ width: 54, height: 54, borderRadius: 99, background: C.ok, display: "grid", placeItems: "center", scale: `${chk}` }}>
          <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div style={{ display: "flex", gap: 26, marginTop: 14, alignItems: "center" }}>
        <div style={{ textAlign: "center", background: C.noche, color: C.luz, borderRadius: 20, padding: "12px 20px", minWidth: 150 }}>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.oro }}>{day}</div>
          <div style={{ fontWeight: 700, fontSize: 52, lineHeight: 1 }}>{time}</div>
        </div>
        <div>
          <div style={{ fontWeight: 650, fontSize: 38, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 28, color: C.pizarraClaro, marginTop: 6 }}>{who}</div>
        </div>
      </div>
    </Card>
  );
};
/** Lista de resultados tipo buscador de mapas (negocios FICTICIOS). tap = índice pulsado en `tapAt`; gone = índice que se apaga en `goneAt` */
export const ResultList: React.FC<{ t: number; at: number; x?: number; y: number; w?: number; query: string; items: { name: string; sub: string }[]; tap?: number; tapAt?: number; gone?: number; goneAt?: number; until?: number }> = ({ t, at, x = 110, y, w = 860, query, items, tap = -1, tapAt = Infinity, gone = -1, goneAt = Infinity, until }) => (
  <Card t={t} at={at} x={x} y={y} w={w} until={until} style={{ padding: 0, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "24px 30px", borderBottom: `2px solid ${C.linoSombra}` }}>
      <svg width="38" height="38" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" stroke={C.pizarra} strokeWidth="2.6" fill="none" /><path d="M15.5 15.5L21 21" stroke={C.pizarra} strokeWidth="2.6" strokeLinecap="round" /></svg>
      <div style={{ fontSize: 36, fontWeight: 500 }}>{query.slice(0, Math.ceil(k(t, at + 0.2, 0.7, Easing.linear) * query.length))}</div>
    </div>
    {items.map((it, i) => {
      const p = k(t, at + 0.6 + i * 0.12, 0.35);
      const pressed = i === tap && t >= tapAt;
      const off = i === gone ? k(t, goneAt, 0.5) : 0;
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px", borderBottom: `2px solid ${C.linoSombra}`, opacity: p * mix(1, 0.28, off), translate: `${mix(40, 0, p) - off * 30}px 0`, background: pressed ? "#E9F6EE" : "transparent", filter: off ? `grayscale(${off})` : undefined }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: 99, background: i === gone && off ? C.pizarraClaro : C.alerta }} />
            <div><div style={{ fontSize: 36, fontWeight: 600 }}>{it.name}</div><div style={{ fontSize: 26, color: C.pizarraClaro }}>{it.sub}</div></div>
          </div>
          <div style={{ width: 78, height: 78, borderRadius: 99, background: pressed ? C.ok : C.linoSombra, display: "grid", placeItems: "center", scale: pressed ? `${mix(0.8, 1, k(t, tapAt, 0.3, back))}` : "1" }}><PhoneGlyph c={pressed ? "#fff" : C.pizarra} size={38} /></div>
        </div>
      );
    })}
  </Card>
);
/** Dedo que pulsa (círculo que se encoge) en coordenadas de pantalla */
export const Tap: React.FC<{ t: number; at: number; x: number; y: number }> = ({ t, at, x, y }) => {
  const p = k(t, at - 0.35, 0.35), q = k(t, at, 0.4);
  if (t < at - 0.35 || t > at + 0.6) return null;
  return <div style={{ position: "absolute", left: x - 45, top: y - 45, width: 90, height: 90, borderRadius: 99, border: `5px solid ${C.noche}`, background: "rgba(17,24,32,0.18)", opacity: p * (1 - q), scale: `${mix(1.4, 1, p) * mix(1, 1.6, q)}` }} />;
};
/** Caja de comentario de la app con la palabra clave escribiéndose */
export const CommentBox: React.FC<{ t: number; at: number; keyword: string; prompt?: string; y?: number }> = ({ t, at, keyword, prompt = "Añade un comentario…", y = 1080 }) => {
  const s = useSpring(t, at, 15);
  if (s <= 0) return null;
  const n = Math.floor(k(t, at + 0.4, Math.max(0.6, keyword.length * 0.08), Easing.linear) * keyword.length);
  const caret = Math.floor(t * 2.5) % 2 === 0;
  const sent = k(t, at + 0.6 + keyword.length * 0.08, 0.3);
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: y, scale: `${s}`, background: C.luz, borderRadius: 36, padding: "30px 40px", fontFamily: SANS, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize: 30, fontWeight: 650, color: C.noche, textAlign: "center", marginBottom: 20 }}>Comentarios</div>
      <div style={{ fontSize: 28, color: C.pizarraClaro, marginBottom: 12 }}>{prompt}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${C.linoSombra}`, paddingTop: 20 }}>
        <span style={{ fontSize: 50, fontWeight: 700, color: C.noche, letterSpacing: "0.04em" }}>{keyword.slice(0, n)}<span style={{ opacity: caret && sent < 1 ? 1 : 0, color: C.oro }}>|</span></span>
        <span style={{ fontSize: 32, fontWeight: 700, color: C.oroOscuro, opacity: mix(0.35, 1, sent) }}>Publicar</span>
      </div>
    </div>
  );
};
/** Cierre de marca: monograma P✦Q, frase y web. La caja de comentario se pone aparte (CommentBox). */
export const EndCard: React.FC<{ t: number; at: number; text: string }> = ({ t, at, text }) => {
  const p = k(t, at, 0.6);
  return (
    <AbsoluteFill style={{ background: C.noche, opacity: p, scale: `${1 + 0.035 * k(t, at, 8, Easing.linear)}` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <Img src={staticFile("brand/mark-claro.png")} style={{ width: 360, scale: `${mix(0.9, 1, p)}` }} />
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 34, letterSpacing: "0.32em", color: C.lino }}>PÉREZ <span style={{ fontFamily: SERIF, fontStyle: "italic", letterSpacing: 0, color: C.oro, fontSize: 46 }}>&amp;</span> QUINTANO</div>
      </div>
      <Headline t={t} at={at + 0.2} text={text} y={760} size={64} align="center" x={90} w={900} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1460, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: "0.14em", color: C.lino, opacity: 0.7 * k(t, at + 0.8, 0.5) }}>perezandquintano.es</div>
    </AbsoluteFill>
  );
};

// ---------- subtítulos ----------
/** Palabra a palabra, en grupos cortos; las palabras clave en oro. Banda segura 1330-1480. */
export const PQCaptions: React.FC<{ lines: Line[]; keys: string[]; y?: number; hideFrom?: number }> = ({ lines, keys, y = 1340, hideFrom = Infinity }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (t >= hideFrom) return null;
  const words = lines.flatMap((l) => l.words ?? []);
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length >= 4 || /[.,:;?!…]$/.test(w.w) || !next || next.s - w.e > 0.35) { groups.push(cur); cur = []; }
  });
  const g = groups.find((gr, i) => t >= gr[0].s - 0.05 && t < (groups[i + 1]?.[0].s ?? Infinity) - 0.05 && t < gr[gr.length - 1].e + 0.8);
  if (!g) return null;
  const clean = (x: string) => x.toLowerCase().replace(/[^a-z0-9áéíóúñü%]/g, "");
  const isKey = (w: string) => keys.some((kk) => clean(w) === clean(kk));
  return (
    <div style={{ position: "absolute", top: y, left: 110, right: 150, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px", fontFamily: SANS, fontSize: 62, lineHeight: 1.15, padding: "10px 26px", borderRadius: 22, background: "rgba(12,17,23,0.5)", backdropFilter: "blur(6px)" }}>
        {g.filter((w) => t >= w.s - 0.06).map((w, i) => {
          const p = k(t, w.s - 0.06, 0.2);
          const key = isKey(w.w);
          return (
            <span key={i} style={{ opacity: p, translate: `0 ${mix(14, 0, p)}px`, fontWeight: key ? 700 : 500, color: key ? C.oro : C.luz, textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>
              {w.w.replace(/[,;:]$/, "")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- montaje ----------
/** Reel de P&Q: escenas que cambian al empezar ciertas frases (SceneDef de ../kit), voz, música, efectos y subtítulos. */
export const PQReel: React.FC<CurioProps & { scenes: SceneDef[]; keys: string[]; sfx?: { at: number; s: string; v?: number }[]; music?: string; musicVol?: number; captionsY?: number; captionsUntil?: number; bg?: string }> = ({ id, lines, duration, scenes, keys, sfx = [], music, musicVol = 0.32, captionsY, captionsUntil, bg = C.noche }) => {
  useBrandFonts();
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  const starts = scenes.map((s) => (s.from === 0 ? 0 : (lines[s.from]?.start ?? 0) - 0.12));
  const line = (i: number) => lines[i] ?? { text: "", start: 0, end: 0 };
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {scenes.map(({ C: S }, i) => {
        const a = Math.round(starts[i] * fps), b = Math.round((starts[i + 1] ?? duration) * fps);
        if (b <= a) return null;
        return (
          <Sequence key={i} from={a} durationInFrames={b - a + (i < scenes.length - 1 ? 8 : 0)} premountFor={10}>
            <SceneWrap fade={i > 0} out={i < scenes.length - 1 ? b - a : Infinity}>
              <S t={(f - a) / fps} f={f - a} len={(b - a) / fps} line={line} w={(li, re) => (line(li).words?.find((x) => re.test(x.w))?.s ?? line(li).start) - a / fps} />
            </SceneWrap>
          </Sequence>
        );
      })}
      <Vignette o={0.45} />
      <Grain />
      <PQCaptions lines={lines} keys={keys} y={captionsY} hideFrom={captionsUntil} />
      <Audio src={staticFile(`audio/${id}.mp3`)} />
      {music && <Audio src={staticFile(music)} volume={(fr) => musicVol * interpolate(fr, [0, 20, duration * fps - 45, duration * fps], [0, 1, 1, 0], clamp)} />}
      {starts.slice(1).map((s, i) => <Sequence key={`w${i}`} from={Math.max(0, Math.round((s - 0.15) * fps))} durationInFrames={30}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.14} /></Sequence>)}
      {sfx.map((x, i) => <Sequence key={`s${i}`} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={75}><Audio src={staticFile(`sfx/${x.s}.wav`)} volume={x.v ?? 0.25} /></Sequence>)}
    </AbsoluteFill>
  );
};
const SceneWrap: React.FC<{ children: React.ReactNode; fade: boolean; out: number }> = ({ children, fade, out: o }) => {
  const f = useCurrentFrame();
  const pin = fade ? interpolate(f, [0, 9], [0, 1], { ...clamp, easing: out }) : 1;
  const pout = Number.isFinite(o) ? interpolate(f, [o, o + 8], [1, 0], clamp) : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(pin, pout), scale: `${mix(1.05, 1, pin) * mix(0.98, 1, pout)}`, filter: pin < 1 ? `blur(${mix(10, 0, pin)}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};
