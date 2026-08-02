/**
 * AdaptationResult.js
 * Result payload model for MediaFactory M3 Fast Workspace Procedural Adaptation (MF-1403).
 * Extends result structure with validationHints, warnings, and debugData in preparation for MF-1405 Visual Validation.
 */

export class AdaptationResult {
    /**
     * @param {Object} config
     * @param {Object} config.adaptedObject - Adapted object instance
     * @param {Object} [config.originalObject] - Unmodified original object instance
     * @param {string} [config.strategyUsed] - Strategy name applied
     * @param {Object} [config.metadata] - Execution metadata
     * @param {Object} [config.validationHints] - Hints prepared for MF-1405 Visual Validation
     * @param {Array<string>} [config.warnings] - Warning messages
     * @param {Object} [config.debugData] - Debug payload
     */
    constructor(config = {}) {
        this.adaptedObject = config.adaptedObject || null;
        this.originalObject = config.originalObject || config.adaptedObject || null;
        this.strategyUsed = config.strategyUsed || 'PassThrough';
        this.isAdapted = config.isAdapted !== undefined ? !!config.isAdapted : (this.strategyUsed !== 'PassThrough');
        this.metadata = config.metadata || { timestamp: Date.now() };
        
        // Prepared for MF-1405 Visual Validation
        this.validationHints = config.validationHints || {
            continuityOk: true,
            borderSafe: true,
            recommendedCheck: 'VisualLoopBoundary'
        };

        this.warnings = Array.isArray(config.warnings) ? config.warnings : [];
        this.debugData = config.debugData || {};
    }
}
