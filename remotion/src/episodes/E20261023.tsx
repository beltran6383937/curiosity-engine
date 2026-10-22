// Episodio 2026-10-23 · «¿Coger el teléfono subido a la escalera o dejarlo sonar?» (pilar problema_real).
// Guion, ganchos y claims: episodes/2026-10-23/episode.json · storyboard: episodes/2026-10-23/storyboard.md.
// Recreación ficticia rotulada; la parte de la IA es la DEMO de P&Q Field Operations (datos ficticios).
import React from "react";
import { AbsoluteFill } from "remotion";
import { PQReel, World, Cam, Label, BigNum, Chip, SourceNote, CallCard, Bubble, Toast, ChatGlyph, AgendaCard, ResultList, Tap, CommentBox, EndCard, Card,
  Burst, Impact, SpeedLines, Flash, C, MONO, SANS, k, mix, inout, shake, type CurioProps, type SceneProps, type SceneDef } from "../pq";
import { Room, Kitchen, Worker, Client, Ladder, Toolbox, PhoneProp, POSE, BUST, poseAt, blendBust, rungPos } from "../pqworld";

export const id = "2026-10-23";
const LX = 600, LY = 1700; // pie de la escalera
const [RX, RY] = rungPos(LX, LY, 7);
const HIP: [number, number] = [RX, RY - 245];
// cadera del técnico cuando la escalera gira `tilt` grados sobre su pie
const onLadder = (tilt: number): [number, number] => {
  const a = (tilt * Math.PI) / 180, dx = HIP[0] - LX, dy = HIP[1] - LY;
  return [LX + dx * Math.cos(a) - dy * Math.sin(a), LY + dx * Math.sin(a) + dy * Math.cos(a)];
};
const Dim: React.FC<{ o: number }> = ({ o }) => <rect x={-600} y={-600} width={2400} height={3200} fill={C.noche} opacity={o} />;

// 0 · Gancho: el móvil ya suena en el bolsillo desde el primer fotograma, con las dos opciones rotuladas.
const Hook: React.FC<SceneProps> = ({ t }) => (
  <AbsoluteFill>
    <World>
      <Cam x={mix(600, 610, k(t, 0, 4))} y={mix(820, 790, k(t, 0, 4))} z={mix(1.22, 1.34, k(t, 0, 5))}>
        <Room t={t} />
        <Toolbox x={300} y={1560} />
        <Ladder x={LX} y={LY} />
        <Worker x={HIP[0]} y={HIP[1]} pose={POSE.work} t={t} ring={1} />
      </Cam>
    </World>
    <Label text="RECREACIÓN" t={t} at={-1} />
    <Chip t={t} at={-0.3} text="¿Cogerlo?" x={70} y={320} c={C.alerta} size={50} />
    <Chip t={t} at={0.25} text="¿O dejarlo sonar?" x={70} y={436} c={C.oro} size={50} />
  </AbsoluteFill>
);

// 1-2 · Opción uno: lo coge, suelta una mano, la escalera se mueve y cae (golpe sincronizado con «suelo»).
const OptionOne: React.FC<SceneProps> = ({ t, w }) => {
  const tA = w(1, /coges/), tSu = w(2, /Sueltas/), tMueve = w(2, /mueve/), tSuelo = w(2, /suelo/);
  const td = tMueve + 0.3;
  const wob = t < tMueve ? 0 : t < td ? Math.sin((t - tMueve) * 22) * 3.5 : 0;
  const tip = k(t, td, Math.max(0.2, tSuelo - td), (n) => n * n);
  const tilt = wob - 22 * tip;
  const hip0 = onLadder(t < td ? tilt : wob);
  const land: [number, number] = [560, 1600];
  const fp = k(t, td, Math.max(0.2, tSuelo - td), (n) => n * n);
  const hip: [number, number] = t < td ? hip0 : [mix(hip0[0], land[0], fp), mix(hip0[1], land[1], fp)];
  const bodyRot = t < td ? tilt : mix(0, -74, fp);
  const pose = poseAt(t, [[0, POSE.work], [tA - 0.15, POSE.reach], [tSu, POSE.release], [td, POSE.fall]], 0.3);
  const sh = shake(t, tSuelo, 0.7, 34);
  const cy = mix(800, 1400, k(t, td, Math.max(0.3, tSuelo - td + 0.2)));
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(630, 600, k(t, td, 0.8))} y={cy} z={mix(1.42, 1.1, k(t, td - 0.2, 0.9))} sh={sh}>
          <Room t={t} />
          <Toolbox x={300} y={1560} />
          <Ladder x={LX} y={LY} tilt={tilt} />
          <Worker x={hip[0]} y={hip[1]} pose={pose} rot={bodyRot} t={t} ring={t < tA ? 1 : 0} phoneInHand={t >= tA + 0.1} screen={1} />
          <Impact x={land[0] - 40} y={1690} t={t} at={tSuelo} c={C.lino} size={300} />
          <Burst x={land[0] - 40} y={1690} t={t} at={tSuelo} seed="polvo" n={34} c={[C.lino, C.linoSombra, C.pizarraClaro]} speed={950} />
          <Burst x={land[0] + 40} y={1680} t={t} at={tSuelo + 0.02} seed="tornillos" n={12} c={[C.oro, "#9AA3AA"]} speed={1300} size={14} />
        </Cam>
        <SpeedLines t={t} o={t > td && t < tSuelo ? 0.6 : 0} seed="caida" />
      </World>
      <Flash t={t} at={tSuelo} />
      <Label text="RECREACIÓN" t={t} at={-1} />
      <BigNum t={t} at={0.05} n="1" label="Lo coges" c={C.alerta} until={tSu} />
      <SourceNote t={t} at={tSu} source="RD 1215/1997 · ANEXO II 4.2.3" text="En una escalera de mano, siempre un punto de apoyo y de sujeción seguros." y={310} w={460} until={tMueve} />
    </AbsoluteFill>
  );
};

