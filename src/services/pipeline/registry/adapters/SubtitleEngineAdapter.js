import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import { subtitleRuntime } from '../../../audio/subtitle/SubtitleRuntime';
import { SubtitleLayoutEngine } from '../../../audio/subtitle/rendering/SubtitleLayoutEngine';
import { SubtitleAnimationEngine } from '../../../audio/subtitle/rendering/SubtitleAnimationEngine';
import { SubtitleStyleEngine } from '../../../audio/subtitle/rendering/SubtitleStyleEngine';

export class SubtitleEngineAdapter extends EngineAdapter {
    constructor() {
        super('SubtitleEngine');
    }

    execute(context) {
        // Read input configuration from the pipeline frame
        const frameInput = context.providers.get('frameInput');
        const inputs = frameInput ? frameInput.getInputs() : { subtitleObjects: [] };
        
        const state = {};

        // In a single-runtime architecture, there's only one subtitle sequence.
        // We grab the shared state from our runtime which was updated earlier in the frame by the audio loop.
        const runtimeState = subtitleRuntime.getState();

        for (const config of inputs.subtitleObjects) {
            // Apply configured style down to runtime state (mocking config injection)
            runtimeState.style = config.animationStyle || 'Slide + Fade';
            
            // Calculate layout and animation by mutating the shared runtime state object
            // Zero allocations!
            const t0 = performance.now();
            SubtitleLayoutEngine.compute(
                runtimeState, 
                config, 
                context.canvasWidth || 1920, 
                context.canvasHeight || 1080
            );
            const t1 = performance.now();
            
            // Only update layout time if it was actually re-calculated (if state changed). 
            // SubtitleLayoutEngine returns quickly if cached.
            runtimeState.diagnostics = runtimeState.diagnostics || {};
            runtimeState.diagnostics.layoutTimeMicroseconds = (t1 - t0) * 1000;
            
            // Animation Engine uses the diagnostics last timestamp directly from runtime
            const t2 = performance.now();
            SubtitleAnimationEngine.compute(
                runtimeState, 
                subtitleRuntime.getDiagnostics().lastTimestamp
            );
            const t3 = performance.now();
            runtimeState.diagnostics.animationTimeMicroseconds = (t3 - t2) * 1000;

            // Style Engine
            const t4 = performance.now();
            SubtitleStyleEngine.compute(runtimeState);
            const t5 = performance.now();
            runtimeState.diagnostics.styleTimeMicroseconds = (t5 - t4) * 1000;

            // Package reference to the shared runtime state
            state[config.id] = runtimeState;
        }
        
        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });
    }

    defaultState() {
        return {};
    }

    reset() {
        subtitleRuntime.resetState();
    }

    getCapabilities() {
        return { provides: ['subtitle'] };
    }
}
