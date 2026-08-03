/**
 * VisualizerRegistry.js
 * Central Plugin Manager & Registry Singleton for Production Reference Engine v1.0.
 */

class VisualizerRegistrySingleton {
  constructor() {
    this.plugins = new Map();
  }

  register(pluginInstance) {
    if (!pluginInstance || !pluginInstance.id) {
      throw new Error('Invalid plugin instance registered');
    }
    this.plugins.set(pluginInstance.id, pluginInstance);
  }

  unregister(pluginId) {
    return this.plugins.delete(pluginId);
  }

  getPlugin(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  clear() {
    this.plugins.clear();
  }
}

export const VisualizerRegistry = new VisualizerRegistrySingleton();
