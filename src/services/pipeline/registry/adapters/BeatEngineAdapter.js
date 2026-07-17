import { EngineAdapter } from '../EngineAdapter.js';
import { ExecutionResult } from '../../models/ExecutionResult.js';
import { ExecutionStatus } from '../../models/ExecutionStatus.js';

import { beatEngineSelector } from '../../../audio/BeatEngineSelector.js';

export class BeatEngineAdapter extends EngineAdapter {
    constructor() {
        super('BeatEngine');
    }

    execute(context) {
        const mode = beatEngineSelector.getMode();
        const engine = beatEngineSelector.getEngine();
        const isPlaying = context.timeline?.isPlaying || false;
        const time = context.timeline?.currentTime || 0;
        
        let state = this.defaultState();
        let beatEngineVersion = mode;
        let cacheHit = false;
        let timelineSource = 'LIVE';

        if (mode === "v1") {
            if (engine && typeof engine.update === 'function') {
                engine.update(isPlaying);
            }
            if (engine) {
                // Merge V1 state into default state to guarantee schema stability
                state = { ...state, ...engine.getState() };
            }
        } else if (mode === "v2") {
            if (engine && engine.state === 'Ready') {
                const stats = engine.getStatistics();
                cacheHit = stats.cacheHit;
                timelineSource = cacheHit ? 'CACHE' : 'LIVE';
                
                // Poll nearest event to translate discrete Timeline into continuous RenderState
                const beatEvent = engine.getNearestBeat(time);
                
                if (beatEvent) {
                    // Render pulse window (50ms)
                    const isBeatNow = Math.abs(beatEvent.timestamp - time) < 0.05;
                    
                    state.isPlaying = isPlaying;
                    state.timestamp = time; // continuous time
                    
                    // V1 legacy mappings mapped from V2
                    state.bpm = beatEvent.bpm;
                    state.beat = isBeatNow; 
                    state.beatStrength = isBeatNow ? (beatEvent.kick?.strength || beatEvent.energy || 0.8) : 0;
                    state.confidence = beatEvent.confidence;
                    state.energy = beatEvent.energy;
                    
                    // V2 new schema appendings
                    state.downbeat = isBeatNow ? beatEvent.downbeat : false;
                    state.kick = beatEvent.kick || { probability: 0, strength: 0 };
                    state.snare = beatEvent.snare || { probability: 0, strength: 0 };
                    state.hihat = beatEvent.hihat || { probability: 0, strength: 0 };
                    state.barIndex = beatEvent.barIndex;
                    state.beatIndex = beatEvent.beatIndex;
                } else {
                    state.isPlaying = isPlaying;
                    state.timestamp = time;
                }
            } else {
                state.isPlaying = isPlaying;
                state.timestamp = time;
            }
        }

        const result = new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });

        // Mutate diagnostics into result if Pipeline Diagnostic supports it in V1 mappings
        result.diagnostics = {
            beatEngineVersion,
            cacheHit,
            timelineSource
        };

        return result;
    }

    defaultState() {
        return { 
            isPlaying: false, 
            playFactor: 0, 
            master: 0, peak: 0, kick: { probability: 0, strength: 0 }, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0, vocal: 0, energy: 0, 
            beat: false, beatStrength: 0, bpm: 120, confidence: 0, beatPhase: 0, timestamp: 0, deltaTime: 0, frameNumber: 0, 
            lastBeatEvent: null, beatType: 'beat', downbeat: false, snare: { probability: 0, strength: 0 }, hihat: { probability: 0, strength: 0 }, barIndex: 0, beatIndex: 0,
            features: { energy: 0, peak: 0, rms: 0, dynamicRange: 0, spectralCentroid: 0, crestFactor: 0, brightness: 0, isSilence: false, density: 0 }
        };
    }

    reset() {
        const engine = beatEngineSelector.getEngine();
        if (engine && typeof engine.reset === 'function') {
            engine.reset();
        }
    }

    getCapabilities() {
        return { provides: ['beatData', 'playFactor'] };
    }
}
