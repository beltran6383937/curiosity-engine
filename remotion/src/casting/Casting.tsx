// Casting de personajes nuevos (fotograma 0 = Pepa la paloma, 1 = Friolín el split, 2 = Don Termo). Solo para elegir diseño.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

const INK = "#1a1a1a", W = 8;
const Fondo: React.FC<{ src: string }> = ({ src }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", width: 1080, height: 1920, objectFit: "cover", filter: "blur(2px) saturate(0.9)" }} />
);
const Nombre: React.FC<{ t: string; s: string }> = ({ t, s }) => (
  <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: "Arial Black, Arial", color: "#fff",
    WebkitTextStroke: "10px #111", paintOrder: "stroke fill" }}>
    <div style={{ fontSize: 110 }}>{t}</div><div style={{ fontSize: 48, marginTop: 10 }}>{s}</div>
  </div>
);

// Pepa: paloma gorda de azotea madrileña, jefa de obra que lo supervisa todo con cara de no impresionarse
const Pepa = () => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    <ellipse cx={560} cy={1700} rx={260} ry={40} fill="#000" opacity={0.25} />
    <g stroke={INK} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round">
      {/* patas */}
      <path d="M480 1560 L470 1690 M470 1690 l-50 15 M470 1690 l10 22 M470 1690 l45 10" fill="none" stroke="#e46a7a" strokeWidth={22} />
      <path d="M620 1560 L630 1690 M630 1690 l-45 12 M630 1690 l12 22 M630 1690 l52 8" fill="none" stroke="#e46a7a" strokeWidth={22} />
      {/* cola */}
      <path d="M760 1330 L960 1420 L930 1470 L740 1440 Z" fill="#6f7885" />
      <path d="M915 1412 L890 1462" stroke="#2c323a" strokeWidth={14} />
      {/* cuerpo */}
      <path d="M330 1220 C300 1420 380 1600 560 1600 C740 1600 820 1460 790 1300 C760 1150 600 1080 470 1100 C380 1115 340 1160 330 1220 Z" fill="#a8b0bb" />
      {/* chaleco reflectante */}
      <path d="M352 1300 C350 1450 420 1560 560 1570 C700 1575 770 1470 780 1330 L700 1270 L560 1330 L420 1270 Z" fill="#d7f34a" />
      <path d="M362 1420 C470 1450 660 1450 776 1420" fill="none" stroke="#c9ccd1" strokeWidth={30} />
      <rect x={470} y={1330} width={180} height={62} rx={10} fill="#fff" />
      <text x={560} y={1374} textAnchor="middle" fontFamily="Arial Black" fontSize={40} fill="#e8590c" stroke="none">PEPA</text>
      {/* ala con portapapeles */}
      <path d="M700 1240 C840 1260 860 1420 770 1480 C730 1420 690 1330 700 1240 Z" fill="#8c95a1" />
      <rect x={760} y={1250} width={150} height={200} rx={10} fill="#a0703c" transform="rotate(12 835 1350)" />
      <rect x={780} y={1280} width={110} height={150} fill="#fff" transform="rotate(12 835 1350)" />
      <path d="M800 1320 h70 M798 1350 h70 M796 1380 h50" stroke="#888" strokeWidth={6} transform="rotate(12 835 1350)" />
      {/* cuello tornasol y cabeza */}
      <path d="M380 1130 C370 1040 420 980 470 980 C560 980 620 1040 610 1140 C560 1190 440 1190 380 1130 Z" fill="url(#torna)" />
      <circle cx={480} cy={900} r={150} fill="#a8b0bb" />
      {/* pico */}
      <path d="M340 905 C300 915 270 935 255 955 C300 960 330 950 350 940 Z" fill="#3a3a3a" />
      <ellipse cx={352} cy={895} rx={26} ry={18} fill="#f1efe9" />
      {/* ojo naranja de paloma, párpado a media asta */}
      <circle cx={440} cy={870} r={46} fill="#f08c1a" />
      <circle cx={430} cy={872} r={14} fill={INK} />
      <path d="M392 862 C410 820 470 820 488 862 Z" fill="#8c95a1" />
      <path d="M392 862 L488 862" />
      {/* casco */}
      <path d="M360 790 C370 690 600 690 610 790 Z" fill="#ffd21f" />
      <path d="M330 795 L640 795" strokeWidth={18} stroke="#e6b800" />
      <path d="M330 795 L640 795" fill="none" />
    </g>
    <defs>
      <linearGradient id="torna" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3f8f6e" /><stop offset="0.5" stopColor="#7b4f9e" /><stop offset="1" stopColor="#3f8f6e" />
      </linearGradient>
    </defs>
  </svg>
);

