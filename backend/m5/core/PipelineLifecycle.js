class PipelineLifecycle {
    static Events = {
        PIPELINE_STARTED: 'PIPELINE_STARTED',
        STAGE_STARTED: 'STAGE_STARTED',
        STAGE_FINISHED: 'STAGE_FINISHED',
        STAGE_SKIPPED: 'STAGE_SKIPPED',
        STAGE_FAILED: 'STAGE_FAILED',
        PIPELINE_COMPLETED: 'PIPELINE_COMPLETED',
        PIPELINE_CANCELLED: 'PIPELINE_CANCELLED',
        PIPELINE_CACHED: 'PIPELINE_CACHED',
        PIPELINE_RECOVERED: 'PIPELINE_RECOVERED'
    };

    /**
     * Emits a pipeline event through the provided context.
     * @param {PipelineContext} context 
     * @param {string} event 
     * @param {Object} data 
     */
    static emit(context, event, data = {}) {
        if (context && context.diagnostics && typeof context.diagnostics.emit === 'function') {
            context.diagnostics.emit(event, { timestamp: context.clock.now(), ...data });
        }
    }
}

module.exports = PipelineLifecycle;
