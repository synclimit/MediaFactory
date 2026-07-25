import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as RTR01_VHSGlitch from "./RTR01_VHSGlitch";

export function registerRetroCategory() {
    visualizerRegistry.register(RTR01_VHSGlitch);
}