// Friolín: el split de la pared. La lama es la boca, gotea por una esquina y odia que le pongan a 16°
const Friolin = () => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    <g stroke={INK} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round">
      <rect x={140} y={700} width={800} height={300} rx={60} fill="#f6f6f2" />
      <path d="M160 760 C400 745 680 745 920 760" fill="none" stroke="#d9d9d2" strokeWidth={10} />
      {/* ojos LED cansados */}
      <ellipse cx={420} cy={830} rx={62} ry={70} fill="#fff" />
      <ellipse cx={660} cy={830} rx={62} ry={70} fill="#fff" />
      <circle cx={432} cy={846} r={26} fill="#1f6fd1" /><circle cx={648} cy={846} r={26} fill="#1f6fd1" />
      <circle cx={440} cy={838} r={8} fill="#fff" stroke="none" /><circle cx={656} cy={838} r={8} fill="#fff" stroke="none" />
      <path d="M356 812 C380 770 470 770 484 812 Z" fill="#e2e2dc" /><path d="M596 812 C610 770 700 770 724 812 Z" fill="#e2e2dc" />
      <path d="M350 760 L480 778" strokeWidth={14} /><path d="M600 778 L730 752" strokeWidth={14} />
      {/* lama-boca con aletas */}
      <path d="M260 940 C420 1010 660 1010 820 940 L800 990 C640 1060 440 1060 280 990 Z" fill="#2b2f36" />
      <path d="M330 968 L345 1015 M420 985 L428 1035 M510 990 L512 1040 M600 988 L596 1038 M690 978 L680 1025" stroke="#5a606a" strokeWidth={7} />
      {/* bigote de escarcha */}
      <path d="M440 930 C480 905 520 925 540 935 C560 925 600 905 640 930 C600 960 560 950 540 940 C520 950 480 960 440 930 Z" fill="#d6ecff" />
      {/* pantalla y etiqueta */}
      <rect x={810} y={800} width={90} height={50} rx={8} fill="#0f2a1b" />
      <text x={855} y={838} textAnchor="middle" fontFamily="Arial Black" fontSize={34} fill="#5dff9a" stroke="none">16°</text>
      <text x={240} y={985} fontFamily="Arial Black" fontSize={30} fill="#9aa0a6" stroke="none">FRIOLÍN</text>
      {/* gota y charco */}
      <path d="M905 1000 C905 1040 885 1060 885 1080 C885 1105 925 1105 925 1080 C925 1060 905 1040 905 1000 Z" fill="#8fd0ff" />
      <ellipse cx={905} cy={1700} rx={90} ry={18} fill="#8fd0ff" opacity={0.7} />
      {/* cable-brazo con mando */}
      <path d="M180 990 C120 1150 220 1250 300 1260" fill="none" stroke="#f6f6f2" strokeWidth={26} />
      <path d="M180 990 C120 1150 220 1250 300 1260" fill="none" />
      <rect x={290} y={1210} width={70} height={140} rx={18} fill="#fff" transform="rotate(-20 325 1280)" />
      <rect x={302} y={1228} width={46} height={30} rx={4} fill="#0f2a1b" transform="rotate(-20 325 1280)" />
    </g>
  </svg>
);

