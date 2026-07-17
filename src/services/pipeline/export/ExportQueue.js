/**
 * ExportQueue
 * Manages the sequence of export jobs locally.
 */
export class ExportQueue {
    constructor() {
        this.queue = [];
        this.activeJob = null;
    }

    addJob(job) {
        this.queue.push({
            ...job,
            id: job.id || Date.now().toString(),
            status: 'pending',
            progress: 0
        });
    }

    removeJob(jobId) {
        this.queue = this.queue.filter(j => j.id !== jobId);
    }

    getNextJob() {
        return this.queue.find(j => j.status === 'pending');
    }

    updateJobStatus(jobId, status, progress = null) {
        const job = this.queue.find(j => j.id === jobId);
        if (job) {
            job.status = status;
            if (progress !== null) {
                job.progress = progress;
            }
        }
    }

    getJobs() {
        return [...this.queue];
    }
}
