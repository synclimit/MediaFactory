// Mock globals
if (!global.performance) {
    global.performance = require('perf_hooks').performance;
}
global.window = {};
global.indexedDB = { open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }) };

// We use the actual pipeline classes!
import { beatEngine } from './src/services/audio/BeatEngine.js';
import { audioDrivenRuntime } from './src/services/audio/v2/AudioDrivenRuntime.js';
import { visualRuntime } from './src/services/visual/VisualRuntime.js';
import { FrameComposer } from './src/services/pipeline/FrameComposer.js';
import { renderSurface } from './src/services/pipeline/renderer/RenderSurface.js';
import { CompositionRenderer } from './src/services/pipeline/renderer/CompositionRenderer.js';

const compRenderer = new CompositionRenderer();
const timeline = [];

for (let frame = 1; frame <= 300; frame++) {
    const dt = 0.016; // ~60fps
    const time = frame * dt;
    
    // Simulate a kick at frame 101
    if (frame === 101) {
        beatEngine._queue.push({
            time: performance.now(),
            type: 'beat',
            strength: 1.0,
            confidence: 1.0,
            bpm: 120,
            beatPhase: 0,
            kickScore: 0.9,
            snareScore: 0.1,
            hatScore: 0.1,
            energy: 0.8,
            brightness: 0.5
        });
        beatEngine._queue.flush(beatEngine.beatSubscribers);
    }
    
    const audioState = audioDrivenRuntime.update(dt);
    const visualComp = visualRuntime.update(dt, audioState);
    
    // Frame Composer
    const metadata = { frameNumber: frame, currentTime: time, deltaTime: dt };
    const states = { visual: visualComp, BeatEngine: beatEngine };
    const renderFrame = FrameComposer.compose(metadata, states, []);
    
    // Renderer
    compRenderer.draw(renderFrame);
    
    // Record Timeline
    if (frame >= 95 && frame <= 115) { // Just keep the interesting part to verify logic
       timeline.push({
           frame: frame,
           "kick.justTriggered": audioState.kick ? audioState.kick.justTriggered : false,
           currentScale: visualComp.transform.scale,
           appliedScale: renderSurface.transform.scale
       });
    } else {
       timeline.push({
           frame: frame,
           "kick.justTriggered": audioState.kick ? audioState.kick.justTriggered : false,
           currentScale: visualComp.transform.scale,
           appliedScale: renderSurface.transform.scale
       });
    }
}

const fs = require('fs');
fs.writeFileSync('runtime_timeline.json', JSON.stringify(timeline, null, 2));
console.log("Timeline generated.");
