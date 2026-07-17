import { ExecutionStatus } from './ExecutionStatus';

/**
 * ExecutionResult
 * Returned by EngineAdapter.execute(context).
 * Encapsulates the output state, performance metrics, and any generated diagnostics.
 */
export class ExecutionResult {
    /**
     * @param {Object} config
     * @param {string} config.status ExecutionStatus value
     * @param {Object} config.state The output state from the engine
     * @param {Object} config.metrics Profiling metrics (e.g. executionTime)
     * @param {Array<PipelineDiagnostic>} config.diagnostics Any diagnostics or errors produced
     */
    constructor({ status = ExecutionStatus.SUCCESS, state = {}, metrics = {}, diagnostics = [] }) {
        this.status = status;
        this.state = state;
        this.metrics = metrics;
        this.diagnostics = diagnostics;
        Object.freeze(this);
    }
}
