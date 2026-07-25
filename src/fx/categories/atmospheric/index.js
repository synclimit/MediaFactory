import { fxRegistry } from "../../registry/FXRegistry";

import * as ATM01_LightRays from "./ATM01_LightRays";

export function registerAtmosphericFX() {
    fxRegistry.register(ATM01_LightRays);
}
