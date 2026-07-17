import { SessionManager } from './SessionManager.js';

export class BaseValidator {
    static engineName = "BaseEngine";
    static description = "NOT IMPLEMENTED";
    static version = "NOT IMPLEMENTED";
    static author = "NOT IMPLEMENTED";
    static supportedModes = ['Monitor']; // Base addition for Revision 4
    static dependencies = [];
    static components = [];

    constructor() {
        this.status = 'WAITING'; // WAITING, RUNNING, PASS, FAILED, SKIPPED, NOT EXECUTED, TIMEOUT, CANCELLED
        this.logs = [];
        this.evidence = {};
        this.startTime = 0;
        this.endTime = 0;
        this.durationMs = 0;
        this.currentStage = 'IDLE';

        // Revision 3: Runtime Counters
        this.metrics = {
            executionCount: 0,
            updateCount: 0,
            avgExecutionTime: 0,
            maxExecutionTime: 0,
            minExecutionTime: Number.MAX_VALUE,
            skippedFrames: 0,
            droppedFrames: 0,
            exceptions: 0,
            warnings: 0
        };
    }

    log(message, type = 'info') {
        const entry = { time: new Date().toISOString(), message, type };
        this.logs.push(entry);
        if (type === 'warning') this.metrics.warnings++;
        if (type === 'error') this.metrics.exceptions++;
        if (window.qaOrchestrator) window.qaOrchestrator.onLog(this.constructor.engineName, entry);
    }

    setStatus(status) {
        this.status = status;
        if (window.qaOrchestrator) window.qaOrchestrator.onStatusChange(this.constructor.engineName, status);
    }

    setStage(stage) {
        this.currentStage = stage;
        if (window.qaOrchestrator) window.qaOrchestrator.onStageChange(this.constructor.engineName, stage);
    }

    recordExecution(durationMs) {
        this.metrics.executionCount++;
        this.metrics.maxExecutionTime = Math.max(this.metrics.maxExecutionTime, durationMs);
        this.metrics.minExecutionTime = Math.min(this.metrics.minExecutionTime, durationMs);
        this.metrics.avgExecutionTime = ((this.metrics.avgExecutionTime * (this.metrics.executionCount - 1)) + durationMs) / this.metrics.executionCount;
    }

    async runLifecycle(mode) {
        this.startTime = Date.now();
        this.metrics.executionCount = 0; // reset
        
        try {
            if (!this.constructor.supportedModes.includes(mode) && mode !== 'Custom') {
                this.setStatus('SKIPPED');
                return;
            }

            this.setStatus('RUNNING');
            
            this.setStage('initialize');
            this.log('initialize() started', 'DEBUG');
            await this.initialize();
            
            this.setStage('preCheck');
            this.log('preCheck() started', 'DEBUG');
            await this.preCheck();
            
            this.setStage('validate');
            this.log(`validate() started in mode ${mode}`, 'DEBUG');

            // Revision 4: Monitor Mode vs Run Once
            let result;
            if (mode === 'Monitor') {
                // Continuous Monitoring Loop
                while (this.status === 'RUNNING' && window.qaOrchestrator && window.qaOrchestrator.status !== 'STOPPED') {
                    const iterStart = performance.now();
                    result = await this.validate(mode);
                    this.recordExecution(performance.now() - iterStart);
                    
                    if (result === 'FAILED' || result === 'NOT IMPLEMENTED' || result === 'NOT EXECUTED') {
                        break; // Stop loop on critical failure
                    }
                    
                    // Small yield to prevent thread lock
                    await new Promise(r => setTimeout(r, 100));
                }
                if (result !== 'FAILED' && result !== 'NOT EXECUTED' && result !== 'NOT IMPLEMENTED') {
                    result = 'PASS'; // If we stopped cleanly
                }
            } else {
                const iterStart = performance.now();
                result = await this.validate(mode);
                this.recordExecution(performance.now() - iterStart);
            }
            
            if (result === 'NOT IMPLEMENTED' || result === 'NOT EXECUTED' || result === 'FAILED') {
                this.setStatus(result);
                if (result === 'NOT IMPLEMENTED') {
                    this.log('Validator not implemented', 'WARNING');
                }
            }
            
            this.setStage('generateEvidence');
            this.log('generateEvidence() started', 'DEBUG');
            await this.generateEvidence();
            
            this.setStage('postCheck');
            this.log('postCheck() started', 'DEBUG');
            await this.postCheck();
            
            // Re-save session briefly so the backend has updated status and writes the files
            if (window.qaOrchestrator && window.qaOrchestrator.currentSession) {
                await SessionManager.save(window.qaOrchestrator.currentSession);
                
                // SESSION VALIDATION CHECK
                const verification = await SessionManager.verify(window.qaOrchestrator.currentSession.id);
                if (verification) {
                    const required = ['summary.json', 'health.json', 'execution.log', 'metrics.json', 'evidence'];
                    const missing = required.filter(f => !verification.files.includes(f));
                    if (missing.length > 0) {
                        this.log(`Evidence persistence incomplete. Missing: ${missing.join(', ')}`, 'error');
                        this.setStatus('FAILED');
                        result = 'FAILED';
                    } else if (verification.evidenceFiles.length === 0 && this.status !== 'FAILED') {
                        this.log(`Evidence directory is empty.`, 'warning');
                    } else {
                        this.log('Session evidence verified on disk.', 'success');
                    }
                }
            }
            
            if (this.status === 'RUNNING') {
                this.setStatus('PASS');
            }
        } catch (error) {
            this.log(`Error during lifecycle: ${error.message}`, 'error');
            this.setStatus('FAILED');
        } finally {
            try {
                this.setStage('cleanup');
                this.log('cleanup() started', 'DEBUG');
                await this.cleanup();
                
                this.setStage('dispose');
                this.log('dispose() started', 'DEBUG');
                await this.dispose();
            } catch (cleanupError) {
                this.log(`Error during cleanup: ${cleanupError.message}`, 'error');
            }
            this.endTime = Date.now();
            this.durationMs = this.endTime - this.startTime;
            this.setStage('COMPLETED');
        }
    }

    async saveEvidence(filename, data) {
        if (!window.qaOrchestrator || !window.qaOrchestrator.currentSession) return;
        const sessionId = window.qaOrchestrator.currentSession.id;
        
        let content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        
        try {
            await fetch(`/api/v1/qa/sessions/${sessionId}/evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content, isBase64: false })
            });
            this.log(`Evidence saved: ${filename}`, 'DEBUG');
        } catch (e) {
            this.log(`Failed to save evidence ${filename}: ${e.message}`, 'error');
        }
    }

    async initialize() {}
    async preCheck() {}
    async validate(mode) { return 'NOT IMPLEMENTED'; }
    async generateEvidence() {}
    async postCheck() {}
    async cleanup() {}
    async dispose() {}
}
