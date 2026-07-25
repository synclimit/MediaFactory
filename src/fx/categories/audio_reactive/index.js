import { fxRegistry } from "../../registry/FXRegistry";

import * as AUD01_SpectrumOverlay from "./AUD01_SpectrumOverlay";

export function registerAudioReactiveFX() {
    fxRegistry.register(AUD01_SpectrumOverlay);
}
