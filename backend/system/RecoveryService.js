const ServiceRegistry = require('./ServiceRegistry');

class RecoveryService {
    constructor() {}

    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }
    _getJobService() { return ServiceRegistry.resolve('JobService'); }

    async performFullRecovery() {
        const runtime = this._getRuntime();
        runtime.emit('System.RecoveryStarted', {});
        
        await this.recoverWorkspace();
        await this.recoverJobs();
        await this.recoverTemp();
        await this.recoverQueue();
        
        runtime.emit('System.RecoveryCompleted', {});
    }

    async recoverJobs() {
        const jobService = this._getJobService();
        // Restore orphaned RUNNING jobs to FAILED/RETRYING state safely
        if (jobService) {
            await jobService.restore();
        }
    }

    async recoverQueue() {
        // Will recover worker states
    }

    async recoverTemp() {
        // Will clear interrupted FFmpeg processes temp files using StorageService
    }

    async recoverWorkspace() {
        // Will ensure workspace manifest constraints
    }
}

module.exports = RecoveryService;
