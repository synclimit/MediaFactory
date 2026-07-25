import { fxRegistry } from "../../registry/FXRegistry";

import * as TRN01_FlashCut from "./TRN01_FlashCut";

export function registerTransitionFX() {
    fxRegistry.register(TRN01_FlashCut);
}