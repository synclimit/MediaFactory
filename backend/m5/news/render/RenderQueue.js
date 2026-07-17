const RenderWorker = require('./RenderWorker');
const RenderProgress = require('./RenderProgress');

class RenderQueue {
    constructor() {
        this.jobs = [];
        this.workers = [new RenderWorker(1)]; // Sequential Support, Future-ready for Parallel workers
    }
    
    addJob(plan, hardware = 'CPU') {
        const job = {
            id: plan.id,
            plan,
            hardware,
            status: 'Queued',
            progress: new RenderProgress(plan.id),
            result: null
        };
        this.jobs.push(job);
        this.processNext();
        return job;
    }
    
    cancelJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job && job.status === 'Queued') {
            job.status = 'Cancelled';
        }
    }
    
    async processNext() {
        const availableWorker = this.workers.find(w => !w.isBusy);
        if (!availableWorker) return;
        
        const nextJob = this.jobs.find(j => j.status === 'Queued');
        if (nextJob) {
            nextJob.status = 'Preparing';
            await availableWorker.process(nextJob);
            this.processNext(); // process next after complete
        }
    }
}
module.exports = RenderQueue;