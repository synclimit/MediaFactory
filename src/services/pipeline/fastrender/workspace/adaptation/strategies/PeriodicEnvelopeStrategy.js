/**
 * PeriodicEnvelopeStrategy.js
 * Strategy interface placeholder for Depth and Lighting Envelopes in Fast Workspace (MF-1403).
 */

import { ProceduralAdapter } from '../ProceduralAdapter.js';
import { AdaptationResult } from '../AdaptationResult.js';

export class PeriodicEnvelopeStrategy extends ProceduralAdapter {
    constructor() {
        super('PeriodicEnvelope');
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
                periodicEnvelopeActive: true
            },
            originalObject: context.object,
            strategyUsed: this.name,
            isAdapted: true,
            validationHints: {
                loopContinuity: 'Good',
                continuityOk: true,
                borderSafe: true,
                recommendedCheck: 'DepthEnvelopeBoundary'
            }
        });
    }
}
