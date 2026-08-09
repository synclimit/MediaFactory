/**
 * VisualizerPipeline.js (v2)
 * Unified Single Source of Truth Entrypoint for Visualizer 2 Engine.
 * Pure Delegator -> Fetches Plugin from Registry and renders via RenderContext.
 */

import { VisualizerRegistry } from '../../engine/v2/registry/VisualizerRegistry.js';
import { createRenderContext } from '../../engine/v2/contracts/RenderContext.js';
import { CircularPulsePlugin } from '../../engine/v2/plugins/CircularPulsePlugin.js';
import { CyberpunkWaveformPlugin } from '../../engine/v2/plugins/CyberpunkWaveformPlugin.js';
import { SpectrumBarsPlugin } from '../../engine/v2/plugins/SpectrumBarsPlugin.js';
import { ParticleOrbitPlugin } from '../../engine/v2/plugins/ParticleOrbitPlugin.js';

// Auto-register built-in plugins
VisualizerRegistry.register(new CircularPulsePlugin());
VisualizerRegistry.register(new CyberpunkWaveformPlugin());
VisualizerRegistry.register(new SpectrumBarsPlugin());
VisualizerRegistry.register(new ParticleOrbitPlugin());

export const VISUALIZER2_MODES = {
  CIRCULAR_PULSE: 'CIRCULAR_PULSE',
  CYBERPUNK_WAVEFORM: 'CYBERPUNK_WAVEFORM',
  SPECTRUM_BARS: 'SPECTRUM_BARS',
  PARTICLE_ORBIT: 'PARTICLE_ORBIT'
};
export const VISUALIZER_MODES = VISUALIZER2_MODES;

/**
 * renderPipelineFrame
 * Single Pipeline Entrypoint for both Live Editor & Export Engine.
 */
export function renderPipelineFrame(canvas, timestamp, audioState, mode = VISUALIZER2_MODES.CIRCULAR_PULSE, config = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas before drawing frame
  ctx.clearRect(0, 0, width, height);

  ctx.save();

  // Apply rotation transformation if object is rotated in inspector/editor
  const rotDeg = parseFloat(config.rotation || config.rotationAngle || config.angle || 0);
  if (!isNaN(rotDeg) && rotDeg !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);
  }

  // 1. Fetch plugin from Registry
  const plugin = VisualizerRegistry.getPlugin(mode);

  // 2. Build Immutable RenderContext
  const renderContext = createRenderContext({
    canvas,
    ctx,
    viewport: { width, height, pixelRatio: 1 },
    timeline: { timestamp, fps: 60, duration: 30 },
    audioState: audioState || {},
    config
  });

  // 3. Delegate rendering to Plugin
  if (plugin && typeof plugin.render === 'function') {
    plugin.render(renderContext);
  }

  ctx.restore();
}
