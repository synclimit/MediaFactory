/**
 * QuantumRingsPlugin.js [Visualizer 3 Plugin]
 * Quantum Rings — concentric glowing rings that expand, contract,
 * and rotate in 3D-perspective space driven by audio frequencies.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class QuantumRingsPlugin extends IVisualizerPlugin {
  constructor() {
    super('quantum-rings', 'Quantum Rings', 'Concentric 3D-perspective rings rotating and pulsing with audio frequencies');
    this.defaultConfig = {
      ringCount: 7,
      colorInner: '#FF0080',
      colorOuter: '#00F0FF',
      colorAccent: '#FFD700',
      baseRadius: 40,
      ringSpacing: 55,
      rotationSpeed: 0.4,
      glowIntensity: 1.0
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

    const ringCount = cfg.ringCount || 7;
    const baseRadius = cfg.baseRadius || 40;
    const ringSpacing = cfg.ringSpacing || 55;

    // Lerp color between inner and outer based on ring index
    const lerpColor = (c1, c2, t) => {
      const h2d = (h) => {
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        return [r, g, b];
      };
      const [r1, g1, b1] = h2d(c1 || '#FF0080');
      const [r2, g2, b2] = h2d(c2 || '#00F0FF');
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r},${g},${b})`;
    };

    for (let ring = ringCount - 1; ring >= 0; ring--) {
      const ringProgress = ring / (ringCount - 1);
      const freqIdx = Math.floor(ringProgress * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const audioMod = ring < 2 ? bass : (ring > ringCount - 2 ? treble : energy);

      // 3D perspective tilt — rings appear tilted in Z-space
      const tiltY = 0.35 + ring * 0.02; // Y-scale simulates perspective tilt
      const radius = baseRadius + ring * ringSpacing * (1.0 + audioMod * 0.3);
      const pulsedRadius = radius * (1.0 + freqVal * 0.25 + bass * 0.1);

      // Each ring rotates at different speed
      const rotSpeed = (cfg.rotationSpeed || 0.4) * (1.0 + ring * 0.15) * (ring % 2 === 0 ? 1 : -1);
      const rotAngle = t * rotSpeed + ring * (Math.PI / ringCount);

      const ringColor = lerpColor(cfg.colorInner, cfg.colorOuter, ringProgress);
      const glowBlur = (15 + freqVal * 35 + energy * 20) * (cfg.glowIntensity || 1.0);

      // Draw glow halo
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = glowBlur;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2 + freqVal * 4 + (ring === 0 ? 2 : 0);
      ctx.globalAlpha = 0.3 + freqVal * 0.5 + energy * 0.2;

      // Draw ellipse (3D perspective tilt)
      ctx.beginPath();
      ctx.ellipse(cx, cy, pulsedRadius, pulsedRadius * tiltY, rotAngle, 0, Math.PI * 2);
      ctx.stroke();

      // Draw brighter thin ring on top
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6 + freqVal * 0.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, pulsedRadius, pulsedRadius * tiltY, rotAngle, 0, Math.PI * 2);
      ctx.stroke();

      // Draw accent dot at top of each ring
      const dotX = cx + Math.cos(rotAngle - Math.PI / 2) * pulsedRadius;
      const dotY = cy + Math.sin(rotAngle - Math.PI / 2) * pulsedRadius * tiltY;
      const dotSize = 3 + freqVal * 7 + energy * 4;
      ctx.shadowColor = cfg.colorAccent || '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillStyle = cfg.colorAccent || '#FFD700';
      ctx.globalAlpha = 0.7 + freqVal * 0.3;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central core pulse
    const coreRadius = baseRadius * 0.7 * (1.0 + bass * 0.6 + energy * 0.3);
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
    coreGrad.addColorStop(0, (cfg.colorInner || '#FF0080') + 'FF');
    coreGrad.addColorStop(0.5, (cfg.colorAccent || '#FFD700') + '80');
    coreGrad.addColorStop(1, 'transparent');
    ctx.shadowColor = cfg.colorInner || '#FF0080';
    ctx.shadowBlur = 40 + bass * 30;
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.6 + bass * 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new QuantumRingsPlugin());
