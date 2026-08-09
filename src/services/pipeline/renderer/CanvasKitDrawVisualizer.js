/**
 * CanvasKitDrawVisualizer.js
 * Compatibility Wrapper for Media Factory CanvasKit Export.
 * 
 * SPRINT 26 GOVERNANCE:
 * - NO legacy visualizer rendering math exists in this file.
 * - Delegates 100% of visualizer rendering to ReferenceRenderPipeline -> Core Engine -> CanvasKit2DAdapter.
 */

import { CanvasKit2DAdapter } from '../../../engine/adapters/CanvasKit2DAdapter.js';
import { referenceRenderPipeline } from '../../../engine/pipeline/ReferenceRenderPipeline.js';
import { createRenderContext } from '../../../engine/contracts/RenderContext.js';
import { AudioStateAdapter } from '../../../engine/adapters/AudioStateAdapter.js';

const PLUGIN_MAPPING = {
  'bars-classic-vertical': 'SPECTRUM_BARS',
  'bars-staggered-center': 'SPECTRUM_BARS',
  'bars-mirror': 'SPECTRUM_BARS',
  'bars-split-dual': 'SPECTRUM_BARS',
  'bars-rounded-pill': 'SPECTRUM_BARS',
  'Vertical': 'SPECTRUM_BARS',
  'Staggered': 'SPECTRUM_BARS',
  'Mirror': 'SPECTRUM_BARS',
  'Split': 'SPECTRUM_BARS',
  'Rounded': 'SPECTRUM_BARS',
  'bars': 'SPECTRUM_BARS',
  'bar': 'SPECTRUM_BARS'
};

export function resolvePluginShape(pluginId, rawShape) {
  if (pluginId && PLUGIN_MAPPING[pluginId]) {
    return PLUGIN_MAPPING[pluginId];
  }
  return 'SPECTRUM_BARS';
}

/**
 * Compatibility wrapper delegating 100% to ReferenceRenderPipeline & Core Engines.
 */
export function drawCanvasKitVisualizer(CanvasKit, canvas, dataArray, config = {}, width = 1920, height = 1080, clearCanvas = true) {
  if (!CanvasKit || !canvas || width === 0 || height === 0) return;

  if (clearCanvas) {
    const bgPaint = new CanvasKit.Paint();
    bgPaint.setColor(CanvasKit.Color(0, 0, 0, 0));
    bgPaint.setBlendMode(CanvasKit.BlendMode.Src);
    canvas.drawRect([0, 0, width, height], bgPaint);
    bgPaint.delete();
  }

  const adapter = new CanvasKit2DAdapter(CanvasKit, canvas);
  const audioState = AudioStateAdapter.createFromFrame({ audio: { frequencies: dataArray } });
  const renderContext = createRenderContext({
    canvas,
    ctx: adapter,
    viewport: { width, height, pixelRatio: 1 },
    timeline: { timestamp: 0, fps: 60 },
    audioState,
    config
  });

  try {
    const pluginId = config?.visualizerId || config?.pluginId || 'bars-classic-vertical';
    referenceRenderPipeline
      .receiveContext(renderContext)
      .receiveAudioState(audioState)
      .resolvePlugin(pluginId)
      .preparePlugin();

    if (referenceRenderPipeline.currentPlugin) {
      referenceRenderPipeline.currentPlugin.render(renderContext);
    }
  } catch (err) {
    console.warn('[CanvasKitDrawVisualizer Wrapper] Render warning:', err);
  } finally {
    adapter.dispose();
  }
}
