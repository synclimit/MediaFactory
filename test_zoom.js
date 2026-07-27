import { audioDrivenRuntime } from './src/services/audio/v2/AudioDrivenRuntime.js';
import { visualRuntime } from './src/services/visual/VisualRuntime.js';

// Mock UI objects
const objects = [
    { id: '1', type: 'effect', name: 'zoom-hentak', enabled: true, props: { depth: 50 }, amplitude: 0.20 }
];

// Initialize

const beats = [];
let time = 0;
const bpm = 120;
const beatInterval = 60 / bpm;
const frameRate = 60;
const dt = 1 / frameRate;

const jsonLog = [];

for (let frame = 0; frame < 300; frame++) { // 300 frames = 5 seconds
    time += dt;
    
    // Simulate a beat every 0.5 seconds (120 BPM)
    const isBeatFrame = frame > 0 && frame % 30 === 0; // exactly 1 beat every 30 frames (0.5s at 60fps)
    
    if (isBeatFrame) {
        audioDrivenRuntime.processEvent({ 
            type: 'beat', 
            strength: 1.0, 
            kickScore: 1.0, 
            energy: 0.8,
            confidence: 1.0
        });
    }
    
    const audioDrivenState = audioDrivenRuntime.update(dt);
    const comp = visualRuntime.update(dt, audioDrivenState, objects);
    
    // Log exactly when a beat happens or when zoom is active
    if (isBeatFrame || comp.debug.zoom.impulse > 0 || comp.debug.zoom.state !== 'IDLE') {
        jsonLog.push({
            frame,
            time: time.toFixed(3),
            beatDetected: isBeatFrame,
            zoomState: comp.debug.zoom.state,
            zoomImpulse: comp.debug.zoom.impulse.toFixed(4)
        });
    }
}

import fs from 'fs';
fs.writeFileSync('test_zoom.json', JSON.stringify(jsonLog, null, 2));
console.log("Test finished! Result saved to test_zoom.json");
