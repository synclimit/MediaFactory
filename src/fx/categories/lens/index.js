import { fxRegistry } from "../../registry/FXRegistry";

import * as LNS01_LensFlare from "./LNS01_LensFlare";

export function registerLensFX() {
    fxRegistry.register(LNS01_LensFlare);
}
