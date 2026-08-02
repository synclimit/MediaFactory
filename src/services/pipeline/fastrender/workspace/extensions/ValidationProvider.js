/**
 * ValidationProvider.js
 * Extension point for Fast Workspace Visual Validation (MF-1405).
 * Inactive in Normal Workspace; Active in Fast Workspace via FastValidationProvider.
 */

import { validationEngine } from '../validation/ValidationEngine.js';
import { ValidationReport } from '../validation/ValidationReport.js';

export class ValidationProvider {
    constructor() {
        this.isActive = false;
    }

    /**
     * Perform visual validation on workspace state / composition graph.
     * In Normal Workspace, returns a clean neutral validation pass.
     * @returns {ValidationReport}
     */
    validate(compositionGraph, adaptationResults = []) {
        return new ValidationReport({
            score: 100,
            warnings: [],
            errors: [],
            affectedSegments: [],
            affectedObjects: [],
            boundaryContinuityResults: [],
            timestamp: 0
        });
    }

    /**
     * Placeholder method for live workspace validation
     */
    validateWorkspaceState(projectState) {
        return { isValid: true, issues: [] };
    }

    /**
     * Placeholder method for preflight rule checks
     */
    checkRule(ruleId, object) {
        return { passed: true };
    }
}

export class FastValidationProvider extends ValidationProvider {
    constructor() {
        super();
        this.isActive = true;
    }

    /**
     * Delegate Fast Workspace validation to ValidationEngine
     * @param {import('../composition/CompositionGraph.js').CompositionGraph} compositionGraph 
     * @param {Array<import('../adaptation/AdaptationResult.js').AdaptationResult>} [adaptationResults]
     * @returns {ValidationReport}
     */
    validate(compositionGraph, adaptationResults = []) {
        return validationEngine.validate(compositionGraph, adaptationResults);
    }
}

export const inactiveValidationProvider = new ValidationProvider();
export const activeFastValidationProvider = new FastValidationProvider();
