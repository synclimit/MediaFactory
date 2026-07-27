import fs from 'fs';
import { RenderPipeline } from './src/services/pipeline/RenderPipeline.js';
import { visualRuntime } from './src/services/visual/VisualRuntime.js';
import { audioDrivenRuntime } from './src/services/audio/v2/AudioDrivenRuntime.js';

// Simulasi export data
const frames = [];

for (let i = 0; i < 50; i++) {
    // Simulasi audio state
    const punch = i % 10 === 0 ? 1.0 : 0.0;
    const confidence = i % 10 === 0 ? 0.95 : 0.5;
    
    const beatEvent = {
        type: 'beat',
        isBroadband: true,
        confidence: confidence,
        strength: punch,
        kickStrength: punch,
        energy: punch
    };
    
    if (punch > 0) {
        audioDrivenRuntime.processEvent(beatEvent);
    }
    
    const audioState = audioDrivenRuntime.update(0.016, null);
    const visualComp = visualRuntime.update(0.016, audioState, []);
    
    const zm = visualComp.debug.zoom;
    
    frames.push({
        t: i * 0.016,
        frame: i,
        rawPunch: zm?.rawPunch || 0,
        confidence: zm?.confidence || 0,
        kickTrigger: zm?.kickTrigger || false
    });
}

fs.writeFileSync('D:\\MediaFactory\\backend\\zoom_calibration_test.json', JSON.stringify(frames, null, 2));
console.log("Exported 50 frames to backend/zoom_calibration_test.json");
