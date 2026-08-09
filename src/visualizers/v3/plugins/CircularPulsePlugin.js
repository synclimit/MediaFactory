/**
 * CircularPulsePlugin.js [Visualizer 3 Plugin]
 * Circular pulse & particle visualizer plugin.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class CircularPulsePlugin extends IVisualizerPlugin {
  constructor() {
    super('circular-pulse', 'Circular Pulse', 'Circular audio spectrum ring with pulsing core');
    this.defaultConfig = {
      baseRadius: 120,
      barCount: 64,
      colorCore: '#EC4899',
      colorRing: '#3B82F6',
      colorParticle: '#60A5FA'
    };
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    const bass = audioState?.bass || 0.2;
    const pulseRadius = (cfg.baseRadius || 120) * (1.0 + bass * 0.4);

    // 1. Draw Pulsing Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = cfg.colorCore || '#EC4899';
    ctx.globalAlpha = 0.25 + bass * 0.35;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // 2. Draw Circular Spectrum Rays
    const barCount = cfg.barCount || 64;
    const freqs = audioState.frequencies || new Float32Array(barCount);
    const rotationOffset = timeline.timestamp * 0.5; // Deterministic rotation

    ctx.strokeStyle = cfg.colorRing || '#3B82F6';
    ctx.lineWidth = 3;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 + rotationOffset;
      const val = freqs[i % freqs.length] || 0;
      const rayLen = val * 120;

      const x1 = centerX + Math.cos(angle) * pulseRadius;
      const y1 = centerY + Math.sin(angle) * pulseRadius;
      const x2 = centerX + Math.cos(angle) * (pulseRadius + rayLen);
      const y2 = centerY + Math.sin(angle) * (pulseRadius + rayLen);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. Draw Deterministic Pulsing Particles
    const particleCount = 24;
    ctx.fillStyle = cfg.colorParticle || '#60A5FA';
    for (let p = 0; p < particleCount; p++) {
      const seed = p * 1.618;
      const pAngle = seed * Math.PI * 2 + timeline.timestamp * 0.8;
      const pDist = pulseRadius + 30 + ((timeline.timestamp * 40 + p * 15) % 150);
      const px = centerX + Math.cos(pAngle) * pDist;
      const py = centerY + Math.sin(pAngle) * pDist;
      const pSize = 2 + (p % 4);

      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

visualizerRegistryV3.register(new CircularPulsePlugin());
