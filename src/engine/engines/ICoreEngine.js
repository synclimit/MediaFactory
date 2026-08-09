/**
 * ICoreEngine.js
 * Universal Interface Contract for Media Factory Core Engines.
 * 
 * CORE RULES:
 * - Engine HARUS reusable.
 * - Engine HARUS menerima RenderContext.
 * - Engine HARUS menerima AudioState.
 * - Engine HARUS menerima PresetConfig.
 * - Engine HARUS tidak mengetahui Preview ataupun Export.
 */

export class ICoreEngine {
  constructor(id = 'ICoreEngine', name = 'Base Core Engine') {
    this.id = id;
    this.name = name;
  }

  /**
   * Initializes engine state or buffers.
   * @param {Object} renderContext RenderContext
   */
  initialize(renderContext) {}

  /**
   * Updates engine internal physics or time state.
   * @param {Object} renderContext RenderContext
   * @param {Object} audioState AudioState
   */
  update(renderContext, audioState) {}

  /**
   * Renders a frame headlessly to the target canvas context.
   * @param {Object} renderContext RenderContext (canvas, ctx, viewport, timeline)
   * @param {Object} audioState AudioState (frequencies, waveform, bass, energy)
   * @param {Object} presetConfig Preset Configuration JSON
   * @returns {Object} Render stats & diagnostics
   */
  render(renderContext, audioState, presetConfig = {}) {
    throw new Error(`[${this.id}] Method render() must be implemented by subclass.`);
  }

  /**
   * Cleans up engine resources.
   * @param {Object} renderContext RenderContext
   */
  dispose(renderContext) {}
}
