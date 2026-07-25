import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as NAT01_AudioTree from "./NAT01_AudioTree";

export function registerNatureCategory() {
    visualizerRegistry.register(NAT01_AudioTree);
}
