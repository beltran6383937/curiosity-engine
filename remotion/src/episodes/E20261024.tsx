// Episodio 2026-10-24 · «El parte que se escribe a las 22:00» (pilar demo_sistema).
// Guion, ganchos y claims: episodes/2026-10-24/episode.json · storyboard: episodes/2026-10-24/storyboard.md.
// Recreación ficticia rotulada en todos los planos de la historia; la pantalla del parte es una ilustración genérica
// (cabecera, fecha, barras sin etiquetas y check) rotulada «DEMO · DATOS FICTICIOS». Sin cifras, fotos, firmas ni envíos.
import React from "react";
import { AbsoluteFill } from "remotion";
import { PQReel, World, Cam, Par, Glow, Impact, Label, Chip, Headline, Bubble, Card, EndCard, CommentBox,
  C, MONO, SANS, k, mix, inout, type CurioProps, type SceneProps, type SceneDef } from "../pq";
import { Room, Kitchen, Street, Worker, Toolbox, POSE, blendPose, poseAt, type Pose } from "../pqworld";

export const id = "2026-10-24";

// ---------- poses propias ----------
const WRITE: Pose = { lean: 14, head: 20, hN: [130, 40], hF: [100, 50], fN: [18, 245], fF: [-18, 245] }; // él, de pie tras la encimera, escribiendo
const TIRED: Pose = { lean: 10, head: 26, hN: [40, 70], hF: [20, 70], fN: [18, 245], fF: [-18, 245] }; // hombros caídos, mano quieta
const SIT: Pose = { lean: 0, head: 8, hN: [120, -70], hF: [100, -66], fN: [150, 200], fF: [122, 206] }; // ella, sentada a la mesa
const DRIVE: Pose = { lean: 0, head: 2, hN: [215, -130], hF: [200, -140], fN: [150, 200], fF: [120, 206] }; // él, al volante con las dos manos
const walk = (t: number): Pose => blendPose(POSE.walkA, POSE.walkB, (Math.sin(t * 7) + 1) / 2);
const smooth = (n: number) => n * n * (3 - 2 * n);

// ella: el mismo Worker con coleta que sale por detrás de la gorra (y franja oro más estrecha, tapando un poco la del mono)
const She: React.FC<{ x: number; y: number; pose: Pose; t: number; flip?: boolean; phoneInHand?: boolean; screen?: number }> = ({ x, y, pose, t, flip, phoneInHand, screen }) => {
  const sh = (a: number, b: number): [number, number] => [a, b];
  const a = (pose.lean * Math.PI) / 180, neckX = 192 * Math.sin(a), neckY = -192 * Math.cos(a);
  const b = ((pose.lean + pose.head) * Math.PI) / 180, hx = neckX + 50 * Math.sin(b), hy = neckY - 50 * Math.cos(b);
  const [px, py] = sh(hx - 54, hy + 6);
  const f = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${f} 1)`}>
      <g transform={`translate(${px} ${py}) rotate(${pose.lean + pose.head + 14 + Math.sin(t * 2.2) * 2})`}>
        <ellipse cx={-12} cy={28} rx={22} ry={52} fill="#3A2519" />
        <circle cx={0} cy={-6} r={12} fill={C.oroOscuro} />
      </g>
      <Worker x={0} y={0} pose={pose} t={t} phoneInHand={phoneInHand} screen={screen} />
    </g>
  );
};

// ---------- tarjeta genérica del parte (cabecera, «hoy», barras grises sin etiquetas y check oro) ----------
const PartBody: React.FC<{ fill: number; check: number }> = ({ fill, check }) => (
  <div style={{ fontFamily: SANS }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: C.noche }}>Parte</div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: C.pizarraClaro }}>hoy</div>
    </div>
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2, 3].map((i) => {
        const p = Math.max(0, Math.min(1, fill * 4 - i));
        return (
          <div key={i} style={{ height: 30, borderRadius: 15, background: C.linoSombra, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${p * 100}%`, background: C.oro, borderRadius: 15 }} />
          </div>
        );
      })}
    </div>
    <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", height: 84 }}>
      <svg width="84" height="84" viewBox="0 0 84 84" style={{ opacity: check, scale: `${mix(1.5, 1, check)}` }}>
        <circle cx="42" cy="42" r="38" fill={C.oro} />
        <path d="M 24 43 L 37 56 L 61 30" fill="none" stroke={C.noche} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);
