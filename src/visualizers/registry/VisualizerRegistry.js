/**
 * VisualizerRegistry.js
 * Central registry for all visualizer plugins.
 */

class VisualizerRegistry {
    constructor() {
        this.plugins = new Map();
        this.byCategory = new Map();
    }

    /**
     * Register a new visualizer plugin.
     * @param {Object} plugin - The plugin module export (metadata, manifest, initialize, update, render, dispose)
     */
    register(plugin) {
        if (!plugin || !plugin.metadata || !plugin.metadata.id) {
            throw new Error('Invalid visualizer plugin format. Must have metadata.id');
        }

        const id = plugin.metadata.id;
        
        if (this.plugins.has(id)) {
            console.warn(`Visualizer with id ${id} is already registered. Overwriting.`);
        }

        this.plugins.set(id, plugin);

        // Group by category for fast UI lookup
        const category = plugin.metadata.category || 'Uncategorized';
        if (!this.byCategory.has(category)) {
            this.byCategory.set(category, []);
        }
        
        // Prevent duplicates on hot-reload
        const categoryList = this.byCategory.get(category);
        const existingIdx = categoryList.findIndex(p => p.metadata.id === id);
        if (existingIdx >= 0) {
            categoryList[existingIdx] = plugin;
        } else {
            categoryList.push(plugin);
        }
    }

    get(id) {
        return this.plugins.get(id);
    }

    getAll() {
        return Array.from(this.plugins.values());
    }

    getByCategory(category) {
        return this.byCategory.get(category) || [];
    }

    has(id) {
        return this.plugins.has(id);
    }

    remove(id) {
        const plugin = this.plugins.get(id);
        if (plugin) {
            const category = plugin.metadata.category;
            if (this.byCategory.has(category)) {
                const list = this.byCategory.get(category);
                this.byCategory.set(category, list.filter(p => p.metadata.id !== id));
            }
            return this.plugins.delete(id);
        }
        return false;
    }
}

// Export as singleton
export const visualizerRegistry = new VisualizerRegistry();
