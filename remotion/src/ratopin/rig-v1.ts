// Ratopín · rig v2 sobre las piezas v1 (dibujos de ChatGPT del 25-10-2026, recortados y a escala del cuerpo en
// public/ratopin/v1/e). Coordenadas en px de cada imagen; el cuerpo entero comparte las de cuerpo.png (994×936):
// capas de ratopin-universe/tools/cuerpo2.py. Los brazos ya no son recortes: se dibujan por código (arm.tsx) entre el
// hombro, el codo y la muñeca, y las manos dibujadas se encajan en la muñeca. Medidas: ratopin-universe/ARCHITECTURE.md.
import type { FaceRig, EyeSpot } from "./face";
import type { MouthRig } from "./mouth";

export const E = "ratopin/v1/e/";
type P = readonly [number, number];

export const TORSO_PIVOT: P = [560, 430];  // centro del cinturón: inclinación y respiración del torso
export const TAIL_AT: P = [300, 470];
// Cola en 4 segmentos (ratopin-universe/tools/cola.py): articulación de cada uno y enganche del siguiente.
export const TAIL: { pivot: P; next?: P }[] = [
  { pivot: [8, 40.5], next: [150, 49.5] }, { pivot: [0, 49.5], next: [140, 58] }, { pivot: [0, 58], next: [130, 54.5] }, { pivot: [0, 54.5] },
];

// Brazos de dos huesos, en px del torso. El hombro es el centro de la boca de la manga (la parte del brazo que queda
// dentro de la manga no se ve); l1/l2 = brazo y antebrazo (iguales, como el brazo de verdad: la v1 tenía 179/262);
// w = grosor en hombro, codo y muñeca.
export type ArmRig = { shoulder: P; l1: number; l2: number; w: readonly [number, number, number] };
export const NEAR: ArmRig = { shoulder: [392, 214], l1: 200, l2: 205, w: [76, 64, 56] }; // más fino que la boca de la manga: se ve el interior
export const FAR: ArmRig = { shoulder: [786, 190], l1: 200, l2: 205, w: [74, 64, 57] };
// Boca de la manga cercana (elipse ajustada a hueco-cerca.png, px del torso). Las mangas se dibujan cerradas (SleeveCap).
// side = lado (±eje menor) donde el aro es el contorno exterior de la manga (comprobado con el alfa de la capa).
export type SleeveMouth = { c: P; r: P; deg: number; side: 1 | -1 };
export const SLEEVE_MOUTH: SleeveMouth = { c: [383, 223], r: [70, 27.5], deg: 33.8, side: 1 };
// Boca de la manga lejana (elipse ajustada a hueco-lejos.png).
export const FAR_SLEEVE_MOUTH: SleeveMouth = { c: [787, 190], r: [58.5, 20.8], deg: 111.3, side: -1 };
// La manga cercana (con su boca y el hombro) gira alrededor de la costura de arriba cuando el brazo se levanta.
export const SLEEVE_PIVOT: P = [456, 40];

// Manos: el muñón de la muñeca es la articulación. anchor = centro del extremo del muñón; dir = dirección del muñón hacia
// la mano (grados, en la imagen); stub/stubW = largo y ancho del muñón, que tapa el extremo del antebrazo.
export type Hand = { src: string; anchor: P; dir: number; stub: number; stubW: number; size: P }; // size = px del PNG
const hand = (file: string, anchor: P, dir: number, stub: number, stubW: number, size: P): Hand => ({ src: `${E}${file}.png`, anchor, dir, stub, stubW, size });
// Medido sobre la silueta de cada dibujo (ancho del muñón a lo largo de su eje).
export const NEAR_HANDS = {
  reposo: hand("cerca-mano-reposo", [28.5, 25.3], 55.2, 38, 52, [141, 177]),
  abierta: hand("cerca-mano-abierta", [24.4, 24.4], 51, 46, 52, [198, 184]),
  coger: hand("cerca-mano-coger", [25.5, 20.5], 63.5, 34, 54, [171, 139]),
  agarre: hand("cerca-mano-agarre", [18.9, 193.7], -50.7, 34, 55, [181, 217]), // la mano de cerca-mano-pantalla sin el móvil
} as const;
export const FAR_HANDS = {
  llave: hand("lejos-mano-llave", [23.8, 217.5], -37.9, 10, 57, [217, 275]),
  llave2: hand("lejos-mano-llave2", [17.7, 206.2], -33, 8, 52, [234, 270]),
} as const;
export type NearHand = keyof typeof NEAR_HANDS;
export type FarHand = keyof typeof FAR_HANDS;
// Boca de la llave (donde muerde la tuerca) relativa al anchor de la mano, en px de la imagen sin girar.
export const JAW: Record<FarHand, P> = { llave: [159.2, -157.5], llave2: [187.3, -151.2] };

