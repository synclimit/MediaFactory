const ServiceRegistry = require('./ServiceRegistry');

class ValidationService {
    constructor() {
        this.rules = new Map();
    }

    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    registerRule(context, ruleFn) {
        if (!this.rules.has(context)) {
            this.rules.set(context, []);
        }
        this.rules.get(context).push(ruleFn);
    }

    validate(context, config) {
        const results = [];
        const runtime = this._getRuntime();

        const contextRules = this.rules.get(context) || [];
        for (const rule of contextRules) {
            const result = rule(config);
            if (result) {
                results.push(result);
                // Emit discrete validation events for tracing
                runtime.emit(`Validation.${result.severity}`, result);
            }
        }

        const criticals = results.filter(r => r.severity === 'CRITICAL');
        const errors = results.filter(r => r.severity === 'ERROR');
        const warnings = results.filter(r => r.severity === 'WARNING');
        
        let overallStatus = 'Success';
        if (criticals.length > 0) overallStatus = 'CRITICAL';
        else if (errors.length > 0) overallStatus = 'ERROR';
        else if (warnings.length > 0) overallStatus = 'WARNING';

        return {
            status: overallStatus,
            issues: results
        };
    }
    
    static createResult(severity, code, message, suggestion) {
        if (!['INFO', 'WARNING', 'ERROR', 'CRITICAL'].includes(severity)) {
            throw new Error(`Invalid severity level: ${severity}`);
        }
        return { severity, code, message, suggestion };
    }
}

module.exports = ValidationService;
