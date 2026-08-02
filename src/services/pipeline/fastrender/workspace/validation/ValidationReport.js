/**
 * ValidationReport.js
 * Deeply immutable payload model for Fast Workspace Visual Validation (MF-1405).
 * References stable segment IDs (segment-intro, segment-loop, etc.).
 */

function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Retrieve the property names defined on obj
    const propNames = Object.getOwnPropertyNames(obj);

    // Freeze properties before freezing self
    for (const name of propNames) {
        const value = obj[name];
        if (value && typeof value === 'object') {
            deepFreeze(value);
        }
    }

    return Object.freeze(obj);
}

export class ValidationReport {
    /**
     * @param {Object} config
     * @param {number} config.score - Deterministic score 0..100
     * @param {Array<Object>} [config.warnings] - List of warning records
     * @param {Array<Object>} [config.errors] - List of error/blocking records
     * @param {Array<string>} [config.affectedSegments] - List of stable segment IDs (e.g. segment-loop)
     * @param {Array<string>} [config.affectedObjects] - List of affected object IDs
     * @param {Array<Object>} [config.boundaryContinuityResults] - Boundary validation contract data
     * @param {number} [config.timestamp] - Execution timestamp (does not affect equality/score)
     */
    constructor(config = {}) {
        this.score = typeof config.score === 'number' ? Math.max(0, Math.min(100, config.score)) : 100;
        this.warnings = Array.isArray(config.warnings) ? config.warnings : [];
        this.errors = Array.isArray(config.errors) ? config.errors : [];
        this.affectedSegments = Array.isArray(config.affectedSegments) ? config.affectedSegments : [];
        this.affectedObjects = Array.isArray(config.affectedObjects) ? config.affectedObjects : [];
        this.boundaryContinuityResults = Array.isArray(config.boundaryContinuityResults) ? config.boundaryContinuityResults : [];
        
        // Report is valid if there are no ERROR or BLOCKING records
        this.isValid = this.errors.length === 0;
        this.timestamp = config.timestamp || 0;

        // Recursively freeze entire object structure to guarantee deep immutability
        deepFreeze(this);
    }
}
