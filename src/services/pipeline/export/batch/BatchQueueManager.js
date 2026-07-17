import { ExportManager } from '../ExportManager';

/**
 * BatchQueueManager
 * 
 * Orchestrates multiple export jobs.
 * Supports Priority, Retry, Failed Jobs, and Parallel Preparation.
 */
export class BatchQueueManager {
    constructor(exportManager) {
        this.exportManager = exportManager;
        this.jobs = []; // Array of job objects
        this.failedJobs = [];
        this.isProcessing = false;
        this.maxRetries = 3;
    }

    addJob(jobConfig, priority = 0) {
        this.jobs.push({
            ...jobConfig,
            id: jobConfig.id || Date.now().toString(),
            priority,
            retries: 0,
            status: 'queued', // queued, preparing, ready, processing, completed, failed
            error: null
        });
        
        this.sortQueue();
    }

    sortQueue() {
        // Higher priority first
        this.jobs.sort((a, b) => b.priority - a.priority);
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.jobs.some(j => j.status === 'queued' || j.status === 'ready' || j.status === 'preparing')) {
            // 1. Parallel Preparation
            await this.prepareJobsInParallel();

            // 2. Find the next ready job
            const nextJobIndex = this.jobs.findIndex(j => j.status === 'ready');
            if (nextJobIndex === -1) {
                // If nothing is ready but some are preparing, we just wait briefly
                await new Promise(res => setTimeout(res, 100));
                continue;
            }

            const currentJob = this.jobs[nextJobIndex];
            
            try {
                // We await the ExportManager wrapper here.
                // Assuming ExportManager can handle Promise-based job tracking.
                await this.executeJobSequential(currentJob);
                currentJob.status = 'completed';
            } catch (err) {
                currentJob.retries++;
                if (currentJob.retries < this.maxRetries) {
                    currentJob.status = 'queued'; // Send back to queue
                    currentJob.error = err.message;
                } else {
                    currentJob.status = 'failed';
                    currentJob.error = err.message;
                    this.failedJobs.push(currentJob);
                }
            }

            this.sortQueue();
        }

        this.isProcessing = false;
    }

    async prepareJobsInParallel() {
        // Find all queued jobs and start preparing them
        const queuedJobs = this.jobs.filter(j => j.status === 'queued');
        
        const prepPromises = queuedJobs.map(async (job) => {
            job.status = 'preparing';
            try {
                // Simulate downloading assets, caching fonts, fetching templates
                await new Promise(resolve => setTimeout(resolve, 50)); 
                job.status = 'ready';
            } catch (e) {
                job.status = 'failed';
                job.error = 'Preparation failed: ' + e.message;
                this.failedJobs.push(job);
            }
        });

        // We don't necessarily await all of them to finish if we want overlap,
        // but for safety in this stub architecture, we kick them off.
        await Promise.all(prepPromises);
    }

    executeJobSequential(job) {
        return new Promise((resolve, reject) => {
            // Inject job into ExportManager and wait for it
            // ExportManager handles the actual rendering and pipeline lock
            this.exportManager.addExportJob({
                ...job,
                onComplete: resolve,
                onError: reject
            });
            
            // Note: Since ExportManager's addExportJob is async-fire-and-forget in the 
            // current stub, we simulate a wrapper that would normally hook into its events.
            
            // For architecture stub, we'll simulate completion after 100ms
            setTimeout(() => resolve(), 100);
        });
    }

    resume() {
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    retryFailedJobs() {
        for (const job of this.failedJobs) {
            job.status = 'queued';
            job.retries = 0;
            job.error = null;
        }
        this.failedJobs = [];
        this.sortQueue();
        this.resume();
    }
}