// 3 · Lo que cuesta: baja, obra parada y el cliente que se va.
const Cost: React.FC<SceneProps> = ({ t, w }) => {
  const tP = w(3, /parada/), tC = w(3, /cliente/), tO = w(3, /otro/);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={560} y={1400} z={mix(1.04, 1.08, k(t, 0, 4))} r={mix(-1.5, 0, k(t, 0, 3))}>
          <Room t={t} />
          <Toolbox x={300} y={1560} open={0.3} />
          <Dim o={0.6} />
          <Ladder x={LX + 120} y={LY + 40} tilt={-88} />
          <Worker x={560} y={1600} pose={POSE.fall} rot={-74} t={t} />
        </Cam>
      </World>
      <Label text="RECREACIÓN" t={t} at={-1} />
      <Card t={t} at={0.05} x={110} y={320} w={860}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", color: C.alerta }}>PARTE DE BAJA</div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.pizarraClaro }}>SIN PODER TRABAJAR</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginTop: 18 }}>
          {Array.from({ length: 28 }, (_, i) => {
            const x = k(t, 0.2 + i * 0.02, 0.12);
            return (
              <div key={i} style={{ height: 50, borderRadius: 10, background: i % 7 > 4 ? C.linoSombra : C.lino, display: "grid", placeItems: "center", position: "relative" }}>
                <svg width="34" height="34" viewBox="0 0 24 24" style={{ opacity: x, scale: `${mix(1.6, 1, x)}` }}><path d="M5 5L19 19M19 5L5 19" stroke={C.alerta} strokeWidth="3.4" strokeLinecap="round" /></svg>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ position: "absolute", left: -100, right: -100, top: 690, height: 92, rotate: "-6deg", translate: `${mix(-1300, 0, k(t, tP - 0.15, 0.4))}px 0`,
        background: `repeating-linear-gradient(-45deg, ${C.aviso} 0 46px, ${C.noche} 46px 92px)`, display: "grid", placeItems: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 56, letterSpacing: "0.2em", color: C.noche, background: C.aviso, padding: "0 30px" }}>OBRA PARADA</div>
      </div>
      <Bubble t={t} at={tC - 0.1} who="cliente" label="CLIENTE DE LA OBRA" text="¿Cuándo vuelves a terminar?" x={90} y={830} w={760} />
      <Bubble t={t} at={tO - 0.25} who="cliente" text="Vale. Buscaré a otro." x={90} y={975} w={760} />
    </AbsoluteFill>
  );
};

// 4 · Opción dos: sigue arriba y el móvil suena solo encima de la caja de herramientas.
const OptionTwo: React.FC<SceneProps> = ({ t, w }) => {
  const tS = w(4, /sonar/);
  const arms = Math.sin(t * 5) * 6;
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(560, 600, k(t, 0, 3))} y={mix(1120, 1080, k(t, 0, 3))} z={mix(1.0, 1.08, k(t, 0, 3))}>
          <Room t={t} />
          <Toolbox x={300} y={1560} />
          <PhoneProp x={330} y={1214} t={t} ring={1} s={1.1} rot={-70} />
          <Ladder x={LX} y={LY} />
          <Worker x={HIP[0]} y={HIP[1]} pose={{ ...POSE.work, hN: [105 + arms, -350], hF: [82 - arms, -338] }} t={t} />
        </Cam>
      </World>
      <Label text="RECREACIÓN" t={t} at={-1} />
      <BigNum t={t} at={0.05} n="2" label="Lo dejas sonar" c={C.oro} />
      <Toast t={t} at={tS + 0.15} app="Teléfono" title="Llamada perdida" body="Número desconocido" y={570} w={520} c={C.alerta} />
    </AbsoluteFill>
  );
};

