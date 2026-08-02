/**
 * OutputManager
 * Responsibilities:
 * - Manage active output adapters.
 * - Dispatch RenderFrame to registered adapters.
 * - No rendering logic.
 */
export class OutputManager {
    constructor() {
        this.adapters = new Map();
    }

    /**
     * Registers an output adapter under a specific key.
     * @param {string} key 
     * @param {OutputAdapter} adapter 
     */
    registerAdapter(key, adapter) {
        this.adapters.set(key, adapter);
        adapter.initialize();
    }

    /**
     * Unregisters an output adapter.
     * @param {string} key 
     */
    unregisterAdapter(key) {
        if (this.adapters.has(key)) {
            const adapter = this.adapters.get(key);
            adapter.dispose();
            this.adapters.delete(key);
        }
    }

    /**
     * Retrieves a registered adapter by key.
     * @param {string} key 
     * @returns {OutputAdapter|undefined}
     */
    getAdapter(key) {
        return this.adapters.get(key);
    }

    /**
     * Dispatches the immutable RenderFrame to all active adapters.
     * @param {RenderFrame} frame 
     */
    dispatch(frame) {
        if (!frame) return;

        for (const adapter of this.adapters.values()) {
            try {
                adapter.render(frame);
            } catch (err) {
                console.error('OutputManager adapter dispatch error:', err);
            }
        }
    }

    shutdown() {
        for (const adapter of this.adapters.values()) {
            adapter.dispose();
        }
        this.adapters.clear();
    }
}

export const outputManager = new OutputManager();
