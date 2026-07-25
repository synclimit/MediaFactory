import { fxRegistry } from "../../registry/FXRegistry";

import * as PTC01_DustMotes from "./PTC01_DustMotes";

export function registerParticleFX() {
    fxRegistry.register(PTC01_DustMotes);
}
