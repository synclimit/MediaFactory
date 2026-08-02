/**
 * PassThroughStrategy.js
 * Strategy for LoopNative features in MediaFactory M3 Fast Workspace (MF-1403).
 * Passes original objects through without modifications.
 */

import { ProceduralAdapter } from '../ProceduralAdapter.js';
import { AdaptationResult } from '../AdaptationResult.js';

export class PassThroughStrategy extends ProceduralAdapter {
    constructor() {
        super('PassThrough');
    }

    supports(context) {
        return !!(context && context.object);
    }

    adapt(context) {
        return new AdaptationResult({
            adaptedObject: context.object,
            originalObject: context.object,
            strategyUsed: this.name,
            isAdapted: false,
            validationHints: {
                loopContinuity: 'Perfect',
                continuityOk: true,
                borderSafe: true
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
