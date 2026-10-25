// Ratopín · prueba de movimiento de 5 s (hoja de tiempos: ratopin-universe/tests/motion-5s/HOJA-DE-TIEMPOS.md).
// Trabaja con la llave → le vibra el móvil en el bolsillo del peto → se congela y lo mira → ojos en blanco y suspiro →
// gira la cabeza → coge el móvil → lo sube delante de la cara → incredulidad. 24 fps de vídeo; Ratopín cambia de dibujo
// cada 2 fotogramas (12/s), la cámara en cada uno. Capas (de atrás adelante): cola, piernas, hueco de la manga lejana,
// mano y brazo lejanos, interior del cuello, cabeza, sisa, torso, cinturón, interior de la manga cercana, brazo cercano, manga cercana, móvil, mano cercana
// y otra vez el antebrazo cercano (el antebrazo va delante de la manga; el brazo, dentro; las mangas, cerradas).
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Part, Boil, asset, type Piece } from "./rig";
import { Face } from "./face";
import { Mouth } from "./mouth";
import { Arm, forearmSide, INK } from "./arm";
import { track, noise, wave } from "./anim";
import { useFonts, SANS } from "../kit";
import { pose, stubEnd, CHAR, BG_K, type Torso } from "./motion5s";
import * as R from "./rig-v1";

type V = readonly [number, number];
const PAPER = "#faf9f6";

// Capa del torso: PNG con las coordenadas de cuerpo.png, girado y respirando alrededor del cinturón.
// sleeve = la manga cercana, que además gira `t.sr` sobre su costura (igual que fromSleeve en motion5s).
// children = dibujo por código en las mismas coordenadas de la capa (el tapón de la manga), con su misma transformación.
const TorsoLayer: React.FC<{ src?: string; t: Torso; sleeve?: boolean; children?: React.ReactNode }> = ({ src, t, sleeve, children }) => (
  <div style={{
    position: "absolute", left: 0, top: 0, transformOrigin: `${R.TORSO_PIVOT[0]}px ${R.TORSO_PIVOT[1]}px`,
    transform: `rotate(${t.lean}deg) scale(1, ${t.sy})`,
  }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 994, height: 936, transformOrigin: `${R.SLEEVE_PIVOT[0]}px ${R.SLEEVE_PIVOT[1]}px`,
      transform: sleeve ? `rotate(${t.sr}deg)` : undefined }}>
      {src && <Img src={asset(`${R.E}${src}.png`)} style={{ position: "absolute", left: 0, top: 0 }} />}
      {children}
    </div>
  </div>
);

// Dibujo colocado por su anchor en un punto del cuerpo y girado (manos, cabeza).
const Placed: React.FC<{ src?: string; anchor: V; at: V; rot: number; sy?: number; mask?: string; children?: React.ReactNode }> = ({ src, anchor, at, rot, sy = 1, mask, children }) => (
  <div style={{
    position: "absolute", left: at[0] - anchor[0], top: at[1] - anchor[1], transformOrigin: `${anchor[0]}px ${anchor[1]}px`,
    transform: `rotate(${rot}deg) scale(1, ${sy})`,
  }}>
    {src && <Img src={asset(src)} style={{ display: "block", position: "relative", maskImage: mask, WebkitMaskImage: mask }} />}
    {children}
  </div>
);

// La muñeca de la mano dibujada aparece poco a poco sobre el brazo (que llega opaco hasta el final del muñón): sin
// escalón ni raya entre brazo y mano. Degradado CSS a lo largo del muñón, en px de la imagen de la mano.
const wristFade = (h: R.Hand) => {
  const a = (h.dir * Math.PI) / 180, g = [Math.cos(a), Math.sin(a)], [w, hh] = h.size;
  const L = Math.abs(w * g[0]) + Math.abs(hh * g[1]);
  const s0 = (h.anchor[0] - w / 2) * g[0] + (h.anchor[1] - hh / 2) * g[1] + L / 2;
  return `linear-gradient(${h.dir + 90}deg, transparent ${s0.toFixed(1)}px, black ${(s0 + Math.max(h.stub * 0.8, 8)).toFixed(1)}px)`;
};

// Manga cerrada (como en los dibujos animados): la boca de la manga se tapa con la misma tela y solo queda el
// dobladillo exterior; el brazo sale por debajo de ese borde. Con la boca a la vista, cualquier brazo dentro parecía un
// tubo metido en otro tubo. mouth = elipse del hueco (px de su capa) y lado (side) donde está el borde exterior.
const SleeveCap: React.FC<{ mouth: R.SleeveMouth }> = ({ mouth }) => {
  const { c } = mouth, th = (mouth.deg * Math.PI) / 180, maj: V = [Math.cos(th), Math.sin(th)], min: V = [-Math.sin(th), Math.cos(th)];
  const pt = (t: number, k: number): V => [c[0] + maj[0] * (mouth.r[0] + k) * Math.cos(t) + min[0] * (mouth.r[1] + k) * Math.sin(t) * mouth.side,
    c[1] + maj[1] * (mouth.r[0] + k) * Math.cos(t) + min[1] * (mouth.r[1] + k) * Math.sin(t) * mouth.side];
  const ring = (k: number, from: number, to: number, n = 48) =>
    Array.from({ length: n + 1 }, (_, i) => pt(from + ((to - from) * i) / n, k)).map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <>
      {/* tela: tapa el hueco y el aro de dentro (el aro mide ~9 px) */}
      <Img src={asset(`${R.E}tela.png`)} style={{ position: "absolute", left: 0, top: 0, clipPath: `path("${ring(10, 0, 2 * Math.PI)} Z")` }} />
      {/* dobladillo: solo la mitad exterior del aro, que es el contorno de la manga */}
      <svg width={994} height={936} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={ring(4.5, 0, Math.PI)} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      </svg>
    </>
  );
};

