/**
 * VisualizerPipeline.js (v2)
 * Unified Single Source of Truth Entrypoint for Visualizer 2 Engine.
 * Pure Delegator -> Fetches Plugin from Registry and renders via RenderContext.
 */

import { VisualizerV5Core } from '../../visualizers/v5/VisualizerV5Core.js';

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

  // Single Source of Truth: delegate to VisualizerV5Core
  const modeStr = String(mode || config.mode || config.visualizerId || '').toLowerCase();
  let pluginIdMode = 'spectrum-bars';
  if (modeStr.includes('wave') || modeStr.includes('cyberpunk')) pluginIdMode = 'cyberpunk-waveform';
  else if (modeStr.includes('particle') || modeStr.includes('orbit')) pluginIdMode = 'particle-orbit';
  else if (modeStr.includes('circular') || modeStr.includes('circle') || modeStr.includes('pulse')) pluginIdMode = 'circular-pulse';

  VisualizerV5Core.renderFrame(ctx, width, height, audioState || {}, { ...config, mode: pluginIdMode });

  ctx.restore();
}

