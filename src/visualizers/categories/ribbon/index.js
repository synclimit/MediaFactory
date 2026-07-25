import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as RB01_FlowingRibbon from "./RB01_FlowingRibbon";
import * as RB02_NeonTrail from "./RB02_NeonTrail";
import * as RB03_IntersectingRings from "./RB03_IntersectingRings";
import * as RB04_DNAStrand from "./RB04_DNAStrand";

export function registerRibbonCategory() {
    visualizerRegistry.register(RB01_FlowingRibbon);
    visualizerRegistry.register(RB02_NeonTrail);
    visualizerRegistry.register(RB03_IntersectingRings);
    visualizerRegistry.register(RB04_DNAStrand);
}
