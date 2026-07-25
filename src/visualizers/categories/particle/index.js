import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as P01_ExplosionBurst from "./P01_ExplosionBurst";
import * as P02_RisingFireflies from "./P02_RisingFireflies";
import * as P03_GravityWell from "./P03_GravityWell";
import * as P04_AudioFountain from "./P04_AudioFountain";
import * as P05_DataStream from "./P05_DataStream";
import * as P06_ConstellationNodes from "./P06_ConstellationNodes";
import * as P07_WaveEmitter from "./P07_WaveEmitter";
import * as P08_OrbitalDust from "./P08_OrbitalDust";

export function registerParticleCategory() {
    visualizerRegistry.register(P01_ExplosionBurst);
    visualizerRegistry.register(P02_RisingFireflies);
    visualizerRegistry.register(P03_GravityWell);
    visualizerRegistry.register(P04_AudioFountain);
    visualizerRegistry.register(P05_DataStream);
    visualizerRegistry.register(P06_ConstellationNodes);
    visualizerRegistry.register(P07_WaveEmitter);
    visualizerRegistry.register(P08_OrbitalDust);
}