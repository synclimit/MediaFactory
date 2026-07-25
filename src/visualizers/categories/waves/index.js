import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as W01_Oscilloscope from "./W01_Oscilloscope";
import * as W02_FilledSine from "./W02_FilledSine";
import * as W03_SymmetricalDual from "./W03_SymmetricalDual";
import * as W04_BezierSpline from "./W04_BezierSpline";
import * as W05_DotMatrixWave from "./W05_DotMatrixWave";
import * as W06_BrokenGlitch from "./W06_BrokenGlitch";
import * as W07_NeonGlow from "./W07_NeonGlow";
import * as W08_OverlappingMulti from "./W08_OverlappingMulti";
import * as W09_JaggedMountain from "./W09_JaggedMountain";
import * as W10_Ribbon3D from "./W10_Ribbon3D";
import * as W11_PolledStep from "./W11_PolledStep";
import * as W12_TrailingGhost from "./W12_TrailingGhost";

export function registerWavesCategory() {
    visualizerRegistry.register(W01_Oscilloscope);
    visualizerRegistry.register(W02_FilledSine);
    visualizerRegistry.register(W03_SymmetricalDual);
    visualizerRegistry.register(W04_BezierSpline);
    visualizerRegistry.register(W05_DotMatrixWave);
    visualizerRegistry.register(W06_BrokenGlitch);
    visualizerRegistry.register(W07_NeonGlow);
    visualizerRegistry.register(W08_OverlappingMulti);
    visualizerRegistry.register(W09_JaggedMountain);
    visualizerRegistry.register(W10_Ribbon3D);
    visualizerRegistry.register(W11_PolledStep);
    visualizerRegistry.register(W12_TrailingGhost);
}