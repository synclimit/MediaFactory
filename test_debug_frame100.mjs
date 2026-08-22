import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import { renderCanvasKitPrimitives } from './src/services/visualizer/CanvasKitPrimitiveRenderer.js';

import * as classicVertical from './src/visualizers/categories/bars/B01_ClassicVertical.js';

await sharedVisualizerPipeline.loadPlugin(classicVertical);

const frameIndex = 100;
const viewport = { width: 1280, height: 720 };
const config = { barCount: 64, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

console.log('=== [RUNTIME DEBUG FRAME 100 EXPORT EXEC] ===');
console.log('1. Active Plugin ID:', sharedVisualizerPipeline.activePlugin.metadata.id);

const primitives = sharedVisualizerPipeline.renderFrame(frameIndex, 'export_session', viewport, config);

console.log('3. Geometry Primitives Count:', primitives.length);
console.log('4. First Primitive:', primitives[0]);
