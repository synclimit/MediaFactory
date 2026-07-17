const PipelineLifecycle = require('../core/PipelineLifecycle');

class LifecycleHooks {
    static observers = new Map();

    /**
     * Subscribe to a pipeline lifecycle event.
     * @param {string} event - e.g. PipelineLifecycle.Events.PIPELINE_STARTED
     * @param {Function} callback 
     */
    static subscribe(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, []);
        }
        this.observers.get(event).push(callback);
    }

    /**
     * Core pipeline calls this to notify external plugin subscribers.
     * @param {string} event 
     * @param {Object} data 
     */
    static notify(event, data) {
        if (this.observers.has(event)) {
            this.observers.get(event).forEach(cb => cb(data));
        }
    }
}

module.exports = LifecycleHooks;
