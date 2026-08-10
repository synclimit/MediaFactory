/**
 * IVisualizerPlugin.js
 * Contract Interface for Visualizer 2 Plugins.
 */

export class IVisualizerPlugin {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  init(ctx) {}
  render(renderContext) {}
  resize(width, height, pixelRatio = 1) {}
  updateConfig(newConfig) {}
  destroy() {}

  getConfigSchema() {
    return {};
  }
}

if (typeof window !== 'undefined') {
  window.IVisualizerPlugin = IVisualizerPlugin;
}
if (typeof globalThis !== 'undefined') {
  globalThis.IVisualizerPlugin = IVisualizerPlugin;
}
