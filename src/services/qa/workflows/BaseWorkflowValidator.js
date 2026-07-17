export class BaseWorkflowValidator {
    static workflowName = "BaseWorkflow";
    static description = "NOT IMPLEMENTED";
    
    constructor() {
        this.status = 'WAITING'; // WAITING, RUNNING, HEALTHY, WARNING, CRITICAL, SKIPPED
        this.stages = []; // Define stages in subclasses
        this.currentStageIndex = -1;
        this.logs = [];
        this.startTime = 0;
        this.endTime = 0;
        this.durationMs = 0;
        
        this.metrics = {
            stagesPassed: 0,
            stagesFailed: 0,
            warnings: 0
        };

        this.failureTrace = null;
    }

    log(message, type = 'info') {
        const entry = { time: new Date().toISOString(), message, type };
        this.logs.push(entry);
        if (window.qaOrchestrator) window.qaOrchestrator.onWorkflowLog(this.constructor.workflowName, entry);
    }

    setStatus(status) {
        this.status = status;
        if (window.qaOrchestrator) window.qaOrchestrator.onWorkflowStatusChange(this.constructor.workflowName, status);
    }

    async runLifecycle(startStageIndex = 0) {
        this.startTime = Date.now();
        this.setStatus('RUNNING');
        this.failureTrace = null;
        
        try {
            for (let i = startStageIndex; i < this.stages.length; i++) {
                this.currentStageIndex = i;
                const stage = this.stages[i];
                this.log(`Executing Stage: ${stage.name}`, 'info');

                // 1. Verify Previous State
                const prevState = await stage.getBeforeState();
                if (!await stage.verifyBeforeState(prevState)) {
                    this.failTrace(stage, prevState, stage.expectedBefore, prevState, 'Previous state did not match expected requirements.');
                    return;
                }

                // 2. Perform Action
                await stage.action();
                
                // 3. Verify Next State
                const nextState = await stage.getAfterState();
                if (!await stage.verifyAfterState(nextState)) {
                    this.failTrace(stage, prevState, stage.expectedAfter, nextState, 'State did not transition correctly after action.');
                    return;
                }

                // 4. Acceptance (Optional specific checks or feature validator runs)
                const acceptance = await stage.verifyAcceptance();
                if (!acceptance.passed) {
                    this.failTrace(stage, prevState, 'Acceptance Passed', 'Acceptance Failed', acceptance.reason || 'Acceptance criteria not met.', acceptance.feature, acceptance.engine);
                    return;
                }

                this.metrics.stagesPassed++;
            }

            this.setStatus(this.metrics.warnings > 0 ? 'WARNING' : 'HEALTHY');

        } catch (e) {
            this.log(`Exception: ${e.message}`, 'error');
            this.setStatus('CRITICAL');
        } finally {
            this.endTime = Date.now();
            this.durationMs = this.endTime - this.startTime;
            this.currentStageIndex = -1;
            await this.saveHistory();
        }
    }

    failTrace(stage, prevState, expected, actual, rootCause, feature = 'Unknown', engine = 'Unknown') {
        this.metrics.stagesFailed++;
        this.failureTrace = {
            workflow: this.constructor.workflowName,
            stage: stage.name,
            previousState: prevState,
            expectedState: expected,
            actualState: actual,
            feature: feature,
            engine: engine,
            rootCause: rootCause
        };
        this.log(`FAILED at ${stage.name}: ${rootCause}`, 'error');
        this.setStatus('CRITICAL');
    }

    async saveHistory() {
        try {
            await fetch(`/api/v1/qa/workflows/${this.constructor.workflowName}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: this.status,
                    metrics: this.metrics,
                    failureTrace: this.failureTrace,
                    durationMs: this.durationMs,
                    date: new Date().toISOString()
                })
            });
        } catch (e) {}
    }
}
