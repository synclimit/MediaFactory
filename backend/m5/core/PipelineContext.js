class PipelineContext {
    /**
     * Initializes the immutable PipelineContext.
     * @param {Object} job 
     * @param {Object} config 
     * @param {Object} services - Injected services like Logger, Cache, Diagnostics
     */
    constructor(job, config, services = {}) {
        this.jobId = job.id;
        this.sessionId = job.sessionId || `session_${Date.now()}`;
        this.renderSeed = config.random?.seed || 12345;
        this.config = config;
        this.performanceProfile = config.performance || { budget: 100 };
        this.renderer = config.output?.renderer || 'FFMPEG';
        this.job = job;
        
        // Target versions for this execution
        this.recipeVersion = '1.0.0';
        this.pipelineVersion = 'M5_v2.0';

        // Infrastructure Services
        this.logger = services.logger || console;
        this.diagnostics = services.diagnostics || { emit: () => {} };
        this.cache = services.cache || { get: () => null, set: () => {} };
        this.capabilities = services.capabilities || { supports: () => true };
        this.clock = services.clock || Date;
        this.cancellationToken = services.cancellationToken || { isCancelled: false };
        
        Object.freeze(this);
    }
}

module.exports = PipelineContext;