// 5-6 · La llamada era un cliente nuevo: cuelga, busca y llama al siguiente. El primero se apaga.
const NewClient: React.FC<SceneProps> = ({ t, w }) => {
  const tN = w(5, /nuevo/), tCu = w(5, /Cuelga/), tG = w(5, /Google/), tV = w(6, /vuelve/);
  const pose = blendBust(BUST.ear, BUST.look, k(t, tCu, 0.5));
  const tap = tG + 0.55;
  return (
    <AbsoluteFill>
      <World>
        <Cam x={540} y={mix(830, 800, k(t, 0, 4))} z={mix(1.04, 1.1, k(t, 0, 5))}>
          <Kitchen t={t}>
            <Client x={540} y={1300} s={1.42} pose={pose} t={t} glow={1} />
          </Kitchen>
        </Cam>
      </World>
      <Label text="RECREACIÓN" t={t} at={-1} />
      <CallCard t={t} at={-0.2} x={170} y={320} w={740} name="Electricidad Martín" state={t < tCu ? "llamando" : "colgada"} sub="Negocio ficticio" until={tG} />
      <Chip t={t} at={tN - 0.1} text="Cliente nuevo" x={540} y={560} align="center" c={C.oro} solid until={tG} />
      <ResultList t={t} at={tG - 0.2} y={300} query="electricista cerca" tap={1} tapAt={tap} gone={0} goneAt={tV - 0.9} until={tV - 0.05}
        items={[{ name: "Electricidad Martín", sub: "No contesta" }, { name: "Instalaciones Vega", sub: "Abierto ahora" }, { name: "Electro Norte", sub: "Abierto ahora" }]} />
      <Tap t={t} at={tap} x={890} y={300 + 92 + 125 + 62} />
      <Chip t={t} at={tV + 0.1} text="Cita con otro instalador" x={540} y={340} align="center" c={C.alerta} solid />
    </AbsoluteFill>
  );
};

// 7-8 · Opción tres: la IA contesta mientras él sigue arriba, pregunta, da cita y le resume por WhatsApp.
const OptionThree: React.FC<SceneProps> = ({ t, w }) => {
  const tIA = w(7, /IA/), tP = w(8, /Pregunta/), tCi = w(8, /cita/), tW = w(8, /WhatsApp/);
  const arms = Math.sin(t * 5) * 6;
  const pull = k(t, tP - 0.3, 0.9);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={mix(700, 640, pull)} y={mix(860, 1000, pull)} z={mix(1.3, 1.02, pull)}>
          <Room t={t} lamp={0} />
          <Toolbox x={300} y={1560} />
          <Ladder x={LX} y={LY} />
          <Worker x={HIP[0]} y={HIP[1]} pose={{ ...POSE.work, hN: [105 + arms, -350], hF: [82 - arms, -338] }} t={t} ring={t < tIA ? 1 : 0} />
          <Dim o={mix(0, 0.5, pull)} />
        </Cam>
      </World>
      <Label text="DEMO · DATOS FICTICIOS" t={t} at={-1} c={C.oro} />
      <BigNum t={t} at={0.05} n="3" label="Que lo coja una IA" c={C.oro} until={tIA + 0.7} />
      <CallCard t={t} at={tIA + 0.5} x={110} y={1010} w={860} name="Recepción IA" state="ia" since={tIA + 0.5} sub="Contesta mientras tú trabajas" until={tW} />
      <Bubble t={t} at={tP - 0.05} who="cliente" label="CLIENTE" text="Se me ha ido la luz en la cocina." x={90} y={620} w={860} until={tCi} />
      <Bubble t={t} at={tP + 0.75} who="ia" label="IA" text="¿Le va bien mañana a las 10:00?" x={130} y={800} w={860} until={tCi} />
      <AgendaCard t={t} at={tCi - 0.1} x={150} y={680} w={780} day="MAÑANA" time="10:00" title="Cocina sin luz" who="Marta · cliente ficticia" />
      <Toast t={t} at={tW - 0.1} app="WhatsApp" title="Resumen de la llamada" body="Marta · cocina sin luz · mañana 10:00 · dirección guardada" y={320} c={C.ok} icon={<ChatGlyph />} />
    </AbsoluteFill>
  );
};

