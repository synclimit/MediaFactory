import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as SP01_ArchimedeanSpiral from "./SP01_ArchimedeanSpiral";
import * as SP02_LogarithmicSwirl from "./SP02_LogarithmicSwirl";
import * as SP03_FibonacciGolden from "./SP03_FibonacciGolden";
import * as SP04_DoubleHelixDNA from "./SP04_DoubleHelixDNA";
import * as SP05_DottedGalaxy from "./SP05_DottedGalaxy";
import * as SP06_HypnoticTunnel from "./SP06_HypnoticTunnel";
import * as SP07_AngularHex from "./SP07_AngularHex";
import * as SP08_ParticleSwarm from "./SP08_ParticleSwarm";

export function registerSpiralCategory() {
    visualizerRegistry.register(SP01_ArchimedeanSpiral);
    visualizerRegistry.register(SP02_LogarithmicSwirl);
    visualizerRegistry.register(SP03_FibonacciGolden);
    visualizerRegistry.register(SP04_DoubleHelixDNA);
    visualizerRegistry.register(SP05_DottedGalaxy);
    visualizerRegistry.register(SP06_HypnoticTunnel);
    visualizerRegistry.register(SP07_AngularHex);
    visualizerRegistry.register(SP08_ParticleSwarm);
}