import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as A01_LiquidBlobs from "./A01_LiquidBlobs";
import * as A02_ChaoticSplatter from "./A02_ChaoticSplatter";

export function registerAbstractCategory() {
    visualizerRegistry.register(A01_LiquidBlobs);
    visualizerRegistry.register(A02_ChaoticSplatter);
}
