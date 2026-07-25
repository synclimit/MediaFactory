import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as MX01_DigitalRain from "./MX01_DigitalRain";
import * as MX02_HexCode from "./MX02_HexCode";

export function registerMatrixCategory() {
    visualizerRegistry.register(MX01_DigitalRain);
    visualizerRegistry.register(MX02_HexCode);
}
