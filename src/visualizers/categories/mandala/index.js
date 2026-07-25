import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as M01_SymmetricLotus from "./M01_SymmetricLotus";
import * as M02_GeometricStar from "./M02_GeometricStar";
import * as M03_KaleidoscopeHex from "./M03_KaleidoscopeHex";
import * as M04_FractalBranches from "./M04_FractalBranches";
import * as M05_NeonYantra from "./M05_NeonYantra";
import * as M06_AudioCymatics from "./M06_AudioCymatics";
import * as M07_SpirographTrace from "./M07_SpirographTrace";
import * as M08_PulsingRunes from "./M08_PulsingRunes";

export function registerMandalaCategory() {
    visualizerRegistry.register(M01_SymmetricLotus);
    visualizerRegistry.register(M02_GeometricStar);
    visualizerRegistry.register(M03_KaleidoscopeHex);
    visualizerRegistry.register(M04_FractalBranches);
    visualizerRegistry.register(M05_NeonYantra);
    visualizerRegistry.register(M06_AudioCymatics);
    visualizerRegistry.register(M07_SpirographTrace);
    visualizerRegistry.register(M08_PulsingRunes);
}