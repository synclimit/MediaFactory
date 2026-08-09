/**
 * WaveformPathEngine.js
 * Consolidated Core Engine 2 — Waveform Path Visualizer Renderer.
 * 
 * Handles 12 Presets:
 * - waves-oscilloscope, waves-filled-sine, waves-symmetrical-dual, waves-bezier-spline
 * - waves-broken-glitch, waves-neon-glow, waves-overlapping-multi, waves-jagged-mountain
 * - waves-polled-step, waves-trailing-ghost, minimal-single-dot, minimal-thin-line
 */

import { ICoreEngine } from './ICoreEngine.js';

export class WaveformPathEngine extends ICoreEngine {
  constructor() {
    super('WaveformPathEngine', 'Waveform Path Core Engine');
    this.historyWave = [];
  }

  initialize(renderContext) {
    this.historyWave = [];
  }

  update(renderContext, audioState) {
    // History trail buffer
    if (audioState?.waveform) {
      this.historyWave.unshift(new Float32Array(audioState.waveform));
      if (this.historyWave.length > 5) {
        this.historyWave.pop();
      }
    }
  }

  /**
   * Universal render method for Waveform Path presets.
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

    const rawWave = audioState?.waveform || new Float32Array(64);
    const count = Math.min(rawWave.length, 128);

    const isFill = Boolean(presetConfig.fill);
    const isDual = Boolean(presetConfig.mirrorY);
    const isBezier = presetConfig.interpolation === 'bezier';
    const isStep = presetConfig.interpolation === 'step';
    const isGlitch = Boolean(presetConfig.glitchSlice);
    const isMultiLayer = (presetConfig.layerCount || 1) > 1;
    const isSingleDot = presetConfig.sampleCount === 1;

    const strokeColor = presetConfig.color || presetConfig.colorLeft || '#00ffcc';
    const fillColor = presetConfig.fillColor || 'rgba(0, 255, 204, 0.2)';
    const lineWidth = presetConfig.lineWidth || 3;
    const centerY = height / 2;

    let pointsDrawn = 0;

    if (ctx && typeof ctx.save === 'function') {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = lineWidth;
    }

    if (isSingleDot) {
      // Single Dot Preset (Minimal)
      const sampleVal = rawWave[Math.floor(count / 2)] || 0;
      const dotY = centerY + sampleVal * (height * 0.3);
      if (ctx && typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.arc(width / 2, dotY, presetConfig.dotRadius || 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      pointsDrawn = 1;
    } else {
      // Continuous Wave Path
      const layerCount = isMultiLayer ? presetConfig.layerCount : 1;

      for (let l = 0; l < layerCount; l++) {
        const stepX = width / (count - 1);

        if (ctx && typeof ctx.beginPath === 'function') {
          ctx.beginPath();
          const startY = centerY + (rawWave[0] || 0) * (height * 0.3);
          ctx.moveTo(0, startY);

          for (let i = 1; i < count; i++) {
            const val = rawWave[i] || 0;
            const x = i * stepX;
            let y = centerY + val * (height * 0.3) + l * 10;

            if (isGlitch && i % 8 === 0) {
              y += (Math.random() - 0.5) * 30;
            }

            if (isStep) {
              const prevX = (i - 1) * stepX;
              ctx.lineTo(x, centerY + (rawWave[i - 1] || 0) * (height * 0.3));
              ctx.lineTo(x, y);
            } else if (isBezier && i < count - 1) {
              const prevX = (i - 1) * stepX;
              const prevY = centerY + (rawWave[i - 1] || 0) * (height * 0.3);
              const cpX = (prevX + x) / 2;
              ctx.quadraticCurveTo(cpX, prevY, x, y);
            } else {
              ctx.lineTo(x, y);
            }
            pointsDrawn++;
          }

          if (isFill) {
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            if (typeof ctx.fill === 'function') ctx.fill();
          }

          if (typeof ctx.stroke === 'function') ctx.stroke();

          if (isDual) {
            // Inverted Dual Wave
            ctx.beginPath();
            ctx.moveTo(0, centerY - (rawWave[0] || 0) * (height * 0.3));
            for (let i = 1; i < count; i++) {
              const val = rawWave[i] || 0;
              const x = i * stepX;
              const y = centerY - val * (height * 0.3);
              ctx.lineTo(x, y);
            }
            if (typeof ctx.stroke === 'function') ctx.stroke();
          }
        }
      }
    }

    if (ctx && typeof ctx.restore === 'function') {
      ctx.restore();
    }

    return {
      engineId: this.id,
      presetId: presetConfig.id || 'default-wave',
      pointsDrawn,
      layersRendered: isMultiLayer ? presetConfig.layerCount : 1,
      status: 'RENDERED'
    };
  }

  dispose(renderContext) {
    this.historyWave = [];
  }
}
