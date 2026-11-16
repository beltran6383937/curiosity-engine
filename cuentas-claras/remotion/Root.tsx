import React from "react";
import { Composition } from "remotion";
import { Ep1 } from "./Ep1";
import TL from "./tl.json";
export const Root: React.FC = () => <Composition id="Ep1" component={Ep1} durationInFrames={Math.round(TL.dur * 30)} fps={30} width={1080} height={1920} />;
