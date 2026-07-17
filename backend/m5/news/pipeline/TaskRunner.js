const PipelineStatus = require('./PipelineStatus');
class TaskRunner {
    constructor(cancellationManager, retryManager, errorManager) {
        this.cancellation = cancellationManager;
        this.retry = retryManager;
        this.errorManager = errorManager;
    }
    
    async run(stageId, taskFn, progress, inspector) {
        if (this.cancellation.isCancelled()) {
            progress.update(stageId, PipelineStatus.CANCELLED);
            throw new Error('Pipeline Cancelled');
        }
        
        progress.update(stageId, PipelineStatus.RUNNING);
        const start = Date.now();
        
        let attempt = 0;
        let lastError = null;
        
        while (attempt < 3) {
            try {
                if (this.cancellation.isCancelled()) throw new Error('Cancelled');
                
                const result = await taskFn();
                const duration = Date.now() - start;
                
                progress.update(stageId, PipelineStatus.COMPLETED, duration);
                inspector.update(stageId, result);
                return result;
                
            } catch (err) {
                if (err.message === 'Cancelled') {
                    progress.update(stageId, PipelineStatus.CANCELLED, Date.now() - start);
                    throw err;
                }
                
                lastError = err;
                attempt++;
                
                if (!this.retry.shouldRetry(err, attempt)) {
                    progress.update(stageId, PipelineStatus.ERROR, Date.now() - start);
                    const handled = this.errorManager.handle(err, stageId);
                    throw new Error(`Failed at ${stageId}: ${handled.message}`);
                }
            }
        }
        
        throw lastError;
    }
}
module.exports = TaskRunner;