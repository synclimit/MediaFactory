import { fxRegistry } from "../../registry/FXRegistry";

import * as EXP01_AIStyleTransfer from "./EXP01_AIStyleTransfer";

export function registerExperimentalFX() {
    fxRegistry.register(EXP01_AIStyleTransfer);
}
