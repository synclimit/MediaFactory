import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as R01_BasicConcentric from "./R01_BasicConcentric";
import * as R02_OrbitingHalos from "./R02_OrbitingHalos";
import * as R03_DashedAudio from "./R03_DashedAudio";
import * as R04_GlowingCore from "./R04_GlowingCore";
import * as R05_MultiLayerRadar from "./R05_MultiLayerRadar";
import * as R06_TwistedMobius from "./R06_TwistedMobius";
import * as R07_ExpandingEcho from "./R07_ExpandingEcho";
import * as R08_GlitchedWireframe from "./R08_GlitchedWireframe";
import * as R09_SegmentedEnergy from "./R09_SegmentedEnergy";
import * as R10_Torus3D from "./R10_Torus3D";

export function registerRingCategory() {
    visualizerRegistry.register(R01_BasicConcentric);
    visualizerRegistry.register(R02_OrbitingHalos);
    visualizerRegistry.register(R03_DashedAudio);
    visualizerRegistry.register(R04_GlowingCore);
    visualizerRegistry.register(R05_MultiLayerRadar);
    visualizerRegistry.register(R06_TwistedMobius);
    visualizerRegistry.register(R07_ExpandingEcho);
    visualizerRegistry.register(R08_GlitchedWireframe);
    visualizerRegistry.register(R09_SegmentedEnergy);
    visualizerRegistry.register(R10_Torus3D);
}