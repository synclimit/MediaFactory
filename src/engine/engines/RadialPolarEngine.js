/**
 * RadialPolarEngine.js
 * Consolidated Core Engine 3 — Radial Polar Visualizer Renderer.
 * 
 * Handles 18 Presets:
 * - circle-basic-circular, circle-inward-pointing, circle-symmetrical-dual, circle-dot-matrix
 * - circle-glitch-segment, circle-trailing-radial, circle-neon-ring, circle-reactive-iris
 * - circle-pulsing-sunburst, ring-basic-concentric, ring-orbiting-halos, ring-dashed-audio
 * - ring-glowing-core, ring-multilayer-radar, ring-twisted-mobius, ring-expanding-echo
 * - ring-glitched-wireframe, ring-segmented-energy
 */

import { ICoreEngine } from './ICoreEngine.js';

export class RadialPolarEngine extends ICoreEngine {
  constructor() {
    super('RadialPolarEngine', 'Radial Polar Core Engine');
    this.rotationAngle = 0;
  }

  initialize(renderContext) {
    this.rotationAngle = 0;
  }

  update(renderContext, audioState) {
    // Dynamic rotation step based on audio energy
    const energy = audioState?.energy || 0.1;
    this.rotationAngle += 0.005 + energy * 0.02;
  }

  /**
   * Universal render method for Radial Polar presets.
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
    const cx = width / 2;
    const cy = height / 2;

    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = audioState?.bass || 0;
    const count = presetConfig.barCount || presetConfig.rayCount || 64;

    const isDots = presetConfig.drawStyle === 'dots';
    const isInward = presetConfig.direction === 'inward';
    const isIris = presetConfig.baseRadiusMode === 'bass-reactive';
    const isConcentric = (presetConfig.concentricRings || 1) > 1;

    let baseRadius = presetConfig.radius || 150;
    if (isIris) {
      baseRadius += bass * 60;
    }

    const strokeColor = presetConfig.color || presetConfig.colorLeft || '#00ffcc';
    const ringCount = isConcentric ? presetConfig.concentricRings : 1;
    let elementsDrawn = 0;

    if (ctx && typeof ctx.save === 'function') {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = presetConfig.lineWidth || 3;
    }

    for (let r = 0; r < ringCount; r++) {
      const ringRadius = baseRadius + r * 40;
      const angleStep = (Math.PI * 2) / count;

      for (let i = 0; i < count; i++) {
        const val = (freqs[i % freqs.length] || 0) * (presetConfig.gain || 1.0);
        const barHeight = val * 120;
        const angle = i * angleStep + this.rotationAngle * (r % 2 === 0 ? 1 : -1);

        const r1 = ringRadius;
        const r2 = isInward ? (ringRadius - barHeight) : (ringRadius + barHeight);

        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle) * r2;
        const y2 = cy + Math.sin(angle) * r2;

        if (ctx) {
          if (isDots && typeof ctx.arc === 'function') {
            ctx.beginPath();
            ctx.arc(x2, y2, presetConfig.dotRadius || 4, 0, Math.PI * 2);
            if (typeof ctx.fill === 'function') ctx.fill();
          } else if (typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function') {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            if (typeof ctx.stroke === 'function') ctx.stroke();
          }
        }
        elementsDrawn++;
      }
    }

    if (ctx && typeof ctx.restore === 'function') {
      ctx.restore();
    }

    return {
      engineId: this.id,
      presetId: presetConfig.id || 'default-radial',
      elementsDrawn,
      rotationAngle: Math.round(this.rotationAngle * 100) / 100,
      status: 'RENDERED'
    };
  }

  dispose(renderContext) {
    this.rotationAngle = 0;
  }
}
