/**
 * StarburstPulsePlugin.js [Visualizer 3 Plugin]
 * Starburst Pulse — radiating beams of light shoot out from center
 * on every beat/bass hit, with trailing glow that fades gracefully.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class StarburstPulsePlugin extends IVisualizerPlugin {
  constructor() {
    super('starburst-pulse', 'Starburst Pulse', 'Radiating light beams that burst from center on every beat hit');
    this.defaultConfig = {
      colorBeam: '#FFD700',
      colorCore: '#FF4500',
      colorGlow: '#FF8C00',
      colorSecondary: '#00F5FF',
      beamCount: 16,
      maxBeamLength: 400,
      coreRadius: 45,
      rotationSpeed: 0.15,
      glowIntensity: 1.2
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
    const t = isLivePlaying ? timeline.timestamp : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;
    const treble = isLivePlaying ? (audioState?.treble || 0) : 0;
    const mid = isLivePlaying ? (audioState?.mid || 0) : 0;

    const beamCount = cfg.beamCount || 16;
    const maxBeamLen = cfg.maxBeamLength || 400;
    const rotation = t * (cfg.rotationSpeed || 0.15);

    // Draw background radial glow
    const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxBeamLen * 1.5);
    bgGlow.addColorStop(0, (cfg.colorCore || '#FF4500') + '30');
    bgGlow.addColorStop(0.3, (cfg.colorGlow || '#FF8C00') + '15');
    bgGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGlow;
    ctx.globalAlpha = 0.5 + bass * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, maxBeamLen * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw beams
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2 + rotation;
      const isAlternate = i % 2 === 0;
      const freqIdx = Math.floor((i / beamCount) * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const audioGroup = i < beamCount / 3 ? bass : (i < (2 * beamCount) / 3 ? mid : treble);

      const beamLength = maxBeamLen * (0.2 + freqVal * 0.5 + audioGroup * 0.3 + energy * 0.2);
      const beamWidth = (isAlternate ? 3 : 2) + freqVal * 6 + bass * 3;

      // Beam color (alternating primary/secondary)
      const beamColor = isAlternate ? (cfg.colorBeam || '#FFD700') : (cfg.colorSecondary || '#00F5FF');

      // Glow pass (wide, low alpha)
      const x2 = cx + Math.cos(angle) * beamLength;
      const y2 = cy + Math.sin(angle) * beamLength;

      const beamGrad = ctx.createLinearGradient(cx, cy, x2, y2);
      beamGrad.addColorStop(0, beamColor + 'FF');
      beamGrad.addColorStop(0.4, beamColor + 'CC');
      beamGrad.addColorStop(0.75, beamColor + '44');
      beamGrad.addColorStop(1, beamColor + '00');

      // Wide glow beam
      ctx.shadowColor = beamColor;
      ctx.shadowBlur = (20 + freqVal * 25) * (cfg.glowIntensity || 1.2);
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = beamWidth * 3;
      ctx.globalAlpha = 0.15 + freqVal * 0.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Tight bright beam
      ctx.shadowBlur = 10;
      ctx.lineWidth = beamWidth;
      ctx.globalAlpha = 0.6 + freqVal * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Sparkle tip dot
      const sparkSize = 2 + freqVal * 5 + audioGroup * 5;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.7 + freqVal * 0.3;
      ctx.beginPath();
      ctx.arc(x2, y2, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core glow center
    const coreR = (cfg.coreRadius || 45) * (1.0 + bass * 0.6 + energy * 0.3);
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0, '#FFFFFF');
    coreGrad.addColorStop(0.25, cfg.colorCore || '#FF4500');
    coreGrad.addColorStop(0.6, (cfg.colorGlow || '#FF8C00') + 'AA');
    coreGrad.addColorStop(1, 'transparent');

    ctx.shadowColor = cfg.colorCore || '#FF4500';
    ctx.shadowBlur = 50 + bass * 40;
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.9 + bass * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Inner white hot spot
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.8 + bass * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new StarburstPulsePlugin());
