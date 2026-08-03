import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

export class CyberpunkWaveformPlugin extends IVisualizerPlugin {
  constructor() {
    super('CYBERPUNK_WAVEFORM', 'Cyberpunk Waveform Visualizer');
  }

  render(renderContext) {
    const { ctx, viewport, timeline, audioState, config } = renderContext;
    const { width, height } = viewport;
    const { timestamp } = timeline;

    ctx.save();

    // 1. Draw Background
    ctx.fillStyle = config.bgColor || '#090c15';
    ctx.fillRect(0, 0, width, height);

    const gridYStart = height * 0.55;
    const horizonY = height * 0.45;

    // 2. Perspective Grid Lines
    ctx.strokeStyle = 'rgba(157, 78, 221, 0.25)';
    ctx.lineWidth = 1;

    const speed = 60;
    const offset = (timestamp * speed) % 30;
    for (let y = gridYStart; y < height; y += 25) {
      const adjustedY = y + offset;
      if (adjustedY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, adjustedY);
        ctx.lineTo(width, adjustedY);
        ctx.stroke();
      }
    }

    const vanishingX = width / 2;
    for (let i = -10; i <= 10; i++) {
      const startX = width / 2 + (i * width) / 10;
      ctx.beginPath();
      ctx.moveTo(vanishingX, horizonY);
      ctx.lineTo(startX, height);
      ctx.stroke();
    }

    // 3. Horizon Glow Line
    ctx.shadowColor = '#ff2a85';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#ff2a85';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    // 4. Waveform Line
    const waveform = audioState.waveform || new Float32Array(64);
    const waveY = height * 0.3;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const sliceWidth = width / waveform.length;
    let x = 0;

    for (let i = 0; i < waveform.length; i++) {
      const v = waveform[i] || 0;
      const y = waveY + v * (height * 0.15);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }
    ctx.stroke();

    // 5. Spectrum Frequency Bars
    const frequencies = audioState.frequencies || new Float32Array(64);
    const barWidth = (width * 0.8) / frequencies.length;
    const startXBar = (width - width * 0.8) / 2;

    for (let i = 0; i < frequencies.length; i++) {
      const val = frequencies[i] || 0;
      const barH = val * (height * 0.35);
      const bx = startXBar + i * barWidth;
      const by = horizonY - barH;

      const barGrad = ctx.createLinearGradient(bx, horizonY, bx, by);
      barGrad.addColorStop(0, 'rgba(157, 78, 221, 0.4)');
      barGrad.addColorStop(0.5, 'rgba(0, 242, 254, 0.8)');
      barGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = barGrad;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 6;
      ctx.fillRect(bx + 2, by, barWidth - 4, barH);
    }

    ctx.restore();
  }

  getConfigSchema() {
    return {
      bgColor: { type: 'color', label: 'Background Color', default: '#090c15' }
    };
  }
}
