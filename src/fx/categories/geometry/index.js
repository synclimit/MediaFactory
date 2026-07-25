import { fxRegistry } from "../../registry/FXRegistry";

import * as GEO01_Kaleidoscope from "./GEO01_Kaleidoscope";

export function registerGeometryFX() {
    fxRegistry.register(GEO01_Kaleidoscope);
}
