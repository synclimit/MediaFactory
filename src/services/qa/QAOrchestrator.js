import { EngineRegistry } from './EngineRegistry.js';
import { SessionManager } from './SessionManager.js';
import { FeatureRegistry } from './FeatureRegistry.js';
import './features/BasicFeatures.js';
import { WorkflowRegistry } from './WorkflowRegistry.js';
import './workflows/BasicWorkflows.js';

export class QAOrchestrator {
    constructor() {
        this.status = 'IDLE'; // IDLE, RUNNING, PAUSED, COMPLETED, STOPPED
        this.currentMode = 'Quick';
        this.validators = [];
        this.featureValidators = [];
        this.workflowValidators = [];
        this.progress = { current: 0, completed: 0, remaining: 0, total: 0 };
        this.logs = [];
        this.featureLogs = [];
        this.workflowLogs = [];
        this.listeners = new Set();
        this.startTime = 0;
        this.elapsed = 0;
        this.eta = 0;
        this.healthScore = 0;
        this.currentValidatorName = 'None';
        this.currentFeatureName = 'None';
        this.currentWorkflowName = 'None';
        this.currentSession = null;
        
        window.qaOrchestrator = this;
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify() {
        if (this.status === 'RUNNING') {
            this.elapsed = Date.now() - this.startTime;
            
            if (this.progress.completed > 0) {
                const timePerVal = this.elapsed / this.progress.completed;
                this.eta = timePerVal * this.progress.remaining;
            } else {
                this.eta = 0;
            }
        }
        for (const cb of this.listeners) {
            cb({
                status: this.status,
                progress: this.progress,
                logs: this.logs,
                featureLogs: this.featureLogs,
                workflowLogs: this.workflowLogs,
                validators: this.validators,
                featureValidators: this.featureValidators,
                workflowValidators: this.workflowValidators,
                elapsed: this.elapsed,
                eta: this.eta,
                healthScore: this.healthScore,
                currentValidatorName: this.currentValidatorName,
                currentFeatureName: this.currentFeatureName,
                currentWorkflowName: this.currentWorkflowName,
                currentSession: this.currentSession
            });
        }
    }

    onLog(engineName, entry) {
        const timeStr = new Date(entry.time).toLocaleTimeString('en-GB');
        // V2 Log Format: Timestamp | Engine | Stage/Message | Duration
        const logEntry = {
            time: timeStr,
            engine: engineName,
            message: entry.message,
            raw: `${timeStr} | ${engineName} | ${entry.message}`,
            type: entry.type || (entry.message.includes('FAILED') ? 'error' : entry.message.includes('PASS') ? 'success' : 'info')
        };
        this.logs.push(logEntry);
        if (this.currentSession) {
            this.currentSession.logs.push(logEntry);
        }
        this.notify();
    }

    onStatusChange(engineName, status) {
        this.onLog(engineName, { time: Date.now(), message: `Status changed to ${status}`, type: 'info' });
        if (this.currentSession) {
            const v = this.currentSession.validators.find(val => val.engineName === engineName);
            if (v) v.status = status;
        }
        this.notify();
    }

    onStageChange(engineName, stage) {
        this.onLog(engineName, { time: Date.now(), message: `Stage: ${stage}`, type: 'debug' });
        if (this.currentSession) {
            const v = this.currentSession.validators.find(val => val.engineName === engineName);
            if (v) v.currentStage = stage;
        }
        this.notify();
    }

    onFeatureLog(featureName, entry) {
        const timeStr = new Date(entry.time).toLocaleTimeString('en-GB');
        const logEntry = {
            time: timeStr,
            engine: featureName,
            message: entry.message,
            raw: `${timeStr} | FEATURE:${featureName} | ${entry.message}`,
            type: entry.type
        };
        this.featureLogs.push(logEntry);
        this.notify();
    }

    onFeatureStatusChange(featureName, status) {
        this.onFeatureLog(featureName, { time: Date.now(), message: `Status changed to ${status}`, type: 'info' });
        this.notify();
    }

    onFeatureStageChange(featureName, stage) {
        this.onFeatureLog(featureName, { time: Date.now(), message: `Stage: ${stage}`, type: 'debug' });
        this.notify();
    }

    onWorkflowLog(workflowName, entry) {
        const timeStr = new Date(entry.time).toLocaleTimeString('en-GB');
        const logEntry = {
            time: timeStr,
            engine: workflowName,
            message: entry.message,
            raw: `${timeStr} | WORKFLOW:${workflowName} | ${entry.message}`,
            type: entry.type
        };
        this.workflowLogs.push(logEntry);
        this.notify();
    }

    onWorkflowStatusChange(workflowName, status) {
        this.onWorkflowLog(workflowName, { time: Date.now(), message: `Status changed to ${status}`, type: 'info' });
        this.notify();
    }

    async runWorkflow(workflowName, startStageIndex = 0) {
        const WorkflowClass = WorkflowRegistry.getWorkflows().find(w => w.workflowName === workflowName);
        if (!WorkflowClass) return;

        this.currentMode = 'Workflow';
        this.status = 'RUNNING';
        this.startTime = Date.now();
        this.workflowLogs = [];
        this.currentWorkflowName = workflowName;

        const workflowInstance = new WorkflowClass();
        
        const idx = this.workflowValidators.findIndex(w => w.constructor.workflowName === workflowName);
        if (idx >= 0) this.workflowValidators[idx] = workflowInstance;
        else this.workflowValidators.push(workflowInstance);

        this.notify();

        await workflowInstance.runLifecycle(startStageIndex);
        
        this.status = 'COMPLETED';
        this.notify();
    }

    async runFeature(featureName, startStage = 'Configuration') {
        const FeatureClass = FeatureRegistry.getFeatures().find(f => f.featureName === featureName);
        if (!FeatureClass) return;

        this.currentMode = 'Feature';
        this.status = 'RUNNING';
        this.startTime = Date.now();
        this.featureLogs = [];
        this.currentFeatureName = featureName;
        
        // Ensure required engines are loaded in standard validators array so the feature can find them
        const registered = EngineRegistry.getValidators();
        this.validators = registered.map(V => new V());

        // We run only the REQUIRED underlying engines for this feature in isolation
        // (For a real execution, we would run them here, but the engine validates passively during playback,
        // so we just instantiate them so the Feature can check them).
        // If we want to actually execute them:
        for (const req of FeatureClass.requiredEngines) {
             const val = this.validators.find(v => v.constructor.engineName === req);
             if (val) await val.runLifecycle('Standard');
        }

        const featureInstance = new FeatureClass();
        
        // If it's already in the list, replace it, else push
        const idx = this.featureValidators.findIndex(f => f.constructor.featureName === featureName);
        if (idx >= 0) this.featureValidators[idx] = featureInstance;
        else this.featureValidators.push(featureInstance);

        this.notify();

        await featureInstance.runLifecycle(startStage);
        
        this.status = 'COMPLETED';
        this.notify();
    }

    async run(mode) {
        this.currentMode = mode;
        this.status = 'RUNNING';
        this.startTime = Date.now();
        this.logs = [];
        this.healthScore = 0;
        this.eta = 0;
        
        const registered = EngineRegistry.getValidators();
        
        // Instantiate
        this.validators = registered.map(V => new V());
        this.progress.total = this.validators.length;
        this.progress.remaining = this.validators.length;
        this.progress.completed = 0;
        this.progress.current = 0;

        // Create Session via SessionManager
        this.currentSession = await SessionManager.createSession(mode, this.validators);
        
        this.notify();

        for (let i = 0; i < this.validators.length; i++) {
            if (this.status === 'STOPPED') break;
            while (this.status === 'PAUSED') {
                await new Promise(r => setTimeout(r, 500));
            }

            const val = this.validators[i];
            this.progress.current = i + 1;
            this.currentValidatorName = val.constructor.engineName;
            
            // Check dependencies dynamically
            let depsPassed = true;
            for (const dep of val.constructor.dependencies) {
                const depVal = this.validators.find(v => v.constructor.engineName === dep);
                if (depVal && depVal.status === 'FAILED') {
                    depsPassed = false;
                    break;
                }
            }

            if (!depsPassed) {
                val.setStatus('SKIPPED');
                this.progress.completed++;
                this.progress.remaining--;
                continue;
            }

            await val.runLifecycle(mode);
            
            // Update session data
            if (this.currentSession) {
                const v = this.currentSession.validators.find(v => v.engineName === val.constructor.engineName);
                if (v) {
                    v.durationMs = val.durationMs;
                    if (val.status === 'FAILED') this.currentSession.failures++;
                    if (val.status === 'NOT IMPLEMENTED') this.currentSession.warnings++;
                }
            }
            
            this.progress.completed++;
            this.progress.remaining--;
            
            this.calculateHealthScore();
            if (this.currentSession) {
                this.currentSession.healthScore = this.healthScore;
                this.currentSession.durationMs = Date.now() - this.startTime;
                await SessionManager.save(this.currentSession);
            }
            this.notify();
        }

        this.status = 'COMPLETED';
        this.currentValidatorName = 'None';
        if (this.currentSession) {
            this.currentSession.status = 'COMPLETED';
            this.currentSession.durationMs = Date.now() - this.startTime;
            await SessionManager.save(this.currentSession);
        }
        this.notify();
    }

    pause() {
        if (this.status === 'RUNNING') {
            this.status = 'PAUSED';
            if (this.currentSession) {
                this.currentSession.status = 'PAUSED';
                SessionManager.save(this.currentSession);
            }
        }
        this.notify();
    }

    resume() {
        if (this.status === 'PAUSED') {
            this.status = 'RUNNING';
            if (this.currentSession) {
                this.currentSession.status = 'RUNNING';
                SessionManager.save(this.currentSession);
            }
        }
        this.notify();
    }

    stop() {
        this.status = 'STOPPED';
        if (this.currentSession) {
            this.currentSession.status = 'STOPPED';
            this.currentSession.durationMs = Date.now() - this.startTime;
            SessionManager.save(this.currentSession);
        }
        this.notify();
    }

    calculateHealthScore() {
        const weights = {
            'BeatEngine': 10,
            'SubtitleEngine': 10,
            'VisualRuntime': 10,
            'RenderPipeline': 20,
            'ExportEngine': 25,
            'WhisperEngine': 15,
            'ProjectManager': 10
        };

        let score = 0;
        let possible = 0;

        for (const v of this.validators) {
            const w = weights[v.constructor.engineName] || 0;
            if (w > 0 && v.status !== 'WAITING' && v.status !== 'RUNNING') {
                possible += w;
                if (v.status === 'PASS') score += w;
            }
        }
        
        this.healthScore = possible === 0 ? 0 : Math.round((score / possible) * 100);
    }
}
