import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import { audioDrivenAdapter } from '../../../audio/AudioDrivenAdapter';

export class AudioDrivenAdapterAdapter extends EngineAdapter {
    constructor() {
        super('AudioDrivenAdapter');
    }

    execute(context) {
        const t0 = performance.now();
        
        const state = audioDrivenAdapter ? audioDrivenAdapter.getState() : this.defaultState();
        
        const execTime = performance.now() - t0;

        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: { executionTime: execTime }
        });
    }

    defaultState() {
        return { audioFeatures: {} };
    }

    reset() {
        if (audioDrivenAdapter && typeof audioDrivenAdapter.reset === 'function') {
            audioDrivenAdapter.reset();
        }
    }

    getCapabilities() {
        return { provides: ['audioFeatures'] };
    }
}
