class QueueManager {
    constructor() {
        this.queue = [];
        this.activeJobs = 0;
        this.maxConcurrent = 3;
        this.isPaused = false;
    }
    
    addJobs(urls, priority = 'normal') {
        urls.forEach(url => {
            this.queue.push({
                id: require('crypto').randomUUID(),
                url,
                priority: priority === 'high' ? 1 : 0,
                status: 'pending',
                retries: 0
            });
        });
        this.queue.sort((a, b) => b.priority - a.priority);
    }
    
    pause() { this.isPaused = true; }
    resume() { this.isPaused = false; }
    cancel(jobId) {
        const job = this.queue.find(j => j.id === jobId);
        if (job) job.status = 'cancelled';
    }
    retry(jobId) {
        const job = this.queue.find(j => j.id === jobId);
        if (job) {
            job.status = 'pending';
            job.retries++;
        }
    }
    
    process(processorCallback) {
        if (this.isPaused) return;
        
        const pending = this.queue.filter(j => j.status === 'pending');
        pending.forEach(job => {
            if (this.activeJobs < this.maxConcurrent) {
                this.activeJobs++;
                job.status = 'processing';
                processorCallback(job).finally(() => {
                    this.activeJobs--;
                });
            }
        });
    }
}
module.exports = QueueManager;