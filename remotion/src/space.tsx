// Piezas espaciales reutilizables (categoría "espacio"): planetas con textura procedural, atmósfera, Sol,
// flechas de giro y arcos de progreso. Todo determinista: mismo fotograma → misma imagen.
import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { Dust, Glow } from "./kit";

// Ruido de valor 2D con semilla (sin dependencias) + fbm
const hash = (x: number, y: number, s: number) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
const smooth = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, y: number, s: number, wrap: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const w = (v: number) => ((v % wrap) + wrap) % wrap; // tileable en horizontal: la costura del planeta no se nota
  const a = hash(w(xi), yi, s), b = hash(w(xi + 1), yi, s), c = hash(w(xi), yi + 1, s), d = hash(w(xi + 1), yi + 1, s);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x: number, y: number, s: number, wrap: number, oct = 5) => {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * vnoise(x * f, y * f, s + i * 13, wrap * f); amp *= 0.5; f *= 2; }
  return v;
};

export type Palette = [string, string, string, string]; // de oscuro a claro
// Textura equirectangular: bandas de nubes (latitud) deformadas por ruido. `bands` = cuánto manda la latitud.
const texCache = new Map<string, THREE.Texture>();
export const planetTexture = (seed: number, pal: Palette, bands = 0.65, w = 1024, h = 512) => {
  const key = `${seed}${pal.join()}${bands}${w}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d")!; const img = g.createImageData(w, h);
  const cols = pal.map((c) => new THREE.Color(c));
  const tmp = new THREE.Color();
  for (let y = 0; y < h; y++) {
    const lat = y / h;
    for (let x = 0; x < w; x++) {
      const u = (x / w) * 8, v = lat * 4;
      const warp = fbm(u + 3.1, v * 1.7, seed + 5, 8, 4) * 2.2;
      const n = fbm(u + warp, v * 0.6 + warp * 0.35, seed, 8);
      const band = 0.5 + 0.5 * Math.sin(lat * Math.PI * 9 + warp * 2.4);
      const m = Math.min(1, Math.max(0, n * (1 - bands) + band * bands * 0.9 + 0.05));
      const seg = m * 3, i = Math.min(2, Math.floor(seg));
      tmp.copy(cols[i]).lerp(cols[i + 1], seg - i);
      const o = (y * w + x) * 4;
      img.data[o] = tmp.r * 255; img.data[o + 1] = tmp.g * 255; img.data[o + 2] = tmp.b * 255; img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping;
  texCache.set(key, t); return t;
};

// Halo de atmósfera: esfera trasera algo mayor; brilla junto al limbo del planeta y se desvanece hacia fuera
// (sin borde duro). d = -normal·vista en caras traseras: 0 en el borde exterior, ≈ 0,49 junto al limbo.
export const Atmosphere: React.FC<{ r: number; c: string; o?: number; scale?: number }> = ({ r, c, o = 0.75, scale = 1.15 }) => {
  const limb = Math.sqrt(1 - 1 / (scale * scale));
  const uniforms = useMemo(() => ({ uC: { value: new THREE.Color(c) }, uO: { value: o }, uL: { value: limb } }), [c, o, limb]);
  return (
    <mesh scale={r * scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={"varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }"}
        fragmentShader={"uniform vec3 uC; uniform float uO; uniform float uL; varying vec3 vN; varying vec3 vV; void main(){ float d = -dot(vN, vV); float i = pow(smoothstep(0.0, uL, d), 2.2) * uO; gl_FragColor = vec4(uC * i, i); }"} />
    </mesh>
  );
};

// Planeta: esfera texturizada que gira (rot en radianes; negativo = retrógrado visto desde el norte)
export const Planet: React.FC<{ r: number; tex: THREE.Texture; rot: number; tilt?: number; atmo?: string; position?: [number, number, number]; children?: React.ReactNode; rough?: number }> = ({ r, tex, rot, tilt = 0, atmo, position, children, rough = 0.95 }) => (
  <group position={position} rotation={[0, 0, tilt]}>
    <group rotation={[0, rot, 0]}>
      <mesh scale={r}><sphereGeometry args={[1, 96, 64]} /><meshStandardMaterial map={tex} roughness={rough} metalness={0} /></mesh>
      {children}
    </group>
    {atmo && <Atmosphere r={r} c={atmo} />}
  </group>
);

// Sol: núcleo emisivo + halos
export const Sun: React.FC<{ r: number; position?: [number, number, number]; o?: number }> = ({ r, position, o = 1 }) => (
  <group position={position}>
    <mesh scale={r}><sphereGeometry args={[1, 48, 48]} /><meshBasicMaterial color="#fff3d6" transparent opacity={o} toneMapped={false} /></mesh>
    <Glow c="#ffd27a" s={r * 7} o={0.85 * o} />
    <Glow c="#ff9a3c" s={r * 16} o={0.35 * o} />
  </group>
);

// Arco de progreso plano (0..1) en el plano XY del grupo; empieza arriba
export const Arc: React.FC<{ r: number; p: number; c: string; w?: number; o?: number; cw?: boolean }> = ({ r, p, c, w = 0.06, o = 1, cw = false }) => {
  const geo = useMemo(() => new THREE.RingGeometry(r - w / 2, r + w / 2, 160, 1, 0, Math.max(0.0001, p) * Math.PI * 2), [r, p, w]);
  return (
    <mesh geometry={geo} rotation={[0, cw ? Math.PI : 0, Math.PI / 2]}>
      <meshBasicMaterial color={c} transparent opacity={o} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// Flecha curva alrededor del ecuador (tubo + punta). dir = +1 antihorario visto desde el norte, -1 horario.
export const SpinArrow: React.FC<{ r: number; dir: 1 | -1; c: string; p?: number; span?: number; start?: number }> = ({ r, dir, c, p = 1, span = 1.25, start = -0.2 }) => {
  const len = span * Math.max(0.001, p);
  const geo = useMemo(() => {
    const pts = Array.from({ length: 48 }, (_, i) => { const a = start + dir * len * (i / 47); return new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r); });
    return { tube: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, r * 0.035, 12, false), end: start + dir * len };
  }, [r, dir, len, start]);
  const a = geo.end;
  const tangent = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)).multiplyScalar(dir);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  return (
    <group>
      <mesh geometry={geo.tube}><meshBasicMaterial color={c} toneMapped={false} /></mesh>
      <mesh position={[Math.sin(a) * r, 0, Math.cos(a) * r]} quaternion={q}><coneGeometry args={[r * 0.1, r * 0.24, 20]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>
    </group>
  );
};

// Fondo de estrellas fijo
export const Stars: React.FC<{ t: number; n?: number; z?: number; seed?: string }> = ({ t, n = 140, z = -12, seed = "estrellas" }) => (
  <Dust t={t} n={n} seed={seed} spread={[34, 50, 4]} center={[0, 0, z]} size={0.05} c="#e6ecff" drift={0} o={0.8} />
);

export const rnd = (s: string) => random(s);
