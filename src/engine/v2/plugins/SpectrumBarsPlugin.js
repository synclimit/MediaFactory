import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

function toHex6(col, defaultHex = '#f97316') {
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

export class SpectrumBarsPlugin extends IVisualizerPlugin {
  constructor() {
    super('SPECTRUM_BARS', 'Spectrum Bars');
  }

  render(renderContext) {
    const { ctx, viewport, audioState, config } = renderContext;
    const { width, height } = viewport;
    const time = audioState.time || (performance.now() / 1000);

    const freqs = audioState.frequencies || new Float32Array(64);
    const count = Math.min(64, freqs.length || 64);
    const gap = Math.max(1, config.gap || 3);
    const barWidth = Math.max(2, (width - (count + 1) * gap) / count);

    ctx.clearRect(0, 0, width, height);

    const primaryColor = toHex6(config.primaryColor, '#f97316');
    const secondaryColor = toHex6(config.secondaryColor, '#eab308');

    for (let i = 0; i < count; i++) {
      const val = (freqs[i] !== undefined && freqs[i] > 0.01)
        ? freqs[i]
        : Math.abs(Math.sin(i * 0.2 + time * 3)) * 0.35;
      const barHeight = Math.max(4, val * (height * 0.75));
      const x = gap + i * (barWidth + gap);
      const y = height - barHeight;

      try {
        const grad = ctx.createLinearGradient(x, height, x, y);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, secondaryColor);
        ctx.fillStyle = grad;
      } catch (e) {
        ctx.fillStyle = primaryColor;
      }

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }
  }
}
