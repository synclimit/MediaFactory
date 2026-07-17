/**
 * PipelineContext
 * An immutable context object passed to every EngineAdapter.execute(context).
 * It is instantiated once per frame and provides read-only access to all contextual data.
 */
export class PipelineContext {
    /**
     * @param {Object} config
     * @param {Object} config.timeline Snapshot of timeline state
     * @param {Object} config.settings Snapshot of global settings
     * @param {number} config.frameNumber Current absolute frame number
     * @param {string} config.renderMode Value from RenderMode enum
     * @param {Map} config.providers Map of all active providers
     */
    constructor({ timeline, settings, frameNumber, renderMode, providers = new Map() }) {
        this.timeline = Object.freeze({ ...timeline });
        this.settings = Object.freeze({ ...settings });
        this.frameNumber = frameNumber;
        this.renderMode = renderMode;
        
        // Ensure providers is a Map and clone it shallowly so it can't be mutated externally
        if (!(providers instanceof Map)) {
            throw new Error("PipelineContext providers must be a Map");
        }
        
        // Read-only proxy for the Map to prevent modifications
        this.providers = {
            get: (key) => providers.get(key),
            has: (key) => providers.has(key),
            keys: () => providers.keys(),
            values: () => providers.values(),
            entries: () => providers.entries(),
            size: providers.size
        };

        // We do not freeze diagnostics here, it is accumulated per frame in RenderFrame metadata, 
        // but adapters should not mutate context directly, they return it via ExecutionResult.

        Object.freeze(this.providers);
        Object.freeze(this);
    }
}
