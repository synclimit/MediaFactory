/**
 * IVisualizerPlugin.js [Visualizer 3 Base Contract]
 * Base abstract class interface enforcing standard plugin lifecycle methods.
 */

export class IVisualizerPlugin {
  constructor(id, name, description = '') {
    if (new.target === IVisualizerPlugin) {
      throw new Error('[IVisualizerPlugin] Cannot instantiate abstract class directly.');
    }
    this.id = id;
    this.name = name;
    this.description = description;
    this.isInitialized = false;
  }

  /**
   * One-time resource allocation (compile shaders, create gradients/buffers).
   * @param {Object} ctx Canvas context
   */
  init(ctx) {
    this.isInitialized = true;
  }

  /**
   * Main render execution called every frame.
   * MUST be pure and deterministic. MUST read ONLY from renderContext.
   * @param {Object} renderContext Immutable RenderContext
   */
  render(renderContext) {
    throw new Error(`[IVisualizerPlugin] Method 'render()' must be implemented by plugin '${this.id}'.`);
  }

  /**
   * Called when viewport dimensions change.
   * @param {number} width 
   * @param {number} height 
   * @param {number} pixelRatio 
   */
  resize(width, height, pixelRatio = 1) {}

  /**
   * Called when user modifies configuration in editor UI.
   * @param {Object} newConfig 
   */
  updateConfig(newConfig) {}

  /**
   * Resource deallocation and memory cleanup.
   */
  destroy() {
    this.isInitialized = false;
  }

  /**
   * Returns JSON Schema for UI control auto-generation.
   * @returns {Object} JSON Schema
   */
  getConfigSchema() {
    return {
      type: 'object',
      properties: {}
    };
  }
}
