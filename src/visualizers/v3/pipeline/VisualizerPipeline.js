/**
 * VisualizerPipeline.js [Visualizer 3 Single Pipeline Entrypoint]
 * SINGLE SOURCE OF TRUTH FOR ALL VISUALIZER RENDERING IN MEDIA FACTORY V3.
 * 
 * Both Live Preview and Production Export MUST call this exact pure function.
 * Dual-rendering branches are strictly prohibited.
 */

import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';
import { createRenderContext } from '../contracts/RenderContext.js';

export class VisualizerPipeline {
  static renderPipelineFrame(canvas, timestamp, audioState, pluginId = 'spectrum-bars', config = {}) {
    if (!canvas) {
      throw new Error('[VisualizerPipeline] Target canvas is missing');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('[VisualizerPipeline] Unable to get 2D rendering context');
    }

    const plugin = visualizerRegistryV3.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`[VisualizerPipeline] Plugin '${pluginId}' is not registered in VisualizerRegistry V3`);
    }

    // Initialize plugin once if not already initialized
    if (!plugin.isInitialized && plugin.init) {
      plugin.init(ctx);
    }

    const viewport = {
      width: canvas.width,
      height: canvas.height,
      pixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    };

    const timeline = {
      timestamp,
      frameIndex: Math.floor(timestamp * 60),
      duration: 0,
      fps: 60
    };

    // Construct immutable RenderContext
    const renderContext = createRenderContext({
      canvas,
      ctx,
      viewport,
      timeline,
      audioState,
      config
    });

    // Execute pure plugin render method
    plugin.render(renderContext);

    return renderContext;
  }
}
