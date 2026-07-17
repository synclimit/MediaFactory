import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import { motionEngine } from '../../../audio/MotionEngine';
import { beatEngine } from '../../../audio/BeatEngine';

export class MotionEngineAdapter extends EngineAdapter {
    constructor() {
        super('MotionEngine');
    }

    execute(context) {
        if (motionEngine && typeof motionEngine.update === 'function') {
            const dt = context.timeline?.deltaTime || 0;
            const bState = beatEngine ? beatEngine.getState() : {};
            
            if (bState.beat) {
                motionEngine.applyImpulse('zoom', bState.beatStrength || 0);
                motionEngine.applyImpulse('pulse', bState.beatStrength || 0);
            }

            motionEngine.update(bState.playFactor || 0, dt);
        }
        
        const state = motionEngine ? motionEngine.getState() : this.defaultState();

        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });
    }

    defaultState() {
        return { transforms: {} };
    }

    reset() {
        if (motionEngine && typeof motionEngine.reset === 'function') {
            motionEngine.reset();
        }
    }

    getCapabilities() {
        return { provides: ['motionTransforms'] };
    }
}
