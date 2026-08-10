import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

function toHex6(col, defaultHex = '#00f2fe') {
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

export class CircularPulsePlugin extends IVisualizerPlugin {
  constructor() {
    super('CIRCULAR_PULSE', 'Circular Pulse');
  }

  render(renderContext) {
    const { ctx, viewport, audioState, config } = renderContext;
    const { width, height } = viewport;
    const cx = width / 2;
    const cy = height / 2;

    const baseRadius = config.radius || Math.min(width, height) * 0.18;
    const primaryColor = toHex6(config.primaryColor, '#00f2fe');
    const secondaryColor = toHex6(config.secondaryColor, '#4facfe');

    ctx.clearRect(0, 0, width, height);

    const bassEnergy = audioState.bass || 0;
    const kickBoost = audioState.kick ? 0.3 : 0;
    const pulseRadius = baseRadius * (1 + bassEnergy * 0.35 + kickBoost);

    // Glow background
    try {
      const gradient = ctx.createRadialGradient(cx, cy, pulseRadius * 0.2, cx, cy, pulseRadius * 1.8);
      gradient.addColorStop(0, primaryColor + '66');
      gradient.addColorStop(0.5, secondaryColor + '22');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();
    } catch (e) {
      ctx.fillStyle = primaryColor;
    }

    // Frequency Bars around circle
    const freqs = audioState.frequencies || new Float32Array(64);
    const count = freqs.length || 64;
    const step = (Math.PI * 2) / count;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < count; i++) {
      const angle = i * step;
      const val = freqs[i] || 0;
      const barLen = val * (config.barMaxHeight || 120);

      const x1 = Math.cos(angle) * pulseRadius;
      const y1 = Math.sin(angle) * pulseRadius;
      const x2 = Math.cos(angle) * (pulseRadius + barLen);
      const y2 = Math.sin(angle) * (pulseRadius + barLen);

      ctx.strokeStyle = i % 2 === 0 ? primaryColor : secondaryColor;
      ctx.lineWidth = config.barLineWidth || 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Inner Core Circle
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius * 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
