import { beatEngine as v1Engine } from './BeatEngine.js';
import { BeatEngineV2 } from './v2/BeatEngineV2.js';

export const beatEngineV2 = new BeatEngineV2();

class BeatEngineSelector {
    constructor() {
        this.mode = "v1"; // Default for strict backwards compatibility
    }

    setMode(mode) {
        if (mode !== "v1" && mode !== "v2") {
            throw new Error(`Invalid BeatEngine mode: ${mode}`);
        }
        this.mode = mode;
    }

    getMode() {
        return this.mode;
    }

    getEngine() {
        return this.mode === "v2" ? beatEngineV2 : v1Engine;
    }
}

export const beatEngineSelector = new BeatEngineSelector();
