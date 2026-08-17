/**
 * AuroraWavesPlugin.js [Visualizer 3 Plugin]
 * Aurora Borealis — layered flowing gradient ribbons that ripple
 * and shift color with audio frequency bands.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class AuroraWavesPlugin extends IVisualizerPlugin {
  constructor() {
    super('aurora-waves', 'Aurora Waves', 'Layered aurora borealis ribbons that flow and shift with audio energy');
    this.defaultConfig = {
      colorA: '#00FFA3',
      colorB: '#7B61FF',
      colorC: '#00D4FF',
      colorD: '#FF61DC',
      layerCount: 5,
      amplitude: 120,
      speed: 0.6
    };
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;

    ctx.clearRect(0, 0, width, height);

    const isFastMode = typeof window !== 'undefined' && window.fastRenderState ? window.fastRenderState.isFastMode() : false;
    const isLivePlaying = Boolean(window.m3IsPlaying) || isFastMode;
    const t = isLivePlaying ? (timeline.timestamp * (cfg.speed || 0.6)) : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const mid = isLivePlaying ? (audioState?.mid || 0) : 0;
    const treble = isLivePlaying ? (audioState?.treble || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;

    const colors = [
      cfg.colorA || '#00FFA3',
      cfg.colorB || '#7B61FF',
      cfg.colorC || '#00D4FF',
      cfg.colorD || '#FF61DC',
      '#FFD700'
    ];

    const layerCount = Math.min(cfg.layerCount || 5, 7);
    const amplitude = cfg.amplitude || 120;

    for (let layer = 0; layer < layerCount; layer++) {
      const layerProgress = layer / layerCount;
      const baseY = height * (0.2 + layerProgress * 0.65);
      const colorA = colors[layer % colors.length];
      const colorB = colors[(layer + 1) % colors.length];
      const audioMod = layer % 3 === 0 ? bass : (layer % 3 === 1 ? mid : treble);
      const layerAmp = amplitude * (0.4 + audioMod * 0.8) * (1.0 - layerProgress * 0.3);
      const layerSpeed = 1.0 + layer * 0.3;
      const layerPhase = layer * 1.1;
      const points = 120;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * width;
        const progress = i / points;
        const freqIdx = Math.floor(progress * freqs.length);
        const freqVal = (freqs[freqIdx] || 0.3);

        const wave1 = Math.sin(progress * Math.PI * 3 + t * layerSpeed + layerPhase) * layerAmp * freqVal;
        const wave2 = Math.sin(progress * Math.PI * 6 + t * (layerSpeed * 1.7) + layerPhase * 2) * layerAmp * 0.4 * freqVal;
        const wave3 = Math.cos(progress * Math.PI * 1.5 + t * (layerSpeed * 0.8)) * layerAmp * 0.3;

        const y = baseY + wave1 + wave2 + wave3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Close the ribbon shape downwards
      ctx.lineTo(width, height + 50);
      ctx.lineTo(0, height + 50);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseY - layerAmp, 0, baseY + layerAmp * 2);
      grad.addColorStop(0, colorA + 'DD');
      grad.addColorStop(0.4, colorB + 'AA');
      grad.addColorStop(0.7, colorA + '55');
      grad.addColorStop(1, 'transparent');

      ctx.shadowColor = colorA;
      ctx.shadowBlur = 25 + energy * 20;
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.25 + (energy * 0.2) * (1.0 - layerProgress * 0.4);
      ctx.fill();
    }

    // Top shimmer layer — thin bright line on each aurora band
    for (let layer = 0; layer < layerCount; layer++) {
      const layerProgress = layer / layerCount;
      const baseY = height * (0.2 + layerProgress * 0.65);
      const colorA = colors[layer % colors.length];
      const audioMod = layer % 3 === 0 ? bass : (layer % 3 === 1 ? mid : treble);
      const layerAmp = (cfg.amplitude || 120) * (0.4 + audioMod * 0.8);
      const layerSpeed = 1.0 + layer * 0.3;
      const layerPhase = layer * 1.1;
      const points = 120;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * width;
        const progress = i / points;
        const freqIdx = Math.floor(progress * freqs.length);
        const freqVal = (freqs[freqIdx] || 0.3);
        const wave1 = Math.sin(progress * Math.PI * 3 + t * layerSpeed + layerPhase) * layerAmp * freqVal;
        const y = baseY + wave1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.shadowColor = colorA;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = colorA;
      ctx.lineWidth = 1.5 + audioMod * 2;
      ctx.globalAlpha = 0.7 + energy * 0.3;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new AuroraWavesPlugin());
