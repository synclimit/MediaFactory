import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

function toHex6(col, defaultHex = '#ff0055') {
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

export class CyberpunkWaveformPlugin extends IVisualizerPlugin {
  constructor() {
    super('CYBERPUNK_WAVEFORM', 'Cyberpunk Waveform');
  }

  render(renderContext) {
    const { ctx, viewport, audioState, config } = renderContext;
    const { width, height } = viewport;
    const cy = height / 2;
    const time = audioState.time || (performance.now() / 1000);

    const waveform = audioState.waveform || new Float32Array(64);
    const count = waveform.length || 64;
    const step = width / count;

    ctx.clearRect(0, 0, width, height);

    ctx.save();

    const primaryColor = toHex6(config.primaryColor, '#ff0055');
    const secondaryColor = toHex6(config.secondaryColor, '#00f2fe');

    // Primary Waveform
    ctx.shadowBlur = 20;
    ctx.shadowColor = primaryColor;
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();

    for (let i = 0; i < count; i++) {
      const x = i * step;
      const val = (waveform[i] !== undefined && Math.abs(waveform[i]) > 0.001)
        ? waveform[i]
        : Math.sin(i * 0.25 + time * 4) * 0.2;
      const amp = val * (config.amplitude || 140);
      const y = cy + amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Secondary Waveform
    ctx.shadowColor = secondaryColor;
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < count; i++) {
      const x = i * step;
      const val = (waveform[i] !== undefined && Math.abs(waveform[i]) > 0.001)
        ? waveform[i]
        : Math.sin(i * 0.25 + time * 4) * 0.2;
      const amp = val * (config.amplitude || 140) * -1;
      const y = cy + amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.restore();
  }
}
