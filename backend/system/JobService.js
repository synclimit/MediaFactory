const crypto = require('crypto');
const path = require('path');
const ServiceRegistry = require('./ServiceRegistry');

class JobService {
    constructor() {
        this.config = null;
        this.workspace = null;
        this.runtime = null;
    }

    _getConfig() {
        if (!this.config) this.config = ServiceRegistry.resolve('ConfigurationService');
        return this.config;
    }

    _getWorkspace() {
        if (!this.workspace) this.workspace = ServiceRegistry.resolve('WorkspaceService');
        return this.workspace;
    }

    _getRuntime() {
        if (!this.runtime) this.runtime = ServiceRegistry.resolve('RuntimeService');
        return this.runtime;
    }

    async _getJobsData() {
        const workspacePath = this._getWorkspace()._getActivePath();
        const jobsPath = path.join(workspacePath, 'Database', 'jobs.json');
        
        let jobsData = await this._getConfig().load(jobsPath);
        if (!jobsData) {
            jobsData = { data: { queue: [], history: [] } };
        }
        return { path: jobsPath, data: jobsData };
    }

    async _saveJobsData(jobsPath, jobsData) {
        await this._getConfig().save(jobsPath, jobsData);
    }

    async create(projectId, jobDetails) {
        const { path: jobsPath, data: jobsData } = await this._getJobsData();
        
        const job = {
            id: crypto.randomUUID(),
            projectId,
            status: 'CREATED',
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            details: jobDetails
        };

        jobsData.data.queue.push(job);
        await this._saveJobsData(jobsPath, jobsData);
        
        this._getRuntime().emit('Jobs.Created', { jobId: job.id, projectId });
        return job;
    }

    async enqueue(jobId) {
        await this._updateStatus(jobId, 'QUEUED');
    }

    async pause(jobId) {
        await this._updateStatus(jobId, 'PAUSED');
    }

    async resume(jobId) {
        await this._updateStatus(jobId, 'WAITING'); 
    }

    async retry(jobId) {
        await this._updateStatus(jobId, 'RETRYING');
    }

    async cancel(jobId) {
        await this._updateStatus(jobId, 'CANCELLED');
        await this._moveToHistory(jobId);
    }

    async remove(jobId) {
        const { path: jobsPath, data: jobsData } = await this._getJobsData();
        
        jobsData.data.queue = jobsData.data.queue.filter(j => j.id !== jobId);
        jobsData.data.history = jobsData.data.history.filter(j => j.id !== jobId);
        
        await this._saveJobsData(jobsPath, jobsData);
        this._getRuntime().emit('Jobs.Removed', { jobId });
    }

    async restore() {
        const { path: jobsPath, data: jobsData } = await this._getJobsData();
        let changed = false;

        jobsData.data.queue.forEach(job => {
            if (['STARTING', 'RUNNING'].includes(job.status)) {
                job.status = 'FAILED';
                job.details.error = "Interrupted by system shutdown";
                job.updatedAt = new Date().toISOString();
                changed = true;
                this._getRuntime().emit('Jobs.StatusChanged', { jobId: job.id, status: job.status });
            }
        });

        if (changed) {
            await this._saveJobsData(jobsPath, jobsData);
        }
    }

    async _updateStatus(jobId, status) {
        const { path: jobsPath, data: jobsData } = await this._getJobsData();
        const job = jobsData.data.queue.find(j => j.id === jobId);
        
        if (!job) throw new Error(`Job ${jobId} not found in active queue`);

        job.status = status;
        job.updatedAt = new Date().toISOString();
        
        await this._saveJobsData(jobsPath, jobsData);
        this._getRuntime().emit('Jobs.StatusChanged', { jobId, status });
        
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
            await this._moveToHistory(jobId);
        }
    }

    async _moveToHistory(jobId) {
        const { path: jobsPath, data: jobsData } = await this._getJobsData();
        const jobIndex = jobsData.data.queue.findIndex(j => j.id === jobId);
        
        if (jobIndex > -1) {
            const job = jobsData.data.queue.splice(jobIndex, 1)[0];
            jobsData.data.history.push(job);
            await this._saveJobsData(jobsPath, jobsData);
        }
    }
}

module.exports = JobService;
