import { visualizerRegistry } from '../../registry/VisualizerRegistry';

import * as B01 from './B01_ClassicVertical';
import * as B02 from './B02_StaggeredCenter';
import * as B03 from './B03_MirrorBars';
import * as B04 from './B04_SplitDual';
import * as B05 from './B05_RoundedPillBars';
import * as B06 from './B06_Horizontal';
import * as B07 from './B07_DotMatrix';
import * as B08 from './B08_Waterfall';
import * as B09 from './B09_Perspective3D';
import * as B10 from './B10_NeonOutline';
import * as B11 from './B11_GradientFill';
import * as B12 from './B12_FrequencyTerrain';
import * as B13 from './B13_StackedMultiBand';
import * as B14 from './B14_PeakHold';
import * as B15 from './B15_Zigzag';
import * as B16 from './B16_ReflectedFloor';
import * as B17 from './B17_HistogramCascade';
import * as B18 from './B18_FragmentedGlitch';

export function registerBarsCategory() {
    visualizerRegistry.register(B01);
    visualizerRegistry.register(B02);
    visualizerRegistry.register(B03);
    visualizerRegistry.register(B04);
    visualizerRegistry.register(B05);
    visualizerRegistry.register(B06);
    visualizerRegistry.register(B07);
    visualizerRegistry.register(B08);
    visualizerRegistry.register(B09);
    visualizerRegistry.register(B10);
    visualizerRegistry.register(B11);
    visualizerRegistry.register(B12);
    visualizerRegistry.register(B13);
    visualizerRegistry.register(B14);
    visualizerRegistry.register(B15);
    visualizerRegistry.register(B16);
    visualizerRegistry.register(B17);
    visualizerRegistry.register(B18);
}
