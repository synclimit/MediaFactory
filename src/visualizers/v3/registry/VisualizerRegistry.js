/**
 * VisualizerRegistry.js [Visualizer 3 Plugin Manager]
 * Central manager for plugin registration and lookup.
 */

export class VisualizerRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    if (!plugin || !plugin.id) {
      throw new Error('[VisualizerRegistry] Plugin must have a valid non-empty id');
    }
    if (this.plugins.has(plugin.id)) {
      console.warn(`[VisualizerRegistry] Plugin with ID '${plugin.id}' is already registered. Overwriting.`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(id) {
    return this.plugins.get(id) || null;
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  has(id) {
    return this.plugins.has(id);
  }

  unregister(id) {
    return this.plugins.delete(id);
  }

  clear() {
    this.plugins.clear();
  }
}

export const visualizerRegistryV3 = new VisualizerRegistry();
