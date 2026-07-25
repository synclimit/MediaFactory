import { fxRegistry } from "../../registry/FXRegistry";

import * as ADV01_ChromaKey from "./ADV01_ChromaKey";

export function registerAdvancedFX() {
    fxRegistry.register(ADV01_ChromaKey);
}
