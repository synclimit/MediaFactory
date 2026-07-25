import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as FL01_AudioLavaLamp from "./FL01_AudioLavaLamp";

export function registerFluidCategory() {
    visualizerRegistry.register(FL01_AudioLavaLamp);
}
