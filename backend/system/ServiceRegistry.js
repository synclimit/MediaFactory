class ServiceRegistry {
    constructor() {
        this.services = new Map();
    }

    register(name, instance) {
        if (this.services.has(name)) {
            throw new Error(`Service ${name} is already registered.`);
        }
        this.services.set(name, instance);
    }

    resolve(name) {
        if (!this.services.has(name)) {
            throw new Error(`Service ${name} not found in registry.`);
        }
        return this.services.get(name);
    }
    
    // Clear all for testing purposes
    clear() {
        this.services.clear();
    }
}

// Export a singleton instance of the registry
const registry = new ServiceRegistry();
module.exports = registry;
