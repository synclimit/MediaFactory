import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as GEO01_PolygonalWeb from "./GEO01_PolygonalWeb";
import * as GEO02_PlatonicSolids from "./GEO02_PlatonicSolids";

export function registerGeometryCategory() {
    visualizerRegistry.register(GEO01_PolygonalWeb);
    visualizerRegistry.register(GEO02_PlatonicSolids);
}
