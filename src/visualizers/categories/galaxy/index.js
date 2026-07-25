import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as G01_SpiralGalaxy from "./G01_SpiralGalaxy";
import * as G02_NebulaClouds from "./G02_NebulaClouds";
import * as G03_StarfieldFlight from "./G03_StarfieldFlight";
import * as G04_BlackHole from "./G04_BlackHole";

export function registerGalaxyCategory() {
    visualizerRegistry.register(G01_SpiralGalaxy);
    visualizerRegistry.register(G02_NebulaClouds);
    visualizerRegistry.register(G03_StarfieldFlight);
    visualizerRegistry.register(G04_BlackHole);
}