const armShape = (j: { S: V; E: V; W: V; a: { h: number } }, rig: R.ArmRig, hand: R.Hand, root?: number) => ({
  S: j.S, E: j.E, W: j.W, Hs: stubEnd(j.W, j.a.h, hand), w: [rig.w[0], rig.w[1], rig.w[2], hand.stubW] as const, root,
});

// Móvil por código, en px del dibujo de la mano de agarre (rig PHONE): contorno, canto metálico, marco y pantalla con
// la llamada entrante. El nombre no se leería a este tamaño: lo cuenta el bocadillo.
const Phone: React.FC<{ at: V; rot: number; ringing: boolean; d: number; clip?: V[] }> = ({ at, rot, ringing, d, clip }) => {
  const { c: [cx, cy], size: [w, h], deg } = R.PHONE;
  const [ax, ay] = R.NEAR_HANDS.agarre.anchor;
  const rr = (k: number, fill: string, r = 17) => <rect x={cx - w / 2 + k} y={cy - h / 2 + k} width={w - 2 * k} height={h - 2 * k} rx={Math.max(r - k * 0.8, 4)} fill={fill} />;
  const pulse = 9 + (d % 3) * 3;
  return (
    <svg width={994} height={936} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {clip && <defs><clipPath id={`pocket-${d}`}><path clipRule="evenodd"
        d={`M -2000 -2000 H 3000 V 3000 H -2000 Z M ${clip.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")} Z`} /></clipPath></defs>}
      <g clipPath={clip ? `url(#pocket-${d})` : undefined}>
        <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot}) translate(${-ax} ${-ay}) rotate(${deg} ${cx} ${cy})`}>
          {rr(0, INK)}{rr(4.5, "#77746f")}{rr(7, INK)}{rr(9.5, "#f4f3ef", 15)}
          <rect x={cx - 13} y={cy - h / 2 + 10} width={26} height={7} rx={3.5} fill={INK} />
          {ringing && <g fill={INK}>
            <circle cx={cx} cy={cy - 48} r={pulse} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.5} />
            <circle cx={cx} cy={cy - 48} r={9} fill="none" stroke={INK} strokeWidth={3} />
            <rect x={cx - 21} y={cy - 28} width={42} height={6} rx={3} /><rect x={cx - 14} y={cy - 17} width={28} height={5} rx={2.5} opacity={0.6} />
            <circle cx={cx - 17} cy={cy + 58} r={8 + (d % 2)} /><circle cx={cx + 17} cy={cy + 58} r={8 + ((d + 1) % 2)} fill="none" stroke={INK} strokeWidth={3} />
          </g>}
        </g>
      </g>
    </svg>
  );
};

// Rayitas de vibración a los lados del móvil (px del cuerpo).
const Buzz: React.FC<{ at: V; d: number }> = ({ at, d }) => (
  <svg width={994} height={936} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {[0, 1].map((k) => {
      const o = (d + k) % 2 ? 5 : 0, x = at[0] + 80, y = at[1] - 120 - k * 26;
      return <path key={k} d={`M ${x - 68 - k * 16 - o} ${y} q -9 15 0 30 M ${x + 68 + k * 16 + o} ${y} q 9 15 0 30`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
    })}
  </svg>
);

// Bocadillo con quién llama: entra con exceso desde su pico (que señala al móvil) y respira con el lápiz.
const Callout: React.FC<{ D: number }> = ({ D }) => {
  if (D < 49) return null; // antes del susto (D54): hay que dar tiempo a leerlo (timing-mastery)
  const s = track([[49, 0], [51, 1, "back"]], D);
  return (
    <div style={{ position: "absolute", left: 60, top: 800, width: 470, transformOrigin: "112px 236px", transform: `rotate(${-3 + wave(D, 14, 0.6)}deg) scale(${s})` }}>
      <svg width={470} height={240} style={{ position: "absolute", overflow: "visible" }}>
        <path d="M 22 10 H 448 Q 462 10 462 24 V 132 Q 462 146 448 146 H 186 L 112 236 L 140 146 H 22 Q 8 146 8 132 V 24 Q 8 10 22 10 Z" fill={PAPER} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "relative", padding: "24px 30px 0", fontFamily: SANS, color: INK, lineHeight: 1.05 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", opacity: 0.7 }}>Llamada entrante</div>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, marginTop: 8 }}>El del aire acondicionado (3)</div>
      </div>
    </div>
  );
};

export const MotionTest5s: React.FC<{ camera?: boolean; boil?: boolean }> = ({ camera = true, boil = true }) => {
  useFonts();
  const f = useCurrentFrame();
  const D = Math.min(Math.floor(f / 2), 59);
  const p = pose(D);
  const { torso, near, far } = p;
  const nh = R.NEAR_HANDS[near.hand], fh = R.FAR_HANDS[far.hand];
  const nearShape = armShape(near, R.NEAR, nh), farShape = armShape(far, R.FAR, fh, 110);
  const hd = R.HEADS[p.head.name], [hw, hh] = R.HEAD_SIZE[p.head.name];

  const tail: Piece = R.TAIL.reduceRight<Piece | undefined>((child, seg, i) => ({
    id: `tail${i}`, draw: { src: `${R.E}cola-${i + 1}.png`, pivot: seg.pivot }, at: i ? R.TAIL[i - 1].next! : R.TAIL_AT,
    children: child && [child],
  }), undefined)!;
  const tailPose = Object.fromEntries(p.tail.map((r, i) => [`tail${i}`, { r }]));

  // Cámara: plano algo cerrado anclado al suelo, respiración de cámara en mano en cada fotograma y, en el remate,
  // empuje hacia la cara y el móvil.
  const push = camera ? track([[88, 1.15], [118, 1.32, "out"]], f) : 1;
  const ox = camera ? track([[88, 420], [118, 380, "out"]], f) : 0, oy = camera ? track([[88, 1880], [118, 1160, "out"]], f) : 0;
  const cx = camera ? noise(f / 22, 1) * 6 : 0, cy = camera ? noise(f / 25, 2) * 6 : 0;
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${cx}px, ${cy}px) scale(${push})`, transformOrigin: `${ox}px ${oy}px` }}>
        <Img src={asset("ratopin/v1/fondo.png")} style={{ position: "absolute", width: 1080 * BG_K, height: 1920 * BG_K, left: 1080 - 1080 * BG_K, top: 0 }} />
        <Boil d={D} scale={boil ? 2.2 : 0}>
          <div style={{ position: "absolute", left: CHAR.x, top: CHAR.y, transform: `scale(${CHAR.s})`, transformOrigin: "0 0" }}>
            <Part piece={tail} pose={tailPose} d={D} />
            <Img src={asset(`${R.E}piernas.png`)} style={{ position: "absolute", left: 0, top: 0 }} />
            {/* la mano encima del antebrazo: su muñeca dibujada tapa el final del brazo (antes, el tope redondo del brazo
                quedaba encima de la mano y parecía la articulación de un muñeco) */}
            <Arm id={`far-${D}`} shape={farShape} />
            <Placed src={fh.src} anchor={fh.anchor} at={far.W} rot={far.rot} mask={wristFade(fh)} />
            <TorsoLayer src="cuello-trasero" t={torso} />
            <Placed src={hd.src} anchor={hd.pivot} at={p.head.at} rot={p.head.r} sy={p.head.sy}>
              <Face key={p.head.name} rig={{ ...R.FACES[p.head.name], mask: asset(R.FACES[p.head.name].mask) }} e={p.e} w={hw} h={hh} uid={`f${D}`} />
            </Placed>
            {/* costado bajo la manga, DEBAJO del torso: solo rellena el hueco que deja la manga al girar (encima tapaba el tirante) */}
            <TorsoLayer src="sisa" t={torso} />
            <TorsoLayer src="torso" t={torso} />
            <TorsoLayer t={torso}><SleeveCap mouth={R.FAR_SLEEVE_MOUTH} /></TorsoLayer>
            <Img src={asset(`${R.E}cinturon.png`)} style={{ position: "absolute", left: 0, top: 0 }} />
            <Arm id={`near-${D}`} shape={nearShape} />
            <TorsoLayer src="manga-cerca" t={torso} sleeve />
            <TorsoLayer t={torso} sleeve><SleeveCap mouth={R.SLEEVE_MOUTH} /></TorsoLayer>
            {/* la boca va con la cabeza pero por delante del torso: al abrirse, la mandíbula cae delante del pecho */}
            {p.mouth && (
              <Placed anchor={hd.pivot} at={p.head.at} rot={p.head.r} sy={p.head.sy}>
                <Mouth rig={R.MOUTHS[p.head.name]} m={p.mouth} src={asset(hd.src)} w={hw} h={hh} />
              </Placed>
            )}
            <Phone at={p.phone.at} rot={p.phone.rot} ringing={p.ringing} d={D} clip={p.inPocket ? p.pocket : undefined} />
            {p.buzz && D < 41 && <Buzz at={p.phone.at} d={D} />}
            <Arm id={`nearfore-${D}`} shape={nearShape} clip={forearmSide(nearShape)} />
            <Placed src={nh.src} anchor={nh.anchor} at={near.W} rot={near.rot} mask={wristFade(nh)} />
          </div>
        </Boil>
      </AbsoluteFill>
      <Boil d={D} scale={boil ? 2.2 : 0}><Callout D={D} /></Boil>
    </AbsoluteFill>
  );
};
