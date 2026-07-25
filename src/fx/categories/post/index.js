import { fxRegistry } from "../../registry/FXRegistry";

import * as PST01_Letterbox from "./PST01_Letterbox";

export function registerPostFX() {
    fxRegistry.register(PST01_Letterbox);
}
