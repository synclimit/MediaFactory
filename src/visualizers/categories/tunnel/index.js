import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as T01_InfiniteNeonTunnel from "./T01_InfiniteNeonTunnel";
import * as T02_HyperspaceWarp from "./T02_HyperspaceWarp";
import * as T03_AudioCylinder from "./T03_AudioCylinder";
import * as T04_WormholeVortex from "./T04_WormholeVortex";

export function registerTunnelCategory() {
    visualizerRegistry.register(T01_InfiniteNeonTunnel);
    visualizerRegistry.register(T02_HyperspaceWarp);
    visualizerRegistry.register(T03_AudioCylinder);
    visualizerRegistry.register(T04_WormholeVortex);
}
