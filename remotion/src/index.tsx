// Registro automático: cada remotion/src/episodes/<Comp>.tsx exporta `id` + default, y su guion vive en
// episodes/<id>/episode.json. Un episodio nuevo aparece sin tocar este archivo.
import React from "react";
import { registerRoot, Composition } from "remotion";
import { curioMeta, type CurioProps } from "./kit";
import { MotionTest5s } from "./ratopin/MotionTest5s";
import { MouthSheet } from "./ratopin/MouthSheet";
import { Tuerca5s } from "./tuerca/Tuerca5s";
import { TuercaEp1 } from "./tuerca/Ep1";
import TuercaTL from "./tuerca/ep1-timeline.json";

declare const require: { context: (dir: string, deep: boolean, re: RegExp) => { keys: () => string[]; (k: string): any } };
const scenes = require.context("./episodes", false, /\.tsx$/);
const specs = require.context("../../episodes", true, /episode\.json$/);
const lines: Record<string, string[]> = Object.fromEntries(specs.keys().map((k) => { const e = specs(k); return [e.id, e.lines]; }));

const Root = () => (
  <>
    {scenes.keys().map((k) => {
      const m = scenes(k);
      return <Composition key={m.id} id={m.id} component={m.default} width={1080} height={1920} fps={30} durationInFrames={1200}
        defaultProps={{ id: m.id, lines: [], duration: 40 } as CurioProps} calculateMetadata={curioMeta(m.id, lines[m.id] ?? ["…"])} />;
    })}
    <Composition id="RatopinMouthSheet" component={MouthSheet} width={1080} height={1920} fps={24} durationInFrames={1} />
    <Composition id="RatopinMotion5s" component={MotionTest5s} width={1080} height={1920} fps={24} durationInFrames={120} defaultProps={{ camera: true, boil: true }} />
    <Composition id="Tuerca5s" component={Tuerca5s} width={1080} height={1920} fps={24} durationInFrames={120} defaultProps={{ camera: true, boil: true }} />
    <Composition id="TuercaEp1" component={TuercaEp1} width={1080} height={1920} fps={24} durationInFrames={TuercaTL.total} defaultProps={{ camera: true, boil: true }} />
  </>
);
registerRoot(Root);
