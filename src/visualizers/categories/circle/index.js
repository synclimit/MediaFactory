import { visualizerRegistry } from "../../registry/VisualizerRegistry";

import * as C01_BasicCircular from "./C01_BasicCircular";
import * as C02_InwardPointing from "./C02_InwardPointing";
import * as C03_SymmetricalDual from "./C03_SymmetricalDual";
import * as C04_DotMatrix from "./C04_DotMatrix";
import * as C05_GlitchSegment from "./C05_GlitchSegment";
import * as C06_TrailingRadial from "./C06_TrailingRadial";
import * as C07_NeonRing from "./C07_NeonRing";
import * as C08_ReactiveIris from "./C08_ReactiveIris";
import * as C09_ExtrudedCylinder from "./C09_ExtrudedCylinder";
import * as C10_PulsingSunburst from "./C10_PulsingSunburst";

export function registerCircleCategory() {
    visualizerRegistry.register(C01_BasicCircular);
    visualizerRegistry.register(C02_InwardPointing);
    visualizerRegistry.register(C03_SymmetricalDual);
    visualizerRegistry.register(C04_DotMatrix);
    visualizerRegistry.register(C05_GlitchSegment);
    visualizerRegistry.register(C06_TrailingRadial);
    visualizerRegistry.register(C07_NeonRing);
    visualizerRegistry.register(C08_ReactiveIris);
    visualizerRegistry.register(C09_ExtrudedCylinder);
    visualizerRegistry.register(C10_PulsingSunburst);
}