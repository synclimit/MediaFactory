/**
 * LinearBarEngine.js
 * Consolidated Core Engine 1 — Linear Bar Visualizer Renderer.
 * 
 * Handles 14 Presets:
 * - bars-classic-vertical, bars-staggered-center, bars-mirror, bars-split-dual
 * - bars-rounded-pill, bars-horizontal, bars-neon-outline, bars-gradient-fill
 * - bars-stacked-multiband, bars-peak-hold, bars-zigzag, bars-reflected-floor
 * - bars-histogram-cascade, bars-fragmented-glitch
 */

import { ICoreEngine } from './ICoreEngine.js';

export class LinearBarEngine extends ICoreEngine {
  constructor() {
    super('LinearBarEngine', 'Linear Bar Core Engine');
    this.peakY = new Float32Array(256);
  }

  initialize(renderContext) {
    this.peakY.fill(0);
  }

  update(renderContext, audioState) {
    // Passive update if needed
  }

  /**
   * Universal render method for Linear Bar presets.
   * @param {Object} renderContext RenderContext
   * @param {Object} audioState AudioState
   * @param {Object} presetConfig Preset Configuration JSON
   * @returns {Object} Diagnostic render metrics
   */
  render(renderContext, audioState, presetConfig = {}) {
    const ctx = renderContext?.ctx;
    const viewport = renderContext?.viewport || { width: 1920, height: 1080 };
    const width = viewport.width || 1920;
    const height = viewport.height || 1080;

    const freqs = audioState?.frequencies || new Float32Array(64);
    const count = presetConfig.barCount || Math.min(freqs.length, 64);
    const barWidth = presetConfig.barWidth || 4;
    const spacing = presetConfig.spacing || 2;
    const gain = presetConfig.gain !== undefined ? presetConfig.gain : 1.0;
    const isHorizontal = presetConfig.orientation === 'horizontal';
    const isCenter = Boolean(presetConfig.center);
    const isMirror = Boolean(presetConfig.mirror);
    const isRounded = Boolean(presetConfig.borderRadius);
    const isStroke = presetConfig.drawStyle === 'stroke';
    const hasPeakHold = Boolean(presetConfig.peakHold);
    const hasReflection = Boolean(presetConfig.floorReflection);
    const isGlitch = Boolean(presetConfig.randomDisplacement);

    const colorLeft = presetConfig.colorLeft || presetConfig.color || '#AB55F7';
    const colorRight = presetConfig.colorRight || '#F59E0B';

    let drawCalls = 0;
    const totalStep = barWidth + spacing;
    const totalLength = count * totalStep;

    let startPos = 0;
    if (isCenter) {
      startPos = isHorizontal ? (height - totalLength) / 2 : (width - totalLength) / 2;
    }

    if (ctx && typeof ctx.save === 'function') {
      ctx.save();
    }

    for (let i = 0; i < count; i++) {
      const val = (freqs[i] || 0) * gain;
      const barLen = Math.max(2, val * (isHorizontal ? width : height));

      if (hasPeakHold) {
        if (barLen > this.peakY[i]) {
          this.peakY[i] = barLen;
        } else {
          this.peakY[i] = Math.max(0, this.peakY[i] - 1.5);
        }
      }

      let pos = startPos + i * totalStep;
      let jitter = isGlitch ? (Math.random() - 0.5) * 8 : 0;

      if (ctx) {
        // Color styling
        if (typeof ctx.createLinearGradient === 'function') {
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, colorLeft);
          grad.addColorStop(1, colorRight);
          ctx.fillStyle = grad;
          ctx.strokeStyle = colorLeft;
        } else {
          ctx.fillStyle = colorLeft;
          ctx.strokeStyle = colorLeft;
        }

        if (!isHorizontal) {
          // Vertical Layout
          const x = pos + jitter;
          const y = isCenter ? (height - barLen) / 2 : (height - barLen);

          if (isStroke && typeof ctx.strokeRect === 'function') {
            ctx.strokeRect(x, y, barWidth, barLen);
          } else if (typeof ctx.fillRect === 'function') {
            ctx.fillRect(x, y, barWidth, barLen);
          }

          if (isMirror) {
            const mx = width - x - barWidth;
            if (typeof ctx.fillRect === 'function') {
              ctx.fillRect(mx, y, barWidth, barLen);
            }
          }

          if (hasReflection && typeof ctx.fillRect === 'function') {
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, height, barWidth, barLen * 0.4);
            ctx.globalAlpha = 1.0;
          }

          if (hasPeakHold && typeof ctx.fillRect === 'function') {
            const peakYPos = isCenter ? (height - this.peakY[i]) / 2 : (height - this.peakY[i]);
            ctx.fillRect(x, peakYPos - 4, barWidth, 2);
          }
        } else {
          // Horizontal Layout
          const y = pos + jitter;
          const x = isCenter ? (width - barLen) / 2 : 0;

          if (typeof ctx.fillRect === 'function') {
            ctx.fillRect(x, y, barLen, barWidth);
          }

          if (isMirror && typeof ctx.fillRect === 'function') {
            const my = height - y - barWidth;
            ctx.fillRect(x, my, barLen, barWidth);
          }
        }
      }
      drawCalls++;
    }

    if (ctx && typeof ctx.restore === 'function') {
      ctx.restore();
    }

    return {
      engineId: this.id,
      presetId: presetConfig.id || 'default-bars',
      barsRendered: count,
      drawCalls,
      status: 'RENDERED'
    };
  }

  dispose(renderContext) {
    this.peakY.fill(0);
  }
}
