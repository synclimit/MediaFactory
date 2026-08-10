import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

function toHex6(col, defaultHex = '#a855f7') {
  if (!col) return defaultHex;
  let s = String(col).trim();
  if (s.startsWith('#')) {
    if (s.length === 4) {
      return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
    }
    if (s.length === 7) return s;
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return defaultHex;
}

export class ParticleOrbitPlugin extends IVisualizerPlugin {
  constructor() {
    super('PARTICLE_ORBIT', 'Particle Orbit');
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const { width, height } = viewport;
    const cx = width / 2;
    const cy = height / 2;

    const t = timeline.timestamp || 0;
    const particleCount = config.particleCount || 40;
    const baseRadius = config.radius || Math.min(width, height) * 0.22;
    const energy = audioState.energy || 0.2;

    const primaryColor = toHex6(config.primaryColor, '#a855f7');
    const secondaryColor = toHex6(config.secondaryColor, '#ec4899');

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + t * 0.8;
      const radiusOffset = Math.sin(t * 3 + i) * 20 * energy;
      const r = baseRadius + radiusOffset;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const size = (3 + (i % 5) * 2) * (1 + energy);

      ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
