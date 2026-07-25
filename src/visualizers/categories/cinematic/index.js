import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as CINE01_LensFlare from "./CINE01_LensFlare";

export function registerCinematicCategory() {
    visualizerRegistry.register(CINE01_LensFlare);
}
