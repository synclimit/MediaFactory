import { fxRegistry } from "../../registry/FXRegistry";

import * as BT01_BeatFlash from "./BT01_BeatFlash";

export function registerBeatFX() {
    fxRegistry.register(BT01_BeatFlash);
}