// Don Termo: termostato redondo de pasillo, señor mayor muy dramático; si le tocas un grado, se ofende
const DonTermo = () => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    <g stroke={INK} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round">
      <circle cx={540} cy={1000} r={300} fill="#efe6d4" />
      <circle cx={540} cy={1000} r={250} fill="#f8f3e8" />
      {[...Array(24)].map((_, i) => { const a = (i / 24) * 2 * Math.PI; return <path key={i} d={`M${540 + Math.cos(a) * 262} ${1000 + Math.sin(a) * 262} L${540 + Math.cos(a) * 288} ${1000 + Math.sin(a) * 288}`} strokeWidth={5} />; })}
      {/* cejas pobladas y ojos */}
      <path d="M380 860 C420 820 480 830 500 860" strokeWidth={22} stroke="#f2f2f2" />
      <path d="M580 860 C600 830 660 820 700 860" strokeWidth={22} stroke="#f2f2f2" />
      <ellipse cx={450} cy={910} rx={44} ry={50} fill="#fff" /><ellipse cx={630} cy={910} rx={44} ry={50} fill="#fff" />
      <circle cx={460} cy={922} r={18} fill={INK} /><circle cx={620} cy={922} r={18} fill={INK} />
      <path d="M408 900 C420 870 490 870 494 900 Z" fill="#e6dcc6" /><path d="M586 900 C600 870 666 870 674 900 Z" fill="#e6dcc6" />
      {/* pantalla LCD = boca */}
      <rect x={420} y={990} width={240} height={130} rx={18} fill="#a8c49a" />
      <text x={540} y={1085} textAnchor="middle" fontFamily="Courier New" fontWeight="bold" fontSize={92} fill="#26341f" stroke="none">21°</text>
      {/* bigote canoso */}
      <path d="M400 985 C450 940 520 960 540 975 C560 960 630 940 680 985 C630 1010 570 1000 540 990 C510 1000 450 1010 400 985 Z" fill="#f2f2f2" />
      {/* gafas en la punta */}
      <circle cx={450} cy={915} r={60} fill="none" strokeWidth={6} /><circle cx={630} cy={915} r={60} fill="none" strokeWidth={6} />
      <path d="M510 915 L570 915" strokeWidth={6} />
      {/* bracitos */}
      <path d="M250 1060 C180 1120 190 1200 240 1230" fill="none" strokeWidth={20} stroke="#efe6d4" /><path d="M250 1060 C180 1120 190 1200 240 1230" fill="none" />
      <path d="M830 1060 C900 1000 920 940 890 880" fill="none" strokeWidth={20} stroke="#efe6d4" /><path d="M830 1060 C900 1000 920 940 890 880" fill="none" />
      <circle cx={240} cy={1235} r={26} fill="#fff" /><circle cx={888} cy={872} r={26} fill="#fff" />
      <text x={540} y={1210} textAnchor="middle" fontFamily="Arial Black" fontSize={30} fill="#9b8f78" stroke="none">DON TERMO</text>
    </g>
  </svg>
);

export const Casting: React.FC = () => {
  const f = useCurrentFrame();
  if (f === 0) return <AbsoluteFill><Fondo src="tuerca/fondo-azotea.png" /><Pepa /><Nombre t="PEPA" s="la paloma jefa de obra" /></AbsoluteFill>;
  if (f === 1) return <AbsoluteFill><Fondo src="tuerca/fondo-cocina.png" /><Friolin /><Nombre t="FRIOLÍN" s="el split que gotea" /></AbsoluteFill>;
  return <AbsoluteFill><Fondo src="tuerca/fondo-cocina.png" /><DonTermo /><Nombre t="DON TERMO" s="el termostato ofendido" /></AbsoluteFill>;
};
