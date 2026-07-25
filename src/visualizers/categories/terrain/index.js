import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as TR01_WireframeMountains from "./TR01_WireframeMountains";

export function registerTerrainCategory() {
    visualizerRegistry.register(TR01_WireframeMountains);
}
