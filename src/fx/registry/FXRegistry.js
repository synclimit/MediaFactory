/**
 * FXRegistry.js
 * Central registry for all FX plugins in MediaFactory.
 * Stores effect metadata, default parameters, and logic blocks.
 */
class FXRegistry {
    constructor() {
        this.effects = new Map();
        this.categories = new Set();
    }

    /**
     * Registers a new FX plugin
     * @param {Object} plugin The FX plugin definition
     * @param {Object} plugin.metadata Metadata like id, name, category, etc.
     * @param {Object} plugin.defaultConfig Default parameter values
     * @param {Function} plugin.initialize Initialization logic
     * @param {Function} plugin.update Update logic (called per frame)
     * @param {Function} plugin.render Render logic (shader or canvas ops)
     */
    register(plugin) {
        if (!plugin || !plugin.metadata || !plugin.metadata.id) {
            console.warn('FXRegistry: Attempted to register invalid FX plugin');
            return;
        }

        const id = plugin.metadata.id;
        if (this.effects.has(id)) {
            console.warn(`FXRegistry: Effect with id ${id} is already registered. Overwriting.`);
        }

        this.effects.set(id, plugin);
        
        if (plugin.metadata.category) {
            this.categories.add(plugin.metadata.category);
        }
        
        console.log(`[FX] Registered: ${plugin.metadata.name} (${id})`);
    }

    /**
     * Retrieves an FX plugin by ID
     * @param {string} id The unique plugin ID
     * @returns {Object|null} The plugin definition or null if not found
     */
    get(id) {
        return this.effects.get(id) || null;
    }

    /**
     * Gets all registered effects, optionally filtered by category
     * @param {string} [category] Optional category to filter by
     * @returns {Array} Array of effect plugins
     */
    getAll(category = null) {
        const all = Array.from(this.effects.values());
        if (category) {
            return all.filter(p => p.metadata.category === category);
        }
        return all;
    }

    /**
     * Returns a list of all unique registered categories
     * @returns {Array<string>} Array of category names
     */
    getCategories() {
        return Array.from(this.categories).sort();
    }

    /**
     * Creates a new instance of an effect for the FX Stack
     * @param {string} id Effect ID
     * @returns {Object} An active instance of the effect with its own state and config
     */
    createInstance(id) {
        const plugin = this.get(id);
        if (!plugin) throw new Error(`FX plugin ${id} not found`);

        return {
            id: Math.random().toString(36).substr(2, 9), // Unique instance ID
            pluginId: id,
            metadata: { ...plugin.metadata },
            config: JSON.parse(JSON.stringify(plugin.defaultConfig || {})),
            state: {},
            enabled: true,
            _plugin: plugin // Reference to original logic
        };
    }
}

// Export a singleton instance
export const fxRegistry = new FXRegistry();
