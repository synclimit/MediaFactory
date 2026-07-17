const RenderExecutor = require('./RenderExecutor');

class RenderWorker {
    constructor(id) {
        this.id = id;
        this.isBusy = false;
        this.executor = new RenderExecutor();
    }
    
    async process(job) {
        this.isBusy = true;
        job.progress.update('Preparing', 0, 0);
        
        try {
            const result = await this.executor.execute(job.plan, job.progress, job.hardware);
            job.status = 'Completed';
            job.result = result;
        } catch (err) {
            job.status = 'Failed';
            job.error = err.message;
        } finally {
            this.isBusy = false;
        }
    }
}
module.exports = RenderWorker;