import { fxRegistry } from "../../registry/FXRegistry";

import * as ENV01_Fog from "./ENV01_Fog";

export function registerEnvironmentalFX() {
    fxRegistry.register(ENV01_Fog);
}
