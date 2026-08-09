/**
 * ParticleOrbitPlugin.js [Visualizer 3 Plugin]
 * Deterministic multi-layer particle orbit system.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class ParticleOrbitPlugin extends IVisualizerPlugin {
  constructor() {
    super('particle-orbit', 'Particle Orbit', 'Multi-layer orbiting particle galaxy system');
    this.defaultConfig = {
      particleCount: 120,
      colorA: '#8B5CF6',
      colorB: '#EC4899',
      colorC: '#3B82F6'
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

    const energy = audioState ? audioState.energy || 0 : 0;
    const count = cfg.particleCount || 120;
    const t = timeline.timestamp;

    const colors = [cfg.colorA || '#8B5CF6', cfg.colorB || '#EC4899', cfg.colorC || '#3B82F6'];

    for (let i = 0; i < count; i++) {
      const phi = (i / count) * Math.PI * 2;
      const speed = 0.5 + (i % 3) * 0.4;
      const angle = phi + t * speed;
      const baseRadius = 80 + (i % 5) * 45;
      const radius = baseRadius * (1.0 + energy * 0.5);

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * (radius * 0.6);
      const particleSize = 3 + (i % 4) + energy * 4;

      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.4 + (i % 5) * 0.12;

      ctx.beginPath();
      ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new ParticleOrbitPlugin());