const PartCard: React.FC<{ t: number; at: number; fill?: number; check?: number; x?: number; y?: number; w?: number; until?: number }> = ({ t, at, fill = 0, check = 0, x = 280, y = 520, w = 520, until }) => (
  <Card t={t} at={at} x={x} y={y} w={w} until={until}><PartBody fill={fill} check={check} /></Card>
);

// Rótulos fijos: RECREACIÓN siempre; DEMO debajo (Label tiene top fijo: se apila con un contenedor desplazado)
const Labels: React.FC<{ t: number; demo?: boolean; recreation?: boolean }> = ({ t, demo, recreation = true }) => (
  <>
    {recreation && <Label text="RECREACIÓN · personajes ficticios" t={t} at={-1} />}
    {demo && <div style={{ position: "absolute", inset: 0, translate: recreation ? "0 62px" : "0 0" }}><Label text="DEMO · DATOS FICTICIOS" t={t} at={-1} c={C.oro} /></div>}
  </>
);

// ---------- escenarios ----------
const Clock: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const tick = Math.floor(t * 1) % 2 === 0 ? 0.5 : 0.8;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={62} fill={C.lino} stroke={C.oroOscuro} strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={-50} x2={0} y2={i % 3 === 0 ? -38 : -44} stroke={C.pizarra} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${i * 30})`} />)}
      <line x1={0} y1={0} x2={0} y2={-30} stroke={C.noche} strokeWidth={7} strokeLinecap="round" transform="rotate(300)" />
      <line x1={0} y1={0} x2={0} y2={-46} stroke={C.noche} strokeWidth={4} strokeLinecap="round" />
      <circle r={5} fill={C.oro} opacity={tick + 0.2} />
    </g>
  );
};
const Notebook: React.FC<{ x: number; y: number; open: number }> = ({ x, y, open }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M 0 0 L ${mix(130, 260, open)} 0 L ${mix(150, 280, open)} -26 L 20 -26 Z`} fill={C.pizarra} />
    {open > 0.5 && <>
      <path d="M 12 -4 L 128 -4 L 140 -24 L 30 -24 Z" fill={C.lino} />
      <path d="M 134 -4 L 250 -4 L 268 -24 L 150 -24 Z" fill={C.linoSombra} />
      {[0, 1, 2].map((i) => <path key={i} d={`M ${40 + i * 10} ${-18 + i * 5} q 20 -6 40 0 t 40 0`} stroke={C.pizarraClaro} strokeWidth={3} fill="none" opacity={0.7} />)}
    </>}
  </g>
);
/** Cocina del técnico, de noche: capa azul noche sobre el atardecer, reloj a las 22:00 y luz cálida de lámpara sobre la encimera. */
const NightKitchen: React.FC<{ t: number; lamp?: number; children?: React.ReactNode }> = ({ t, lamp = 1, children }) => (
  <Kitchen t={t} tripped={0}>
    <rect x={-400} y={-400} width={1880} height={2700} fill={C.hondo} opacity={0.55} />
    <Clock x={850} y={470} t={t} />
    <Glow id="nk-glow" x={560} y={1060} r={520} c={C.oroClaro} o={0.55 * lamp} />
    {children}
  </Kitchen>
);
/** Puerta del cliente al atardecer: fachada, aplique de porche, escalón, acera, furgoneta «FONTANERÍA» detrás y un lavabo nuevo al fondo. */
const Porch: React.FC<{ t: number; sink?: number }> = ({ t, sink = 0 }) => (
  <g>
    <Street t={0} vanX={-300} label="FONTANERÍA" />
    <rect x={410} y={520} width={720} height={900} fill="#25303B" />
    <path d="M 390 520 L 770 400 L 1150 520 Z" fill="#141B22" />
    <rect x={430} y={600} width={150} height={170} fill="#1A222B" stroke={C.oroOscuro} strokeWidth={6} />
    <rect x={700} y={800} width={210} height={600} fill="#E9D9B4" />
    <rect x={700} y={800} width={210} height={600} fill="#D8C7A0" opacity={0.5} />
    <rect x={700} y={1230} width={210} height={170} fill="#EDEAE0" opacity={0.85} />
    <g transform="translate(776 1130)">
      <path d="M 0 40 Q 0 76 40 76 L 62 76 Q 100 76 100 40 Z" fill={C.luz} />
      <rect x={34} y={76} width={32} height={96} fill={C.lino} />
      <path d="M 14 14 L 14 -12 Q 14 -26 30 -26 L 52 -26" stroke="#9AA3AA" strokeWidth={8} fill="none" strokeLinecap="round" />
      <Glow id="porch-sink" x={50} y={30} r={150} c={C.luz} o={sink} />
    </g>
    <path d="M 910 800 L 980 830 L 980 1380 L 910 1400 Z" fill="#4A3425" />
    <rect x={690} y={1394} width={240} height={30} fill="#3A434C" />
    <g transform="translate(640 810)">
      <rect x={-8} y={0} width={16} height={46} rx={6} fill={C.oroOscuro} />
      <Glow id="porch-lamp" x={0} y={30} r={300} c={C.oroClaro} o={0.7} />
      <circle cx={0} cy={50} r={13} fill="#FFF6DD" />
    </g>
  </g>
);
const NightWindowSky: React.FC = () => <rect x={-400} y={-400} width={1880} height={2700} fill={C.hondo} />;

