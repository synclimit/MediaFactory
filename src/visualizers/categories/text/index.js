import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as TXT01_LyricBounce from "./TXT01_LyricBounce";

export function registerTextCategory() {
    visualizerRegistry.register(TXT01_LyricBounce);
}
