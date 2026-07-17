import { EngineAdapter } from '../EngineAdapter.js';
import { visualRuntime } from '../../../visual/VisualRuntime.js';
import { audioDrivenAdapter } from '../../../audio/AudioDrivenAdapter.js';

export class VisualRuntimeAdapter extends EngineAdapter {
    constructor() {
        super('VisualRuntime');
    }

    execute(context) {
        // Read from AudioDrivenAdapter directly or from context.frame states if available
        // To be safe and deterministic without graph dependencies during transition, we can read the singleton or context
        let audioState = null;
        if (context.states && context.states.AudioDrivenAdapter) {
            audioState = context.states.AudioDrivenAdapter;
        } else if (audioDrivenAdapter) {
            audioState = audioDrivenAdapter.getState();
        }

        const dt = context.deltaTime || 0.016;
        
        // Update the visual runtime and compile composition
        const composition = visualRuntime.update(dt, audioState);

        return {
            composition
        };
    }

    defaultState() {
        return {
            composition: visualRuntime.getComposition()
        };
    }
}