// 0 · Gancho: pantalla partida desde el fotograma 0. Arriba ella en la puerta; abajo él en la cocina a las 22:00.
const Hook: React.FC<SceneProps> = ({ t, w }) => {
  const dim = k(t, 0, 0.3);
  const her = poseAt(t, [[0, POSE.stand], [0.15, POSE.phone]], 0.5);
  const him = poseAt(t, [[0, WRITE], [3, TIRED]], 1.2);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960, overflow: "hidden" }}>
        <World style={{ translate: "0 -480px" }}>
          <Cam x={mix(550, 575, k(t, 0, 4))} y={1130} z={mix(1.0, 1.1, k(t, 0, 4))}>
            <Porch t={t} />
            <Toolbox x={640} y={1500} s={0.8} />
            <She x={520} y={1235} pose={her} t={t} phoneInHand screen={k(t, 0.2, 0.6)} />
          </Cam>
        </World>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, height: 960, overflow: "hidden" }}>
        <World style={{ translate: "0 -480px" }}>
          <Cam x={540} y={mix(1010, 1000, k(t, 0, 3))} z={1.0}>
            <NightKitchen t={t}>
              <Notebook x={560} y={1166} open={1} />
              <Worker x={470} y={1130} pose={him} t={t} />
              <ellipse cx={850} cy={1160} rx={90} ry={12} fill={C.lino} opacity={0.85} />
              <path d="M 780 1160 Q 850 1070 920 1160 Z" fill={C.linoSombra} opacity={0.9} />
            </NightKitchen>
          </Cam>
        </World>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1920, background: C.hondo, opacity: dim * 0.35 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: C.oro, boxShadow: `0 0 24px ${C.oro}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 850, height: 220, opacity: dim, background: "linear-gradient(rgba(12,17,23,0), rgba(12,17,23,0.78) 30%, rgba(12,17,23,0.78) 70%, rgba(12,17,23,0))" }} />
      <Labels t={t} />
      <Chip t={t} at={0.3} text="En la puerta" x={70} y={560} c={C.oro} size={44} />
      <Chip t={t} at={0.8} text="22:00 · en la cocina" x={70} y={1090} c={C.lino} size={44} />
      <Headline t={t} at={0} text="¿Quién *cena* antes?" y={896} size={84} align="center" x={80} w={920} />
    </AbsoluteFill>
  );
};

// 1 · Termina la última obra, recoge (la caja se cierra) y se va: corte a la calle, la furgoneta sale del plano.
const Leaves: React.FC<SceneProps> = ({ t, w }) => {
  const tR = w(1, /recoge/), tV = w(1, /va/);
  const go = k(t, tR + 0.1, Math.max(0.5, tV - tR), (n) => n);
  const hx = mix(430, 880, go);
  const pose = t < tR - 0.2 ? POSE.stand : t < tR + 0.2 ? POSE.crouch : go < 1 ? walk(t) : POSE.stand;
  const open = 1 - k(t, tR - 0.25, 0.3);
  const carry = k(t, tR + 0.1, 0.3);
  const boxX = mix(300, hx + 90, carry), boxY = mix(1560, 1460, carry);
  const street = k(t, tV - 0.1, 0.35);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(560, 700, k(t, 0, 3))} y={1100} z={1.0}>
          <Room t={t} lamp={1} />
          <Toolbox x={boxX} y={boxY} open={open} s={mix(1, 0.8, carry)} />
          <Worker x={hx} y={1340} pose={pose} t={t} />
        </Cam>
      </World>
      <AbsoluteFill style={{ opacity: street }}>
        <World>
          <Cam x={540} y={960} z={1.0}><Street t={t} vanX={mix(300, 1300, k(t, tV, 1.3, (n) => n * n))} label="INSTALACIONES" /></Cam>
        </World>
      </AbsoluteFill>
      <Labels t={t} />
      <Chip t={t} at={0.15} text="Última obra" x={70} y={330} c={C.lino} size={40} />
    </AbsoluteFill>
  );
};

// 2 · Furgoneta vista por la ventanilla lateral: él al volante, la libreta cerrada en el asiento del copiloto.
const Drive: React.FC<SceneProps> = ({ t, w }) => {
  const tL = w(2, /luego/);
  const slide = k(t, tL, 0.9, (n) => n * n * (3 - 2 * n));
  return (
    <AbsoluteFill>
      <World>
        <NightWindowSky />
        <Par cx={540} cy={960} depth={0.4}>
          {Array.from({ length: 5 }, (_, i) => {
            const x = ((i * 420 - t * 520) % 2100 + 2100) % 2100 - 500;
            return (
              <g key={i}>
                <rect x={x} y={600} width={14} height={900} fill="#0A0F14" />
                <rect x={x - 6} y={590} width={90} height={14} fill="#0A0F14" />
                <Glow id={`dr-l${i}`} x={x + 76} y={620} r={230} c={C.oroClaro} o={0.55} />
              </g>
            );
          })}
        </Par>
        <rect x={-400} y={1500} width={1880} height={700} fill="#161C22" />
        <g>
          <rect x={150} y={760} width={800} height={560} rx={40} fill="#18222B" opacity={0.62} />
          <rect x={290} y={760} width={150} height={420} rx={30} fill="#26323C" />
          <rect x={760} y={900} width={150} height={420} rx={30} fill="#26323C" />
          <g transform={`translate(${mix(770, 740, slide)} ${mix(1176, 1204, slide)}) rotate(${mix(0, 8, slide)})`}>
            <rect width={130} height={26} rx={6} fill={C.pizarra} />
            <rect x={10} y={-6} width={110} height={8} rx={3} fill={C.lino} opacity={0.5} />
          </g>
          <Worker x={430} y={1130} pose={DRIVE} t={t} />
          <ellipse cx={680} cy={1010} rx={16} ry={72} fill="#0F151B" transform="rotate(18 680 1010)" />
          <rect x={150} y={760} width={800} height={560} rx={40} fill="none" stroke={C.pizarra} strokeWidth={36} />
          <rect x={150} y={1320} width={800} height={190} rx={30} fill="#26323C" />
          <rect x={150} y={1320} width={800} height={14} fill={C.oro} opacity={0.8} />
        </g>
      </World>
      <Labels t={t} />
      <Chip t={t} at={w(2, /parte/) - 0.1} text="El parte → luego" x={70} y={330} c={C.lino} size={44} />
    </AbsoluteFill>
  );
};

// 3 · Llega a casa, deja las llaves, la cena fría y la libreta abierta en la encimera, a las 22:00.
const KitchenArrive: React.FC<SceneProps> = ({ t, w }) => {
  const tF = w(3, /fría/), tL = w(3, /libreta/);
  const walking = t < tF;
  const hx = mix(60, 470, k(t, 0, Math.max(0.8, tF), (n) => n));
  const pose = walking ? walk(t) : t < tL - 0.2 ? POSE.stand : blendPose(POSE.stand, WRITE, smooth(k(t, tL - 0.2, 0.5)));
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(520, 560, k(t, 0, 4))} y={mix(1010, 980, k(t, 0, 4))} z={mix(1.0, 1.18, k(t, 0, 4))}>
          <NightKitchen t={t}>
            <Notebook x={560} y={1166} open={k(t, tL, 0.3)} />
            <Worker x={hx} y={1130} pose={pose} t={t} />
            <g opacity={k(t, tF, 0.3)}>
              <ellipse cx={850} cy={1160} rx={90} ry={12} fill={C.lino} opacity={0.85} />
              <path d="M 780 1160 Q 850 1070 920 1160 Z" fill={C.linoSombra} opacity={0.9} />
            </g>
          </NightKitchen>
        </Cam>
      </World>
      <Labels t={t} />
      <div style={{ position: "absolute", left: 70, top: 330, opacity: k(t, 0.2, 0.4), fontFamily: MONO, fontSize: 64, letterSpacing: "0.08em", color: C.oro, textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}>22:00</div>
    </AbsoluteFill>
  );
};

// 4 · A esas horas ya no se acuerda: tres portales se desdibujan sobre su cabeza, la mano se queda quieta.
const KitchenForget: React.FC<SceneProps> = ({ t, w }) => {
  const tA = w(4, /acuerda/);
  const pose = blendPose(WRITE, TIRED, smooth(k(t, tA - 0.3, 0.8)));
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(560, 520, k(t, 0, 3))} y={mix(960, 940, k(t, 0, 3))} z={mix(1.18, 1.32, k(t, 0, 3))}>
          <NightKitchen t={t}>
            <Notebook x={560} y={1166} open={1} />
            <Worker x={470} y={1130} pose={pose} t={t} />
            {[0, 1, 2].map((i) => {
              const f = k(t, tA + i * 0.35, 0.7);
              return (
                <g key={i} opacity={mix(0.5, 0, f)} style={{ filter: `blur(${f * 14}px)` }} transform={`translate(${430 + i * 120} ${600 - i * 26 - f * 20})`}>
                  <path d="M 0 140 L 0 40 Q 0 0 38 0 Q 76 0 76 40 L 76 140 Z" fill={C.lino} />
                  <circle cx={58} cy={80} r={5} fill={C.oroOscuro} />
                </g>
              );
            })}
          </NightKitchen>
        </Cam>
      </World>
      <Labels t={t} />
      <Bubble t={t} at={0.35} who="yo" text="¿Qué casa era…?" x={120} y={340} w={640} />
    </AbsoluteFill>
  );
};

// 5 · Plano de respeto: él solo en el cono de luz, la casa a oscuras. Retroceso lento.
const Respect: React.FC<SceneProps> = ({ t, w }) => {
  const tF = w(5, /forma/);
  const p = k(t, 0, 4);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(520, 540, p)} y={mix(960, 900, p)} z={mix(1.2, 0.86, p)}>
          <NightKitchen t={t} lamp={mix(0.75, 1, k(t, tF, 0.8))}>
            <Notebook x={560} y={1166} open={1} />
            <Worker x={470} y={1130} pose={TIRED} t={t} />
          </NightKitchen>
        </Cam>
      </World>
      <Labels t={t} />
      <Chip t={t} at={0.2} text="No es él." x={70} y={330} c={C.lino} size={44} />
      <Headline t={t} at={w(5, /Es/) + 0.1} text="Nadie le ha dado *otra forma*." y={470} size={72} />
    </AbsoluteFill>
  );
};

// 6-7 · Ella en la puerta del cliente, de pie en la acera: se enciende el móvil y rellena el parte con el lavabo delante.
const DoorPhone: React.FC<SceneProps> = ({ t, w }) => {
  const tM = w(6, /móvil/), tFill = w(7, /Rellena/), tD = w(7, /delante/);
  const fill = k(t, tFill, Math.max(0.8, tD - tFill + 0.4), (n) => n);
  const toSink = k(t, tD - 0.2, 0.7);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(560, 700, toSink)} y={mix(1120, 1190, toSink)} z={mix(1.12, 1.35, toSink)}>
          <Porch t={t} sink={k(t, tD, 0.6)} />
          <Toolbox x={640} y={1392} s={0.7} />
          <She x={mix(430, 520, k(t, 0, 1.2))} y={1235} pose={poseAt(t, [[0, POSE.stand], [tM - 0.3, POSE.phone]], 0.5)} t={t} phoneInHand={t >= tM - 0.3} screen={k(t, tM, 0.4)} />
        </Cam>
      </World>
      <Labels t={t} demo />
      <PartCard t={t} at={tM + 0.1} fill={fill} x={610} y={380} w={410} />
    </AbsoluteFill>
  );
};

// 8 · Lo cierra ahí, a pie, antes de arrancar la furgoneta: el check se sella sobre el móvil. El plano acaba antes de que arranque.
const ClosePie: React.FC<SceneProps> = ({ t, w }) => {
  const tC = w(8, /cierra/), tP = w(8, /pie/), tA = w(8, /arrancar/);
  const boots = inout(t, tP - 0.2, tP + 0.9, 0.35);
  const away = k(t, tA, 1.0, (n) => n);
  const pose = t < tA - 0.1 ? POSE.phone : walk(t);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={540} y={mix(1100, 1330, boots)} z={mix(0.98, 1.2, boots)}>
          <Porch t={t} sink={0.6} />
          <Toolbox x={mix(640, 330, away)} y={1392 + away * 100} s={0.7} />
          <She x={mix(520, 330, away)} y={1235} pose={pose} t={t} flip={away > 0} phoneInHand={t < tA - 0.1} screen={1} />
          <Impact x={558} y={985} t={t} at={tC} c={C.oro} size={95} />
        </Cam>
      </World>
      <Labels t={t} demo />
      <PartCard t={t} at={-1} fill={1} check={k(t, tC, 0.25)} until={tA - 0.1} x={610} y={380} w={410} />
      <Chip t={t} at={tP - 0.05} text="A pie · furgoneta parada" x={540} y={1180} align="center" c={C.lino} size={42} />
    </AbsoluteFill>
  );
};

// 9 · Su casa, de noche: cena caliente, el móvil a un lado con el parte cerrado y el día también.
const Home: React.FC<SceneProps> = ({ t, w }) => {
  const tC = w(9, /cerrado/);
  const on = k(t, tC - 0.2, 0.9);
  const phoneOn = 1 - k(t, tC, 0.8);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(560, 590, k(t, 0, 4))} y={1130} z={mix(1.0, 1.14, k(t, 0, 4))}>
          <rect x={-400} y={-400} width={1880} height={1900} fill="#2B2320" />
          <rect x={-400} y={1480} width={1880} height={900} fill="#3B2C22" />
          <rect x={-400} y={1470} width={1880} height={14} fill="#241A14" />
          <rect x={620} y={560} width={300} height={340} fill={C.hondo} stroke={C.linoSombra} strokeWidth={14} />
          <line x1={770} y1={560} x2={770} y2={900} stroke={C.linoSombra} strokeWidth={8} />
          <rect x={-400} y={-400} width={1880} height={1900} fill={C.oroClaro} opacity={0.1 + 0.08 * on} />
          <Glow id="home-glow" x={560} y={1000} r={560} c={C.oroClaro} o={mix(0.55, 1, on)} />
          <line x1={560} y1={-100} x2={560} y2={380} stroke="#11161b" strokeWidth={5} />
          <path d="M 490 450 Q 496 380 560 380 Q 624 380 630 450 Z" fill={C.oro} />
          <rect x={290} y={1150} width={22} height={330} fill="#4A3425" />
          <She x={400} y={1270} pose={SIT} t={t} />
          <rect x={470} y={1300} width={130} height={16} fill="#4A3425" />
          <rect x={440} y={1190} width={620} height={26} rx={6} fill="#5B4636" />
          <rect x={480} y={1216} width={22} height={290} fill="#4A3425" />
          <rect x={980} y={1216} width={22} height={290} fill="#4A3425" />
          <ellipse cx={700} cy={1188} rx={92} ry={12} fill={C.lino} />
          <path d="M 640 1186 Q 700 1110 760 1186 Z" fill={C.linoSombra} />
          {[0, 1, 2].map((i) => <path key={i} d={`M ${672 + i * 28} 1090 q -12 -24 0 -48 q 12 -24 0 -48`} stroke={C.lino} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.35 + 0.2 * Math.sin(t * 2 + i)} />)}
          <g transform="translate(870 1160) rotate(-6)">
            <rect width={60} height={30} rx={6} fill="#0f1418" />
            <rect x={5} y={4} width={50} height={22} rx={4} fill={C.oroClaro} opacity={0.2 + 0.75 * phoneOn} />
            <circle cx={30} cy={15} r={7} fill={C.oro} opacity={phoneOn} />
          </g>
        </Cam>
      </World>
      <Labels t={t} demo />
      <Chip t={t} at={tC - 0.1} text="Día cerrado" x={540} y={330} align="center" c={C.oro} solid size={48} />
    </AbsoluteFill>
  );
};

// 10 · Sin personajes: el móvil con el parte cerrado, la furgoneta parada desenfocada detrás. Solo el rótulo DEMO.
const PhoneEnd: React.FC<SceneProps> = ({ t }) => {
  const p = k(t, 0, 3);
  return (
    <AbsoluteFill>
      <World>
        <rect x={-400} y={-400} width={1880} height={2700} fill={C.hondo} />
        <g style={{ filter: "blur(10px)" }} opacity={0.7} transform="translate(180 1040) scale(1.15)">
          <path d="M 0 300 L 0 80 Q 0 40 40 40 L 420 40 Q 470 40 500 90 L 590 200 Q 610 220 610 260 L 610 300 Z" fill={C.pizarra} />
          <path d="M 430 70 L 490 70 L 560 190 L 430 190 Z" fill="#1A222B" />
          <rect x={30} y={170} width={380} height={18} fill={C.oroOscuro} />
          {[110, 480].map((wx) => <g key={wx}><circle cx={wx} cy={300} r={56} fill="#0A0F14" /><circle cx={wx} cy={300} r={24} fill={C.pizarraClaro} /></g>)}
        </g>
      </World>
      <div style={{ position: "absolute", left: 270, top: 320, width: 540, padding: "38px 20px 30px", boxSizing: "border-box", borderRadius: 64, border: `10px solid ${C.pizarraClaro}`, background: C.noche,
        rotate: `${mix(6, 0, p)}deg`, scale: `${mix(0.92, 1.04, p)}`, boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
        <div style={{ background: C.luz, borderRadius: 28, padding: "28px 32px" }}><PartBody fill={1} check={1} /></div>
      </div>
      <Labels t={t} recreation={false} demo />
      <Headline t={t} at={0.3} text="Lo estamos montando *para instaladores.*" y={1010} size={72} />
    </AbsoluteFill>
  );
};

// 11 · Cierre de marca y la palabra para comentar.
const End: React.FC<SceneProps> = ({ t, w }) => (
  <AbsoluteFill>
    <EndCard t={t} at={0} text="Te lo enseñamos en una *videollamada*." />
    <CommentBox t={t} at={w(11, /Comenta/) - 0.3} keyword="PARTE" prompt="Comenta PARTE" y={1010} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1400, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: "0.1em", color: C.lino, opacity: 0.85 * inout(t, 0.6, 99) }}>Recreación ficticia · voz generada con IA</div>
  </AbsoluteFill>
);

const scenes: SceneDef[] = [
  { from: 0, C: Hook }, { from: 1, C: Leaves }, { from: 2, C: Drive }, { from: 3, C: KitchenArrive }, { from: 4, C: KitchenForget },
  { from: 5, C: Respect }, { from: 6, C: DoorPhone }, { from: 8, C: ClosePie }, { from: 9, C: Home }, { from: 10, C: PhoneEnd }, { from: 11, C: End },
];
const KEYS = ["puerta", "cocina", "cena", "obra", "recoge", "luego", "casa", "libreta", "acuerda", "mal", "forma", "termina", "delante", "pie", "furgoneta", "cerrado", "montando", "instaladores", "parte", "videollamada"];

const Ep: React.FC<CurioProps> = (p) => {
  const W = (i: number, re: RegExp) => p.lines[i]?.words?.find((x) => re.test(x.w))?.s ?? p.lines[i]?.start ?? 0;
  const sfx = [
    { at: 0.4, s: "tick", v: 0.18 }, { at: 1.4, s: "tick", v: 0.18 }, { at: W(0, /^cena/), s: "pop", v: 0.3 },
    { at: W(1, /recoge/), s: "tick", v: 0.3 }, { at: W(3, /libreta/), s: "tick", v: 0.22 },
    { at: W(6, /móvil/), s: "pop", v: 0.25 }, { at: W(7, /Rellena/) + 0.3, s: "tick", v: 0.18 }, { at: W(7, /Rellena/) + 0.8, s: "tick", v: 0.18 }, { at: W(7, /Rellena/) + 1.3, s: "tick", v: 0.18 },
    { at: W(8, /cierra/), s: "ding", v: 0.3 }, { at: W(9, /cerrado/), s: "ding", v: 0.2 }, { at: W(10, /Ese/), s: "pop", v: 0.25 }, { at: W(11, /Comenta/), s: "pop", v: 0.3 },
  ];
  return <PQReel {...p} scenes={scenes} keys={KEYS} sfx={sfx} music={`music/${id}.wav`} captionsY={1660} captionsUntil={(p.lines[11]?.start ?? 999) - 0.15} />;
};
export default Ep;
