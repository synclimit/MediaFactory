/**
 * ProceduralAdapter.js
 * Base Strategy Interface for MediaFactory M3 Fast Workspace Procedural Adaptation (MF-1403).
 * Establishes standard strategy lifecycle: supports(context), adapt(context), and validate(result).
 */

import { AdaptationResult } from './AdaptationResult.js';

export class ProceduralAdapter {
    /**
     * @param {string} name - Strategy identifier
     */
    constructor(name = 'BaseStrategy') {
        this.name = name;
    }

    /**
     * Lifecycle Check: Determines if strategy supports given AdaptationContext
     * @param {import('./AdaptationContext.js').AdaptationContext} context 
     * @returns {boolean}
     */
    supports(context) {
        return !!(context && context.object);
    }

    /**
     * Lifecycle Execution: Performs procedural adaptation
     * @param {import('./AdaptationContext.js').AdaptationContext} context 
     * @returns {AdaptationResult}
     */
    adapt(context) {
        return new AdaptationResult({
            adaptedObject: context?.object || null,
            originalObject: context?.object || null,
            strategyUsed: this.name,
            isAdapted: false
        });
    }

    /**
     * Lifecycle Validation: Validates adaptation result (Prepared for MF-1405 Visual Validation)
     * @param {AdaptationResult} result 
     * @returns {Object} Validation status record
     */
    validate(result) {
        return {
            isValid: true,
            hints: result?.validationHints || { continuityOk: true },
            errors: []
        };
    }
}
