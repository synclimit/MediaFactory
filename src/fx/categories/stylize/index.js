import { fxRegistry } from "../../registry/FXRegistry";

import * as STY01_Halftone from "./STY01_Halftone";

export function registerStylizeFX() {
    fxRegistry.register(STY01_Halftone);
}
