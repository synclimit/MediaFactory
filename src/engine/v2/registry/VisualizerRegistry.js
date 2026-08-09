/**
 * VisualizerRegistry.js
 * Central Plugin Registry & Manager for Visualizer 2 Engine.
 */

class Registry {
  constructor() {
    this.plugins = new Map();
    this.activePluginId = null;
  }

  register(plugin) {
    if (!plugin || !plugin.id) {
      throw new Error('Plugin must have a valid ID');
    }
    this.plugins.set(plugin.id, plugin);
    if (!this.activePluginId) {
      this.activePluginId = plugin.id;
    }
  }

  unregister(id) {
    if (this.plugins.has(id)) {
      const plugin = this.plugins.get(id);
      if (plugin.destroy) plugin.destroy();
      this.plugins.delete(id);
    }
  }

  getPlugin(id) {
    if (!id) return this.plugins.values().next().value;

    let norm = String(id).toUpperCase().replace(/[- ]/g, '_');
    if (norm.includes('WAVE') || norm.includes('CYBERPUNK')) norm = 'CYBERPUNK_WAVEFORM';
    else if (norm.includes('BAR') || norm.includes('SPECTRUM')) norm = 'SPECTRUM_BARS';
    else if (norm.includes('PARTICLE') || norm.includes('ORBIT')) norm = 'PARTICLE_ORBIT';
    else if (norm.includes('CIRCULAR') || norm.includes('PULSE') || norm.includes('RING')) norm = 'CIRCULAR_PULSE';

    const plugin = this.plugins.get(norm) || this.plugins.get(id);
    if (!plugin) {
      const first = this.plugins.values().next().value;
      if (!first) {
        throw new Error(`VisualizerRegistry: No plugin registered with ID "${id}"`);
      }
      return first;
    }
    return plugin;
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  setActivePlugin(id) {
    if (this.plugins.has(id)) {
      this.activePluginId = id;
    }
  }

  getActivePlugin() {
    return this.getPlugin(this.activePluginId);
  }
}

export const VisualizerRegistry = new Registry();
