import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import { reactiveEngine } from '../../../audio/ReactiveEngine';
import { beatEngine } from '../../../audio/BeatEngine';

export class ReactiveEngineAdapter extends EngineAdapter {
    constructor() {
        super('ReactiveEngine');
    }

    execute(context) {
        if (reactiveEngine && typeof reactiveEngine.update === 'function') {
            const dt = context.timeline?.deltaTime || 0;
            const isPlaying = context.timeline?.isPlaying || false;
            const bState = beatEngine ? beatEngine.getState() : {};
            
            reactiveEngine.update(bState, dt, isPlaying);
        }
        
        const state = reactiveEngine ? reactiveEngine.getChannels() : this.defaultState();

        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });
    }

    defaultState() {
        return { values: {} };
    }

    reset() {
        if (reactiveEngine && typeof reactiveEngine.reset === 'function') {
            reactiveEngine.reset();
        }
    }

    getCapabilities() {
        return { provides: ['reactiveValues'] };
    }
}
