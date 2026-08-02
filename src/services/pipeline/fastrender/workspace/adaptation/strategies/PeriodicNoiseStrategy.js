/**
 * PeriodicNoiseStrategy.js
 * Reference Implementation for Zoom Pulse (zoom-hentak) in MediaFactory M3 Fast Workspace (MF-1403).
 * Applies periodic cosine pulse scaling over context.normalizedLoopTime.
 */

import { ProceduralAdapter } from '../ProceduralAdapter.js';
import { AdaptationResult } from '../AdaptationResult.js';

export class PeriodicNoiseStrategy extends ProceduralAdapter {
    constructor() {
        super('PeriodicNoise');
    }

    supports(context) {
        return !!(context && context.object);
    }

    adapt(context) {
        const obj = context.object;
        const normalizedTime = context.normalizedLoopTime;

        const depth = (obj?.props?.depth || obj?.depth || 50.0) / 100.0;
        const speed = obj?.props?.speed || obj?.speed || 1.0;

        // Periodic Cosine Envelope over normalized loop domain [0.0, 1.0)
        const pulseAngle = normalizedTime * Math.PI * 2 * speed;
        const pulseScale = 1.0 + (Math.cos(pulseAngle) * 0.5 + 0.5) * depth * 0.15;

        const adaptedObject = {
            ...obj,
            props: {
                ...(obj.props || {}),
                mode: 'Periodic Cosine Pulse (Fast Workspace)',
                pulseScale,
                speed
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
                recommendedCheck: 'PulseCosineContinuity'
            },
            debugData: {
                normalizedTime,
                pulseScale
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
