import { ExecutionResult } from '../models/ExecutionResult';
import { ExecutionStatus } from '../models/ExecutionStatus';

/**
 * EngineAdapter (Interface / Base Class)
 * All pipeline adapters must implement this interface.
 * The pipeline interacts strictly with adapters, never directly with the underlying Engines.
 */
export class EngineAdapter {
    constructor(id) {
        if (new.target === EngineAdapter) {
            throw new Error("Cannot instantiate EngineAdapter base class directly");
        }
        this.id = id;
    }

    /**
     * Executes the engine logic based on the immutable PipelineContext.
     * @param {PipelineContext} context 
     * @returns {ExecutionResult}
     */
    execute(context) {
        throw new Error("Method 'execute(context)' must be implemented.");
    }

    /**
     * Returns a safe, valid fallback state in case `execute` throws an error.
     * Ensures the pipeline does not crash.
     * @returns {Object}
     */
    defaultState() {
        return {};
    }

    /**
     * Resets the adapter and underlying engine's state.
     */
    reset() {
        throw new Error("Method 'reset()' must be implemented.");
    }

    /**
     * Returns the capabilities or metadata describing what this adapter provides.
     * @returns {Object}
     */
    getCapabilities() {
        throw new Error("Method 'getCapabilities()' must be implemented.");
    }
}
