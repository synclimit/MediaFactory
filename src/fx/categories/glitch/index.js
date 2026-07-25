import { fxRegistry } from "../../registry/FXRegistry";

import * as GLT01_RGBShift from "./GLT01_RGBShift";

export function registerGlitchFX() {
    fxRegistry.register(GLT01_RGBShift);
}
