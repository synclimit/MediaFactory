export class BaseFeatureValidator {
    static featureName = "BaseFeature";
    static description = "NOT IMPLEMENTED";
    static requiredEngines = [];
    
    constructor() {
        this.status = 'WAITING'; // WAITING, RUNNING, HEALTHY, WARNING, CRITICAL, SKIPPED, NOT EXECUTED
        this.currentStage = 'IDLE';
        this.logs = [];
        this.startTime = 0;
        this.endTime = 0;
        this.durationMs = 0;
        
        this.scores = {
            configuration: 0,
            engine: 0,
            output: 0,
            acceptance: 0
        };
        
        this.rootCause = null;
    }

    log(message, type = 'info') {
        const entry = { time: new Date().toISOString(), message, type };
        this.logs.push(entry);
        if (window.qaOrchestrator) window.qaOrchestrator.onFeatureLog(this.constructor.featureName, entry);
    }

    setStatus(status) {
        this.status = status;
        if (window.qaOrchestrator) window.qaOrchestrator.onFeatureStatusChange(this.constructor.featureName, status);
    }
    
    setStage(stage) {
        this.currentStage = stage;
        if (window.qaOrchestrator) window.qaOrchestrator.onFeatureStageChange(this.constructor.featureName, stage);
    }

    fail(reason, stage) {
        this.rootCause = reason;
        this.log(`FAILED at ${stage}: ${reason}`, 'error');
        this.setStatus('CRITICAL');
        return false;
    }

    async runLifecycle(startStage = 'Configuration') {
        this.startTime = Date.now();
        this.setStatus('RUNNING');
        this.rootCause = null;
        
        const stages = ['Configuration', 'Engine', 'Output', 'Acceptance'];
        const startIndex = stages.indexOf(startStage);
        
        try {
            // Stage 1: Configuration Validation
            if (startIndex <= 0) {
                this.setStage('Configuration');
                const configScore = await this.validateConfiguration();
                this.scores.configuration = configScore;
                if (configScore < 100) return this.fail(this.rootCause || 'Configuration is invalid or misaligned.', 'Configuration');
            }

            // Stage 2: Engine Validation
            if (startIndex <= 1) {
                this.setStage('Engine');
                const engineScore = await this.validateEngines();
                this.scores.engine = engineScore;
                if (engineScore < 100) return this.fail(this.rootCause || 'Underlying engine dependencies failed.', 'Engine');
            }

            // Stage 3: Output Validation
            if (startIndex <= 2) {
                this.setStage('Output');
                const outputScore = await this.validateOutput();
                this.scores.output = outputScore;
                if (outputScore < 100) return this.fail(this.rootCause || 'Engine executed but output state never changed.', 'Output');
            }

            // Stage 4: Acceptance Validation
            if (startIndex <= 3) {
                this.setStage('Acceptance');
                const acceptanceScore = await this.validateAcceptance();
                this.scores.acceptance = acceptanceScore;
                if (acceptanceScore < 50) return this.fail(this.rootCause || 'User-facing acceptance criteria failed.', 'Acceptance');
            }

            // Overall Health
            this.setStage('Completed');
            const avgScore = (this.scores.configuration + this.scores.engine + this.scores.output + this.scores.acceptance) / 4;
            
            if (avgScore >= 95 && this.scores.acceptance === 100) {
                this.setStatus('HEALTHY');
            } else if (avgScore >= 70) {
                this.setStatus('WARNING');
            } else {
                this.setStatus('CRITICAL');
            }

        } catch (e) {
            this.fail(`Exception: ${e.message}`, this.currentStage);
        } finally {
            this.endTime = Date.now();
            this.durationMs = this.endTime - this.startTime;
            await this.saveHistory();
        }
    }

    // To be implemented by subclasses
    async validateConfiguration() { return 100; }
    
    // Default Engine Validation leverages QAOrchestrator to fetch latest run
    async validateEngines() {
        if (!window.qaOrchestrator || this.constructor.requiredEngines.length === 0) return 100;
        
        let passed = 0;
        for (const req of this.constructor.requiredEngines) {
            const val = window.qaOrchestrator.validators.find(v => v.constructor.engineName === req);
            if (!val) {
                this.rootCause = `Missing required engine validator: ${req}`;
                return 0;
            }
            if (val.status !== 'PASS') {
                this.rootCause = `Dependency engine ${req} is failing (Status: ${val.status}).`;
                return 0;
            }
            passed++;
        }
        
        return (passed / this.constructor.requiredEngines.length) * 100;
    }

    async validateOutput() { return 100; }
    async validateAcceptance() { return 100; }

    async saveHistory() {
        try {
            await fetch(`/api/v1/qa/features/${this.constructor.featureName}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: this.status,
                    scores: this.scores,
                    rootCause: this.rootCause,
                    durationMs: this.durationMs,
                    date: new Date().toISOString()
                })
            });
        } catch (e) {
            // Ignore fetch errors if backend route not ready
        }
    }
}
