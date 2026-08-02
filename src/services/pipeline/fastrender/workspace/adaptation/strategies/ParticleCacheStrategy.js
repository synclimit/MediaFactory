/**
 * ParticleCacheStrategy.js
 * Strategy interface placeholder for Particle Systems in Fast Workspace (MF-1403).
 */

import { ProceduralAdapter } from '../ProceduralAdapter.js';
import { AdaptationResult } from '../AdaptationResult.js';

export class ParticleCacheStrategy extends ProceduralAdapter {
    constructor() {
        super('ParticleCache');
    }

    supports(context) {
        return !!(context && context.object);
    }

    adapt(context) {
        return new AdaptationResult({
            adaptedObject: {
                ...context.object,
                _fastModeAdapted: true,
                _adaptedStrategy: this.name,
                particleSeed: context.seed || 1337
            },
            originalObject: context.object,
            strategyUsed: this.name,
            isAdapted: true,
            validationHints: {
                loopContinuity: 'Risky',
                continuityOk: true,
                borderSafe: true,
                recommendedCheck: 'ParticlePRNGBoundary'
            }
        });
    }
}