// 9 · Baja con el trabajo hecho (la lámpara se enciende) y un cliente más en la agenda.
const Done: React.FC<SceneProps> = ({ t, w }) => {
  const tH = w(9, /hecho/), tAg = w(9, /agenda/);
  const down = k(t, 0.05, 0.7);
  const floor: [number, number] = [515, 1336]; // junto a la pared: queda por encima de los subtítulos
  const hip: [number, number] = [mix(HIP[0], floor[0], down), mix(HIP[1], floor[1], down) - Math.sin(down * Math.PI) * 40];
  const pose = poseAt(t, [[0, POSE.work], [0.05, POSE.idle], [tAg - 0.4, POSE.stand]], 0.4);
  return (
    <AbsoluteFill>
      <World>
        <Cam x={620} y={mix(1260, 1290, k(t, 0, 3))} z={mix(0.9, 0.95, k(t, 0, 4))}>
          <Room t={t} lamp={k(t, tH - 0.3, 0.6)} />
          <Toolbox x={300} y={1560} open={0.2} />
          <Ladder x={LX} y={LY} />
          <Worker x={hip[0]} y={hip[1]} s={mix(1, 0.92, down)} pose={pose} t={t} phoneInHand={t >= tAg - 0.3} screen={1} />
        </Cam>
      </World>
      <Label text="DEMO · DATOS FICTICIOS" t={t} at={-1} c={C.oro} />
      <Chip t={t} at={tH - 0.1} text="Trabajo hecho" x={540} y={320} align="center" c={C.oro} solid />
      <AgendaCard t={t} at={tAg - 0.15} x={150} y={440} w={780} day="MAÑANA" time="10:00" title="Cocina sin luz" who="Cliente nuevo · ficticio" tag="+1 CLIENTE EN LA AGENDA" />
    </AbsoluteFill>
  );
};

// 10-11 · Cierre: qué estamos montando y la palabra para comentar.
const End: React.FC<SceneProps> = ({ t, w }) => (
  <AbsoluteFill>
    <EndCard t={t} at={0} text="Lo estamos montando *para instaladores.*" />
    <CommentBox t={t} at={w(11, /Comenta/) - 0.5} keyword="LLAMADA" prompt="Te escribimos por privado con la demo" y={1010} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1400, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: "0.1em", color: C.lino, opacity: 0.85 * inout(t, 0.6, 99) }}>RECREACIÓN FICTICIA · VOZ GENERADA CON IA</div>
  </AbsoluteFill>
);

const scenes: SceneDef[] = [
  { from: 0, C: Hook }, { from: 1, C: OptionOne }, { from: 3, C: Cost }, { from: 4, C: OptionTwo },
  { from: 5, C: NewClient }, { from: 7, C: OptionThree }, { from: 9, C: Done }, { from: 10, C: End },
];
const KEYS = ["escalera", "sonar", "caro", "coges", "suelo", "baja", "parada", "otro", "nuevo", "google", "vuelve", "ia", "arriba", "cita", "whatsapp", "agenda"];

const Ep: React.FC<CurioProps> = (p) => {
  const W = (i: number, re: RegExp) => p.lines[i]?.words?.find((x) => re.test(x.w))?.s ?? p.lines[i]?.start ?? 0;
  const sfx = [
    { at: 0, s: "ring", v: 0.32 }, { at: 1.6, s: "ring", v: 0.22 }, { at: W(1, /coges/), s: "pop", v: 0.3 }, { at: W(2, /mueve/), s: "swell", v: 0.35 },
    { at: W(2, /suelo/), s: "impact", v: 0.55 }, { at: W(3, /baja/), s: "tick", v: 0.25 }, { at: W(3, /parada/), s: "whoosh", v: 0.3 }, { at: W(4, /sonar/), s: "ring", v: 0.25 },
    { at: W(5, /Google/) + 0.55, s: "tick", v: 0.3 }, { at: W(7, /IA/) + 0.5, s: "ding", v: 0.28 }, { at: W(8, /cita/), s: "pop", v: 0.3 }, { at: W(8, /WhatsApp/), s: "notify", v: 0.3 },
    { at: W(9, /agenda/), s: "ding", v: 0.25 }, { at: W(11, /Comenta/), s: "pop", v: 0.3 },
  ];
  return <PQReel {...p} scenes={scenes} keys={KEYS} sfx={sfx} music={`music/${id}.wav`} captionsUntil={(p.lines[10]?.start ?? 999) - 0.15} />;
};
export default Ep;