// Móvil (por código), en px del dibujo de la mano de agarre: centro, ancho × alto del contorno exterior y giro.
export const PHONE = { c: [114, 105.5] as P, size: [86, 185] as P, deg: 11.5 };
// Bolsillo del peto (px del torso): el móvil está dentro con la pantalla hacia fuera; por debajo del borde del bolsillo
// lo tapa la tela. POCKET = contorno de la tela delantera (borde de arriba primero).
export const POCKET: P[] = [[560, 197], [700, 200], [703, 236], [700, 312], [566, 310], [562, 240]];

// Cabezas de sustitución (giro de perfil derecho a perfil izquierdo). La articulación es la base del cuello; drop = cuánto
// baja cada una dentro del cuello de la camiseta para que el cuello nunca quede corto ni flotando.
export const HEAD_AT: P = [545, 50];
export const HEADS: Record<string, { src: string; pivot: P; drop: number }> = {
  H1: { src: `${E}cabeza-1.png`, pivot: [246, 415], drop: 22 },
  H2: { src: `${E}cabeza-2.png`, pivot: [222, 420], drop: 22 },
  H3: { src: `${E}cabeza-3.png`, pivot: [212, 420], drop: 22 },
  H4: { src: `${E}cabeza-4.png`, pivot: [210, 414], drop: 22 },
  H5: { src: `${E}cabeza-5.png`, pivot: [246, 417], drop: 30 },
};
export const HEAD_SIZE: Record<string, P> = { H1: [504, 438], H2: [439, 442], H3: [425, 443], H4: [425, 436], H5: [480, 439] };
const eyes = (...e: [number, number, number, number][]): EyeSpot[] => e.map(([cx, cy, rx, ry]) => ({ cx, cy, rx, ry }));
const face = (n: number, e: EyeSpot[]): FaceRig => ({
  eyes: e, mask: `${E}ojos-${n}.png`,
  brows: e.map((s) => ({ x: s.cx, y: s.cy - s.ry - 18, len: Math.max(s.rx * 2.1, 34) })),
});
export const FACES: Record<string, FaceRig> = {
  H1: face(1, eyes([255.6, 183.6, 32.4, 45.6], [339.6, 171, 10.8, 37.8])),
  H2: face(2, eyes([213, 190.8, 31.8, 46.8], [313.2, 180.6, 16.8, 40.2])),
  H3: face(3, eyes([165.6, 190.2, 28.8, 46.2], [279, 189, 25.8, 46.2])),
  H4: face(4, eyes([136.2, 175.8, 17.4, 37.8], [232.8, 186, 31.2, 46.8])),
  H5: face(5, eyes([159, 177.6, 12.6, 38.4], [243, 192, 31.8, 46.8])),
};
// Bocas por código (mouth.tsx), medidas sobre cabeza-1 (mira a la derecha) y cabeza-5 (a la izquierda). El resto de
// cabezas son dibujos de paso del giro (un dibujo cada una) y llevan la boca de su dibujo.
export const MOUTHS: Record<string, MouthRig> = {
  H1: {
    fwd: 1, lip: [[306, 291], [330, 293], [360, 291], [390, 287], [404, 281]], neck: [300, 338],
    teeth: [[319, 289], [396, 283], [393, 305], [375, 333], [326, 339], [318, 331]],
    corner: { join: [262, 280], tip: [238, 265], patch: [246, 270, 15, 12] },
  },
  H5: {
    fwd: -1, lip: [[196, 300], [165, 302], [130, 301], [110, 298], [98, 292]], neck: [200, 350],
    teeth: [[100, 294], [173, 298], [171, 347], [140, 351], [107, 347], [103, 320]],
    corner: { join: [226, 286], tip: [250, 269], patch: [244, 274, 13, 11] },
  },
};
