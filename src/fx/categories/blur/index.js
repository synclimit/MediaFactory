import { fxRegistry } from "../../registry/FXRegistry";

import * as BLR01_MotionBlur from "./BLR01_MotionBlur";

export function registerBlurFX() {
    fxRegistry.register(BLR01_MotionBlur);
}
