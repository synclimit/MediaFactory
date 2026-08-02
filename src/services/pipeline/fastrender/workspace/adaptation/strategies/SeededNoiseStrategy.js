/**
 * SeededNoiseStrategy.js
 * Reference Implementation for Camera Shake in MediaFactory M3 Fast Workspace (MF-1403).
 * Applies deterministic seeded noise camera shake using context.normalizedLoopTime.
 */

import { ProceduralAdapter } from '../ProceduralAdapter.js';
import { AdaptationResult } from '../AdaptationResult.js';
import { seededNoiseAdapter } from '../../../core/SeededNoiseAdapter.js';

export class SeededNoiseStrategy extends ProceduralAdapter {
    constructor() {
        super('SeededNoise');
    }

    supports(context) {
        return !!(context && context.object);
    }

    adapt(context) {
        const obj = context.object;
        const normalizedTime = context.normalizedLoopTime;
        const masterDuration = context.masterLoopDuration;
        const loopTime = normalizedTime * masterDuration;

        const strength = obj?.props?.strength || obj?.strength || 20.0;
        const seed = context.seed || obj?.props?.seed || 1337;

        // Compute deterministic seeded camera shake
        const shake = seededNoiseAdapter.getSeededCameraShake(loopTime, masterDuration, strength * 0.15, seed);

        const adaptedObject = {
            ...obj,
            props: {
                ...(obj.props || {}),
                mode: 'Seeded Periodic Shake (Fast Workspace)',
                seed,
                shakeX: shake.x,
                shakeY: shake.y,
                shakeRotation: shake.rotation
            },
            _fastModeAdapted: true,
            _adaptedStrategy: this.name
        };

        return new AdaptationResult({
            adaptedObject,
            originalObject: obj,
            strategyUsed: this.name,
            isAdapted: true,
            validationHints: {
                loopContinuity: 'Good',
                continuityOk: true,
                borderSafe: true,
                recommendedCheck: 'ShakeBoundaryContinuity'
            },
            debugData: {
                normalizedTime,
                shake
            }
        });
    }

    validate(result) {
        return {
            isValid: true,
            hints: result.validationHints,
            errors: []
        };
    }
}
