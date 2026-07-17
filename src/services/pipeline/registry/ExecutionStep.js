/**
 * ExecutionStep
 * Represents a single step in the ExecutionPlan.
 */
export class ExecutionStep {
    /**
     * @param {Object} config
     * @param {string} config.id
     * @param {EngineAdapter} config.adapter
     */
    constructor({ id, adapter }) {
        this.id = id;
        this.adapter = adapter;
        Object.freeze(this);
    }
}
