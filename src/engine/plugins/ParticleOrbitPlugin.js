import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

export class ParticleOrbitPlugin extends IVisualizerPlugin {
  constructor() {
    super('PARTICLE_ORBIT', 'Particle Orbit Visualizer');
  }

  render(renderContext) {
    const { ctx, viewport, timeline, audioState, config } = renderContext;
    const { width, height } = viewport;
    const { timestamp } = timeline;

    ctx.save();

    ctx.fillStyle = config.bgColor || '#05070d';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const count = config.particleCount || 80;
    const bass = audioState.bass || 0;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + timestamp * 0.5 * (i % 2 === 0 ? 1 : -1);
      const radius = 100 + ((timestamp * 50 + i * 30) % 250) + bass * 40;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;

      ctx.fillStyle = i % 2 === 0 ? '#00f2fe' : '#ff2a85';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, 3 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
