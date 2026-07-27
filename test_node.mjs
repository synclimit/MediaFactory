import fs from 'fs';
import { renderFrameStore } from './src/services/pipeline/runtime/RenderFrameStore.js';
import { visualRuntime } from './src/services/visual/VisualRuntime.js';

// Mock audio driven state
const audioDrivenState = {
    musicalFeel: {
        punch: 1.5,
        confidence: 0.95
    },
    kick: {
        justTriggered: true
    }
};

const dt = 0.016;

const composition = visualRuntime.update(dt, audioDrivenState, []);

const debugZoom = composition.debug.zoom;

console.log("Debug Zoom object:", debugZoom);
console.log("JSON Output:", JSON.stringify(debugZoom, null, 2));

