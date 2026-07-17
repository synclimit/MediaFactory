/**
 * EngineRegistry
 * Strictly stores EngineAdapter instances and maintains a registryVersion.
 * Registration order does not determine execution order.
 */
export class EngineRegistry {
    constructor() {
        this._adapters = new Map();
        this._nodes = new Map(); // ExecutionNodes
        this.registryVersion = 0;
    }

    /**
     * Registers an adapter with its dependency metadata.
     * @param {Object} config
     * @param {string} config.id
     * @param {EngineAdapter} config.adapter
     * @param {Array<string>} config.dependencies Array of adapter IDs this adapter depends on
     * @param {number} config.priority Higher number means higher priority (used for tie-breaking)
     * @param {boolean} config.enabled
     */
    register({ id, adapter, dependencies = [], priority = 0, enabled = true }) {
        if (!id || !adapter) throw new Error("Adapter and ID are required");

        this._adapters.set(id, adapter);
        this._nodes.set(id, {
            id,
            adapter,
            dependencies,
            priority,
            enabled
        });
        this.registryVersion++;
    }

    unregister(id) {
        if (this._adapters.has(id)) {
            this._adapters.delete(id);
            this._nodes.delete(id);
            this.registryVersion++;
        }
    }

    get(id) {
        return this._adapters.get(id);
    }

    getNode(id) {
        return this._nodes.get(id);
    }

    getAllNodes() {
        return Array.from(this._nodes.values());
    }
}
