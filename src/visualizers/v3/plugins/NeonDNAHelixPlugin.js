/**
 * NeonDNAHelixPlugin.js [Visualizer 3 Plugin]
 * Modern Neon DNA Helix — twin intertwined sine strands with
 * glowing neon nodes that pulse with audio energy.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class NeonDNAHelixPlugin extends IVisualizerPlugin {
  constructor() {
    super('neon-dna-helix', 'Neon DNA Helix', 'Twin intertwined neon strands that pulse with audio frequency energy');
    this.defaultConfig = {
      colorStrand1: '#00F5FF',
      colorStrand2: '#FF006E',
      colorNode: '#FFFFFF',
      colorGlow: '#7B2FFF',
      strandSegments: 80,
      amplitude: 160,
      glowIntensity: 0.8,
      speed: 1.0
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
    const t = isLivePlaying ? (timeline.timestamp * (cfg.speed || 1.0)) : 0;
    const freqs = audioState?.frequencies || new Float32Array(cfg.strandSegments);
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;

    const segments = cfg.strandSegments || 80;
    const amplitude = (cfg.amplitude || 160) * (1.0 + bass * 0.5);
    const totalWidth = width * 0.85;
    const startX = (width - totalWidth) / 2;
    const stepX = totalWidth / segments;

    // Draw connection bridges first (behind strands)
    for (let i = 0; i < segments; i += 4) {
      const x = startX + i * stepX;
      const progress = i / segments;
      const freqIdx = Math.floor(progress * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;

      const phase = (i / segments) * Math.PI * 6 + t * 2;
      const y1 = cy + Math.sin(phase) * amplitude * freqVal;
      const y2 = cy + Math.sin(phase + Math.PI) * amplitude * freqVal;

      const bridgeGrad = ctx.createLinearGradient(x, y1, x, y2);
      bridgeGrad.addColorStop(0, cfg.colorStrand1 + '60');
      bridgeGrad.addColorStop(0.5, cfg.colorGlow + '80');
      bridgeGrad.addColorStop(1, cfg.colorStrand2 + '60');

      ctx.strokeStyle = bridgeGrad;
      ctx.lineWidth = 2 + freqVal * 3;
      ctx.globalAlpha = 0.4 + freqVal * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Draw strand 1 (glow + main line)
    for (let pass = 0; pass < 2; pass++) {
      const isGlow = pass === 0;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = startX + i * stepX;
        const progress = i / segments;
        const freqIdx = Math.floor(progress * freqs.length);
        const freqVal = freqs[freqIdx] || 0.3;
        const phase = (i / segments) * Math.PI * 6 + t * 2;
        const y = cy + Math.sin(phase) * amplitude * freqVal;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowColor = cfg.colorStrand1;
      ctx.shadowBlur = isGlow ? 30 * (cfg.glowIntensity || 0.8) : 0;
      ctx.strokeStyle = isGlow ? cfg.colorStrand1 + '50' : cfg.colorStrand1;
      ctx.lineWidth = isGlow ? 8 : 2.5;
      ctx.globalAlpha = isGlow ? 0.6 : 1.0;
      ctx.stroke();
    }

    // Draw strand 2 (glow + main line)
    for (let pass = 0; pass < 2; pass++) {
      const isGlow = pass === 0;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = startX + i * stepX;
        const progress = i / segments;
        const freqIdx = Math.floor(progress * freqs.length);
        const freqVal = freqs[freqIdx] || 0.3;
        const phase = (i / segments) * Math.PI * 6 + t * 2;
        const y = cy + Math.sin(phase + Math.PI) * amplitude * freqVal;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowColor = cfg.colorStrand2;
      ctx.shadowBlur = isGlow ? 30 * (cfg.glowIntensity || 0.8) : 0;
      ctx.strokeStyle = isGlow ? cfg.colorStrand2 + '50' : cfg.colorStrand2;
      ctx.lineWidth = isGlow ? 8 : 2.5;
      ctx.globalAlpha = isGlow ? 0.6 : 1.0;
      ctx.stroke();
    }

    // Draw node dots at crossings
    for (let i = 0; i < segments; i += 4) {
      const x = startX + i * stepX;
      const progress = i / segments;
      const freqIdx = Math.floor(progress * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const phase = (i / segments) * Math.PI * 6 + t * 2;

      for (let s = 0; s < 2; s++) {
        const y = cy + Math.sin(phase + s * Math.PI) * amplitude * freqVal;
        const nodeSize = 4 + freqVal * 8 + energy * 5;
        ctx.shadowColor = s === 0 ? cfg.colorStrand1 : cfg.colorStrand2;
        ctx.shadowBlur = 20;
        ctx.fillStyle = cfg.colorNode;
        ctx.globalAlpha = 0.85 + freqVal * 0.15;
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new NeonDNAHelixPlugin());
