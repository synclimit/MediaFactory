/**
 * VortexTunnelPlugin.js [Visualizer 3 Plugin]
 * Vortex Tunnel — a spiraling tunnel of rings that pull you inward,
 * rotating and contracting with audio energy creating a hypnotic effect.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class VortexTunnelPlugin extends IVisualizerPlugin {
  constructor() {
    super('vortex-tunnel', 'Vortex Tunnel', 'Hypnotic spiraling tunnel of rings pulling inward with audio energy');
    this.defaultConfig = {
      colorNear: '#FF006E',
      colorFar: '#00F5FF',
      colorCore: '#FFD700',
      ringCount: 20,
      rotationSpeed: 0.8,
      tunnelSpeed: 1.5,
      maxRadius: 520,
      spiralTwist: 2.0
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
    const mid = isLivePlaying ? (audioState?.mid || 0) : 0;

    const ringCount = cfg.ringCount || 20;
    const maxRadius = cfg.maxRadius || 520;
    const rotSpeed = cfg.rotationSpeed || 0.8;
    const tunnelSpeed = cfg.tunnelSpeed || 1.5;
    const spiralTwist = cfg.spiralTwist || 2.0;

    // Draw from outermost ring inward (painter's order)
    for (let i = ringCount - 1; i >= 0; i--) {
      // Tunnel effect: rings scroll toward center
      const scrollOffset = (t * tunnelSpeed * 0.15) % 1.0;
      const ringDepth = (i / (ringCount - 1) + scrollOffset) % 1.0;

      // Perspective: outer rings bigger, inner smaller
      const perspScale = ringDepth; // 0 = near/large, 1 = far/small reversed
      const radius = maxRadius * (1.0 - ringDepth) * (1.0 + (energy + bass) * 0.1);
      if (radius < 4) continue;

      // Each ring rotates at progressive speed (nearer = faster)
      const ringRotation = t * rotSpeed * (1.5 - ringDepth) + ringDepth * Math.PI * spiralTwist;

      // Freq sampling based on ring depth
      const freqIdx = Math.floor(ringDepth * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const audioMod = ringDepth < 0.33 ? bass : (ringDepth < 0.66 ? mid : energy);

      // Color lerp: near = colorNear, far = colorFar
      const lerp = (a, b, t) => Math.round(a + (b - a) * t);
      const h2d = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
      const [r1,g1,b1] = h2d(cfg.colorNear || '#FF006E');
      const [r2,g2,b2] = h2d(cfg.colorFar || '#00F5FF');
      const ringColor = `rgb(${lerp(r1,r2,ringDepth)},${lerp(g1,g2,ringDepth)},${lerp(b1,b2,ringDepth)})`;

      const alpha = (1.0 - ringDepth * 0.5) * (0.4 + freqVal * 0.4 + audioMod * 0.2);
      const lineW = (1.5 + (1.0 - ringDepth) * 4) * (1.0 + freqVal * 0.5);

      // Draw the ring as an ellipse with vertical compression (tunnel illusion)
      const ellipseRx = radius;
      const ellipseRy = radius * (0.5 + ringDepth * 0.35); // compress vertically at edges

      // Draw glow halo
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = (10 + (1.0 - ringDepth) * 30) * (1.0 + energy * 0.5);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = lineW * 2.5;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, ellipseRx, ellipseRy, ringRotation, 0, Math.PI * 2);
      ctx.stroke();

      // Bright core ring
      ctx.shadowBlur = 8;
      ctx.lineWidth = lineW;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(cx, cy, ellipseRx, ellipseRy, ringRotation, 0, Math.PI * 2);
      ctx.stroke();

      // Spiral connectors (spokes from ring to ring)
      if (i > 0 && i % 3 === 0) {
        const spokeCount = 6;
        for (let s = 0; s < spokeCount; s++) {
          const spokeAngle = (s / spokeCount) * Math.PI * 2 + ringRotation;
          const x1 = cx + Math.cos(spokeAngle) * ellipseRx;
          const y1 = cy + Math.sin(spokeAngle) * ellipseRy;
          const outerRadius = maxRadius * (1.0 - (ringDepth + 1.0 / ringCount)) + freqVal * 20;
          const outerRy = outerRadius * (0.5 + (ringDepth + 1.0/ringCount) * 0.35);
          const x2 = cx + Math.cos(spokeAngle + 0.15) * outerRadius;
          const y2 = cy + Math.sin(spokeAngle + 0.15) * outerRy;

          ctx.shadowColor = cfg.colorCore || '#FFD700';
          ctx.shadowBlur = 8;
          ctx.strokeStyle = cfg.colorCore || '#FFD700';
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Central vanishing point glow
    const coreR = 15 + energy * 30 + bass * 20;
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0, '#FFFFFF');
    coreGrad.addColorStop(0.4, cfg.colorCore || '#FFD700');
    coreGrad.addColorStop(1, 'transparent');
    ctx.shadowColor = cfg.colorCore || '#FFD700';
    ctx.shadowBlur = 40 + energy * 30;
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new VortexTunnelPlugin());
