/**
 * IVisualizerPlugin.js
 * Standard Plugin Contract interface for all Visualizer Modules in Reference Engine v1.0.
 */

export class IVisualizerPlugin {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async init(ctx) {
    // Abstract init
  }

  render(renderContext) {
    throw new Error(`Plugin [${this.id}] must implement render(renderContext)`);
  }

  resize(width, height, pixelRatio) {
    // Abstract resize
  }

  updateConfig(newConfig) {
    // Abstract updateConfig
  }

  destroy() {
    // Abstract destroy
  }

  getConfigSchema() {
    return {};
  }
}
