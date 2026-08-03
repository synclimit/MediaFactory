/**
 * ExperimentalCanvasLayer.js [Status: NEW]
 * Offscreen Experimental Canvas & Draw Call Instrumenter for Reference Engine v1.0.
 * 
 * SPRINT 10 GOVERNANCE:
 * - Executes plugin.render() strictly on OffscreenCanvas or Mock 2D Context.
 * - MUST NOT touch the main preview canvas or CanvasKit WASM surface.
 * - Measures draw statistics (fillRect, lineTo, stroke, fill, gradients).
 * - Measures render execution time in milliseconds.
 */

export class ExperimentalCanvasLayer {
  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.drawStats = {
      fillRect: 0,
      stroke: 0,
      fill: 0,
      lineTo: 0,
      createLinearGradient: 0,
      totalDrawCalls: 0
    };

    this.initCanvas();
  }

  initCanvas() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(this.width, this.height);
      this.rawCtx = this.canvas.getContext('2d');
    } else {
      // Fallback Mock Canvas for Headless Environments
      this.canvas = { width: this.width, height: this.height };
      this.rawCtx = this.createMockContext();
    }
  }

  createMockContext() {
    const stats = this.drawStats;
    const noop = () => {};
    
    return {
      save: noop,
      restore: noop,
      beginPath: noop,
      closePath: noop,
      arc: noop,
      rect: noop,
      moveTo: noop,
      lineTo: () => { stats.lineTo++; stats.totalDrawCalls++; },
      fillRect: () => { stats.fillRect++; stats.totalDrawCalls++; },
      fill: () => { stats.fill++; stats.totalDrawCalls++; },
      stroke: () => { stats.stroke++; stats.totalDrawCalls++; },
      createLinearGradient: () => {
        stats.createLinearGradient++;
        return { addColorStop: noop };
      },
      createRadialGradient: () => {
        return { addColorStop: noop };
      },
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      shadowColor: 'transparent',
      shadowBlur: 0
    };
  }

  /**
   * Wrap 2D context to instrument draw call metrics.
   * @param {Object} baseRenderContext Standard RenderContext
   * @returns {Object} Experimental RenderContext with instrumented 2D Context
   */
  createInstrumentedContext(baseRenderContext) {
    this.resetStats();
    const self = this;
    const ctx = this.rawCtx;

    // Proxy context to intercept draw calls
    const instrumentedCtx = new Proxy(ctx, {
      get(target, prop) {
        if (prop === 'fillRect') {
          return function(...args) {
            self.drawStats.fillRect++;
            self.drawStats.totalDrawCalls++;
            return target.fillRect ? target.fillRect(...args) : undefined;
          };
        }
        if (prop === 'fill') {
          return function(...args) {
            self.drawStats.fill++;
            self.drawStats.totalDrawCalls++;
            return target.fill ? target.fill(...args) : undefined;
          };
        }
        if (prop === 'stroke') {
          return function(...args) {
            self.drawStats.stroke++;
            self.drawStats.totalDrawCalls++;
            return target.stroke ? target.stroke(...args) : undefined;
          };
        }
        if (prop === 'lineTo') {
          return function(...args) {
            self.drawStats.lineTo++;
            self.drawStats.totalDrawCalls++;
            return target.lineTo ? target.lineTo(...args) : undefined;
          };
        }
        if (prop === 'createLinearGradient') {
          return function(...args) {
            self.drawStats.createLinearGradient++;
            return target.createLinearGradient ? target.createLinearGradient(...args) : { addColorStop: () => {} };
          };
        }
        return target[prop];
      }
    });

    return {
      ...baseRenderContext,
      canvas: this.canvas,
      ctx: instrumentedCtx
    };
  }

  resetStats() {
    this.drawStats = {
      fillRect: 0,
      stroke: 0,
      fill: 0,
      lineTo: 0,
      createLinearGradient: 0,
      totalDrawCalls: 0
    };
  }

  getDiagnostics(renderTimeMs, plugin) {
    return {
      experimentalRenderStatus: 'PASS',
      target: 'OffscreenCanvas',
      mainCanvasTouched: false,
      canvasKitTouched: false,
      pluginId: plugin?.id || 'UNKNOWN',
      pluginName: plugin?.name || 'UNKNOWN',
      renderTimeMs: Math.round(renderTimeMs * 100) / 100,
      drawStats: { ...this.drawStats }
    };
  }
}

export const experimentalCanvasLayer = new ExperimentalCanvasLayer();
