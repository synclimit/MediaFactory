/**
 * RenderContextAdapter.js [Status: NEW / ACTIVE - PASS-THROUGH ONLY]
 * Adapter for creating and injecting RenderContext instances into Media Factory pipelines.
 * 
 * SPRINT 03 GOVERNANCE:
 * - Integrates AudioStateAdapter.createFromFrame() to attach normalized AudioState.
 * - RenderContext & AudioState are passed passively through RenderFrame (Standby mode).
 * - Legacy rendering pipeline & Beat Engine remain 100% ACTIVE as primary drivers.
 * - Feature Flag `useReferenceEngine` remains FALSE.
 */

import { createRenderContext } from '../contracts/RenderContext.js';
import { AudioStateAdapter } from './AudioStateAdapter.js';

export class RenderContextAdapter {
  /**
   * Creates an immutable RenderContext from Media Factory pipeline frame data.
   * @param {Object} frame Media Factory frame object
   * @param {Object} [options={}] Additional options (canvas, ctx, viewport)
   * @returns {Object} Immutable RenderContext
   */
  static createFromFrame(frame = {}, options = {}) {
    const meta = frame.metadata || {};
    const states = frame.engineStates || frame.states || {};

    // Generate normalized AudioState via AudioStateAdapter [PASS-THROUGH ONLY]
    const audioState = AudioStateAdapter.createFromFrame(states);

    return createRenderContext({
      canvas: options.canvas || null,
      ctx: options.ctx || null,
      viewport: {
        width: options.width || meta.width || 1920,
        height: options.height || meta.height || 1080,
        pixelRatio: options.pixelRatio || 1
      },
      timeline: {
        timestamp: meta.currentTime || 0,
        frameIndex: meta.frameNumber || Math.floor((meta.currentTime || 0) * (meta.fps || 60)),
        duration: meta.totalDurationSec || 30,
        fps: meta.fps || 60
      },
      audioState,
      config: options.config || {}
    });
  }
}
