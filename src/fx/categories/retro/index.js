import { fxRegistry } from "../../registry/FXRegistry";

import * as RTR02_CRTScanlines from "./RTR02_CRTScanlines";

export function registerRetroFX() {
    fxRegistry.register(RTR02_CRTScanlines);
}
