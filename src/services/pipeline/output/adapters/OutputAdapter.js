/**
 * OutputAdapter Interface
 * Defines the contract for all rendering and output targets.
 */
export class OutputAdapter {
    /**
     * Called when the adapter is registered or the pipeline starts.
     */
    initialize() {
        throw new Error("Method 'initialize()' must be implemented.");
    }

    /**
     * Receives an immutable RenderFrame and performs necessary output operations.
     * @param {RenderFrame} frame 
     */
    render(frame) {
        throw new Error("Method 'render()' must be implemented.");
    }

    /**
     * Called when the adapter is unregistered or the pipeline shuts down.
     */
    dispose() {
        throw new Error("Method 'dispose()' must be implemented.");
    }
}
