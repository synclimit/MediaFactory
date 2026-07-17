class EngineResult {
    /**
     * @param {boolean} success 
     * @param {any} data 
     * @param {Array} errors 
     * @param {Array} warnings 
     * @param {Object} metrics { executionTimeMs, memoryDeltaKb, assetCount, outputCount, warningsCount }
     */
    constructor(success, data, errors = [], warnings = [], metrics = {}) {
        this.success = success;
        this.data = data;
        this.errors = errors;
        this.warnings = warnings;
        
        this.metrics = {
            executionTimeMs: metrics.executionTimeMs || 0,
            memoryDeltaKb: metrics.memoryDeltaKb || 0,
            assetCount: metrics.assetCount || 0,
            outputCount: metrics.outputCount || 0,
            warningsCount: warnings.length
        };
        
        Object.freeze(this.metrics);
        Object.freeze(this);
    }

    static success(data, metrics = {}) {
        return new EngineResult(true, data, [], [], metrics);
    }

    static warning(data, warnings = [], metrics = {}) {
        return new EngineResult(true, data, [], warnings, metrics);
    }

    static error(error, metrics = {}) {
        return new EngineResult(false, null, Array.isArray(error) ? error : [error], [], metrics);
    }
}

module.exports = EngineResult;
