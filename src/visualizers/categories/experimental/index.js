import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as EXP01_FractalNoise from "./EXP01_FractalNoise";

export function registerExperimentalCategory() {
    visualizerRegistry.register(EXP01_FractalNoise);
}
