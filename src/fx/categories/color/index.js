import { fxRegistry } from "../../registry/FXRegistry";

import * as COL01_ColorPulse from "./COL01_ColorPulse";
import * as COL02_HueShift from "./COL02_HueShift";

export function registerColorFX() {
    fxRegistry.register(COL01_ColorPulse);
    fxRegistry.register(COL02_HueShift);
}
