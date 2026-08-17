/**
 * LiquidMorphPlugin.js [Visualizer 3 Plugin]
 * Liquid Morph — a fluid organic blob that breathes, morphs, and
 * ripples at the edges driven by audio bass and mid frequencies.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class LiquidMorphPlugin extends IVisualizerPlugin {
  constructor() {
    super('liquid-morph', 'Liquid Morph', 'Organic fluid blob that breathes and ripples with audio bass and mid frequencies');
    this.defaultConfig = {
      colorCenter: '#FF006E',
      colorEdge: '#7B2FFF',
      colorGlow: '#00F5FF',
      baseRadius: 200,
      morphComplexity: 6,
      speed: 0.5,
      glowSize: 60
    };
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const isFastMode = typeof window !== 'undefined' && window.fastRenderState ? window.fastRenderState.isFastMode() : false;
    const isLivePlaying = Boolean(window.m3IsPlaying) || isFastMode;
    const t = isLivePlaying ? (timeline.timestamp * (cfg.speed || 0.5)) : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const mid = isLivePlaying ? (audioState?.mid || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;
    const treble = isLivePlaying ? (audioState?.treble || 0) : 0;

    const baseRadius = (cfg.baseRadius || 200) * (1.0 + bass * 0.4);
    const complexity = Math.round(cfg.morphComplexity || 6);
    const points = 180;

    // Build blob outline using overlapping sine waves
    const blobPoints = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const freqIdx = Math.floor((i / points) * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;

      let r = baseRadius;
      for (let k = 1; k <= complexity; k++) {
        const audioK = freqs[Math.floor((k / complexity) * freqs.length)] || 0.3;
        const waveAmp = baseRadius * (0.08 + audioK * 0.18) / k;
        const speed = (k % 2 === 0 ? 1 : -1) * (1.0 + k * 0.3);
        r += Math.sin(angle * k + t * speed + k * 1.7) * waveAmp;
      }
      r += freqVal * baseRadius * 0.15;
      r += Math.sin(angle * 2 + t * 1.5) * mid * 30;

      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      blobPoints.push([x, y]);
    }

    // Draw outer glow halo (fuzzy glow)
    const glowSize = (cfg.glowSize || 60) * (1.0 + energy * 0.5);
    const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius + glowSize);
    glowGrad.addColorStop(0, (cfg.colorEdge || '#7B2FFF') + 'AA');
    glowGrad.addColorStop(0.4, (cfg.colorGlow || '#00F5FF') + '55');
    glowGrad.addColorStop(1, 'transparent');

    ctx.shadowColor = cfg.colorGlow || '#00F5FF';
    ctx.shadowBlur = glowSize * 1.5;
    ctx.globalAlpha = 0.5 + energy * 0.4;

    // Draw the halo as a larger blob
    ctx.beginPath();
    const haloScale = 1.15 + energy * 0.1;
    for (let i = 0; i < blobPoints.length; i++) {
      const [bx, by] = blobPoints[i];
      const hx = cx + (bx - cx) * haloScale;
      const hy = cy + (by - cy) * haloScale;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Draw the main blob with gradient fill
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    for (let i = 0; i < blobPoints.length; i++) {
      const [bx, by] = blobPoints[i];
      if (i === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.closePath();

    const blobGrad = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, baseRadius * 1.1);
    blobGrad.addColorStop(0, cfg.colorCenter || '#FF006E');
    blobGrad.addColorStop(0.5, (cfg.colorEdge || '#7B2FFF'));
    blobGrad.addColorStop(1, (cfg.colorGlow || '#00F5FF') + 'BB');

    ctx.fillStyle = blobGrad;
    ctx.fill();

    // Draw bright edge highlight
    ctx.shadowColor = cfg.colorGlow || '#00F5FF';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = cfg.colorGlow || '#00F5FF';
    ctx.lineWidth = 2 + treble * 4;
    ctx.globalAlpha = 0.5 + treble * 0.5;
    ctx.stroke();

    // Floating inner ripple rings (3 ripple waves from center)
    for (let r = 1; r <= 3; r++) {
      const rippleRadius = baseRadius * (r / 3) * (0.7 + energy * 0.2);
      const rippleAlpha = 0.12 * (1.0 - r / 4) + energy * 0.06;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = cfg.colorCenter || '#FF006E';
      ctx.lineWidth = 1;
      ctx.globalAlpha = rippleAlpha;
      ctx.beginPath();
      ctx.arc(cx, cy, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new LiquidMorphPlugin());
