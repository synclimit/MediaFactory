import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as D01_VerticalHelix from "./D01_VerticalHelix";
import * as D02_CircularDNA from "./D02_CircularDNA";

export function registerDNACategory() {
    visualizerRegistry.register(D01_VerticalHelix);
    visualizerRegistry.register(D02_CircularDNA);
}
