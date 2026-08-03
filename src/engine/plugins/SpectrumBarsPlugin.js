import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

export class SpectrumBarsPlugin extends IVisualizerPlugin {
  constructor() {
    super('SPECTRUM_BARS', 'Spectrum Bars Visualizer');
  }

  render(renderContext) {
    const { ctx, viewport, audioState, config } = renderContext;
    const { width, height } = viewport;

    ctx.save();

    // Background
    ctx.fillStyle = config.bgColor || '#090c15';
    ctx.fillRect(0, 0, width, height);

    const frequencies = audioState.frequencies || new Float32Array(64);
    const numBars = frequencies.length;
    const padding = 60;
    const availableWidth = width - padding * 2;
    const barWidth = availableWidth / numBars;
    const maxBarHeight = height * 0.5;
    const startY = height * 0.75;

    for (let i = 0; i < numBars; i++) {
      const val = frequencies[i] || 0;
      const barH = val * maxBarHeight;
      const x = padding + i * barWidth;
      const y = startY - barH;

      const grad = ctx.createLinearGradient(x, startY, x, y);
      grad.addColorStop(0, '#00f2fe');
      grad.addColorStop(0.7, '#4facfe');
      grad.addColorStop(1, '#ff2a85');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + 2, y, barWidth - 4, barH);
    }

    ctx.restore();
  }
}
