/**
 * HolographicGridPlugin.js [Visualizer 3 Plugin]
 * Holographic Grid — a futuristic 3D wireframe grid that ripples
 * like a terrain/height map driven by audio frequencies.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class HolographicGridPlugin extends IVisualizerPlugin {
  constructor() {
    super('holographic-grid', 'Holographic Grid', 'Futuristic 3D wireframe grid terrain rippling with audio frequency energy');
    this.defaultConfig = {
      colorGrid: '#00F0FF',
      colorPeak: '#FF006E',
      colorHorizon: '#7B2FFF',
      gridCols: 24,
      gridRows: 14,
      perspectiveDepth: 0.55,
      maxHeight: 200,
      speed: 0.8
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
    const t = isLivePlaying ? (timeline.timestamp * (cfg.speed || 0.8)) : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;

    const cols = cfg.gridCols || 24;
    const rows = cfg.gridRows || 14;
    const perspY = cfg.perspectiveDepth || 0.55; // where horizon sits (0-1)
    const maxH = cfg.maxHeight || 200;

    const horizonY = height * perspY;
    const vpX = width / 2; // vanishing point X

    // Project 3D grid point to 2D screen with perspective
    const project = (gx, gz, gy3d) => {
      // gx: 0-1 grid X, gz: 0-1 grid Z (depth), gy3d: height offset
      const perspective = 1.0 / (1.0 + gz * 3.5);
      const screenX = vpX + (gx - 0.5) * width * 1.2 * perspective;
      const screenY = horizonY + (gz * (height - horizonY) * 1.1) - gy3d * perspective;
      return [screenX, screenY, perspective];
    };

    // Build height map
    const hmap = [];
    for (let row = 0; row <= rows; row++) {
      hmap[row] = [];
      for (let col = 0; col <= cols; col++) {
        const gx = col / cols;
        const gz = row / rows;
        const freqIdx = Math.floor(gx * freqs.length);
        const freqVal = freqs[freqIdx] || 0.3;

        const wave1 = Math.sin(gx * Math.PI * 4 + t * 2.1) * 0.5 + 0.5;
        const wave2 = Math.cos(gz * Math.PI * 3 + t * 1.4) * 0.5 + 0.5;
        const waveBass = Math.sin(gx * Math.PI * 2 + gz * Math.PI * 2 + t * 1.8) * bass;

        hmap[row][col] = maxH * freqVal * (wave1 * 0.4 + wave2 * 0.3 + waveBass * 0.3);
      }
    }

    // Draw grid row lines (back to front for proper painter's order)
    for (let row = 0; row <= rows; row++) {
      const gz = row / rows;
      const rowProgress = row / rows;
      const alpha = 0.15 + rowProgress * 0.55 + energy * 0.2;

      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, (cfg.colorHorizon || '#7B2FFF') + '00');
      grad.addColorStop(0.3, cfg.colorGrid || '#00F0FF');
      grad.addColorStop(0.5, cfg.colorGrid || '#00F0FF');
      grad.addColorStop(0.7, cfg.colorGrid || '#00F0FF');
      grad.addColorStop(1, (cfg.colorHorizon || '#7B2FFF') + '00');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.8 + rowProgress * 2;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = cfg.colorGrid || '#00F0FF';
      ctx.shadowBlur = 6 + energy * 10;

      ctx.beginPath();
      for (let col = 0; col <= cols; col++) {
        const gx = col / cols;
        const [sx, sy] = project(gx, gz, hmap[row][col]);
        if (col === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Draw grid column lines (left to right)
    for (let col = 0; col <= cols; col++) {
      const gx = col / cols;
      const alpha = 0.12 + energy * 0.15;
      ctx.strokeStyle = cfg.colorGrid || '#00F0FF';
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      for (let row = 0; row <= rows; row++) {
        const gz = row / rows;
        const [sx, sy] = project(gx, gz, hmap[row][col]);
        if (row === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Draw peak glow dots on high amplitude cells
    for (let row = 1; row < rows; row++) {
      for (let col = 1; col < cols; col++) {
        const h = hmap[row][col];
        if (h > maxH * 0.5) {
          const gx = col / cols;
          const gz = row / rows;
          const [sx, sy, persp] = project(gx, gz, h);
          const dotSize = (3 + h / maxH * 8) * persp;
          ctx.shadowColor = cfg.colorPeak || '#FF006E';
          ctx.shadowBlur = 20;
          ctx.fillStyle = cfg.colorPeak || '#FF006E';
          ctx.globalAlpha = 0.5 + (h / maxH) * 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Horizon glow line
    ctx.shadowColor = cfg.colorHorizon || '#7B2FFF';
    ctx.shadowBlur = 30 + energy * 20;
    ctx.strokeStyle = cfg.colorHorizon || '#7B2FFF';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + energy * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new HolographicGridPlugin());
