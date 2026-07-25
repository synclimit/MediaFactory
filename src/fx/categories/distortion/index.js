import { fxRegistry } from "../../registry/FXRegistry";

import * as DST01_WaveWarp from "./DST01_WaveWarp";

export function registerDistortionFX() {
    fxRegistry.register(DST01_WaveWarp);
}
