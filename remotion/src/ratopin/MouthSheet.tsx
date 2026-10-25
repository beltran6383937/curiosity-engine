// Hoja de prueba de las bocas por código (no es del vídeo): cada cabeza con cada estado, para revisarlas a ojo.
import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { asset } from "./rig";
import { Mouth, type MouthState } from "./mouth";
import * as R from "./rig-v1";

const STATES: [string, MouthState][] = [["dibujo", {}], ["neutra", { corner: 0 }], ["fastidio", { corner: -1 }], ["suspiro", { corner: -0.3, open: 0.12 }],
  ["entreabierta", { corner: 0, open: 0.25 }], ["abierta", { corner: 0, open: 0.55 }], ["susto", { corner: -0.6, open: 1, wide: 0.62 }]];
export const MouthSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#faf9f6" }}>
    {["H1", "H5"].map((h, r) => STATES.map(([name, m], i) => {
      const hd = R.HEADS[h], [w, hh] = R.HEAD_SIZE[h], s = 0.6;
      return (
        <div key={h + name} style={{ position: "absolute", left: (i % 4) * 270, top: r * 960 + Math.floor(i / 4) * 470, width: w, height: hh, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          <Img src={asset(hd.src)} style={{ position: "absolute", left: 0, top: 0 }} />
          <Mouth rig={R.MOUTHS[h]} m={m} src={asset(hd.src)} w={w} h={hh} />
          <div style={{ position: "absolute", top: hh, fontSize: 40, fontFamily: "sans-serif" }}>{h} · {name}</div>
        </div>
      );
    }))}
  </AbsoluteFill>
);
