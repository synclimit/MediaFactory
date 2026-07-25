import { fxRegistry } from "../../registry/FXRegistry";

import * as MOT01_MotionTrail from "./MOT01_MotionTrail";

export function registerMotionFX() {
    fxRegistry.register(MOT01_MotionTrail);
}
