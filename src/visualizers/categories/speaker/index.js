import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as S01_SubwooferCone from "./S01_SubwooferCone";
import * as S02_DualMonitors from "./S02_DualMonitors";

export function registerSpeakerCategory() {
    visualizerRegistry.register(S01_SubwooferCone);
    visualizerRegistry.register(S02_DualMonitors);
}
