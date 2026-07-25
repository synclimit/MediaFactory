import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as MIN01_SingleDot from "./MIN01_SingleDot";
import * as MIN02_ThinLine from "./MIN02_ThinLine";

export function registerMinimalCategory() {
    visualizerRegistry.register(MIN01_SingleDot);
    visualizerRegistry.register(MIN02_ThinLine);
}
