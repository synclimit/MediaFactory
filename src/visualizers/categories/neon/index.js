import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as N01_SynthwaveSun from "./N01_SynthwaveSun";
import * as N02_LaserGrid from "./N02_LaserGrid";

export function registerNeonCategory() {
    visualizerRegistry.register(N01_SynthwaveSun);
    visualizerRegistry.register(N02_LaserGrid);
}
