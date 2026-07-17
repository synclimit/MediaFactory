class EngineRegistry {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    /**
     * Register a class or factory function
     * @param {string} name 
     * @param {any} definition 
     * @param {boolean} isSingleton 
     */
    register(name, definition, isSingleton = true) {
        this.services.set(name, { definition, isSingleton });
    }

    /**
     * Resolve a service by name
     * @param {string} name 
     * @returns {any}
     */
    resolve(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`EngineRegistry: Service '${name}' not found.`);
        }

        if (service.isSingleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, this._instantiate(service.definition));
            }
            return this.singletons.get(name);
        }

        return this._instantiate(service.definition);
    }

    _instantiate(definition) {
        // If it's a class with constructor, instantiate it. 
        // For simplicity in this architecture, we assume modules export either the class or the object instance directly.
        // We'll treat definition as an instance if it's an object, or instantiate if it's a class.
        if (typeof definition === 'function') {
            try {
                return new definition();
            } catch (e) {
                return definition(); // Factory
            }
        }
        return definition; // Pre-instantiated object
    }

    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}

// Export as a global singleton container
module.exports = new EngineRegistry();
