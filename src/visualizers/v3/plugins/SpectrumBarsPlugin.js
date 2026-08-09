/**
 * SpectrumBarsPlugin.js [Visualizer 3 Plugin]
 * Classic & Advanced Spectrum Bars Visualizer Plugin.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class SpectrumBarsPlugin extends IVisualizerPlugin {
  constructor() {
    super('spectrum-bars', 'Spectrum Bars', 'Classic and advanced spectrum audio frequency bars');
    this.defaultConfig = {
      barCount: 64,
      spacing: 4,
      thickness: 4,
      height: 250,
      colorLeft: '#AB55F7',
      colorRight: '#F59E0B',
      colorMid: '#06B6D4',
      colorMode: '2 Gradient',
      frequencyOrder: 'Bass -> Treble',
      center: true,
      mirror: false,
      roundedCaps: true
    };
  }

  render(renderContext) {
    const { ctx, viewport, audioState, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;
    const barCount = cfg.barCount || 64;
    const spacing = cfg.spacing || 4;
    const maxHeight = cfg.height || 250;

    // Clear frame background
    ctx.clearRect(0, 0, width, height);

    let rawFreqs = audioState?.frequencies;
    if (!rawFreqs || rawFreqs.length === 0) {
      rawFreqs = new Float32Array(barCount);
      const ts = renderContext.timeline.timestamp;
      for (let i = 0; i < barCount; i++) {
        rawFreqs[i] = Math.abs(Math.sin(ts * 3 + i * 0.15)) * 0.5 + 0.1;
      }
    }
    const frequencies = new Float32Array(barCount);

    // 1. Frequency Reordering (Bass -> Treble, Treble -> Bass, Center Bass, Split Mirror)
    const order = cfg.frequencyOrder || 'Bass -> Treble';
    for (let i = 0; i < barCount; i++) {
      const srcIdx = Math.floor((i / barCount) * rawFreqs.length);
      const val = rawFreqs[srcIdx] || 0;

      if (order === 'Treble -> Bass') {
        frequencies[barCount - 1 - i] = val;
      } else if (order === 'Center Bass') {
        const mid = Math.floor(barCount / 2);
        if (i % 2 === 0) frequencies[mid + Math.floor(i / 2)] = val;
        else frequencies[mid - Math.ceil(i / 2)] = val;
      } else if (order === 'Split Mirror') {
        const half = Math.floor(barCount / 2);
        if (i < half) {
          frequencies[i] = rawFreqs[Math.floor(((half - 1 - i) / half) * rawFreqs.length)];
        } else {
          frequencies[i] = rawFreqs[Math.floor(((i - half) / half) * rawFreqs.length)];
        }
      } else {
        frequencies[i] = val;
      }
    }

    // 2. Bar Width Calculation
    const totalSpacing = (barCount - 1) * spacing;
    const barWidth = cfg.thickness || Math.max(2, (width * 0.8 - totalSpacing) / barCount);
    const totalSpan = barCount * barWidth + totalSpacing;
    const startX = (width - totalSpan) / 2;
    const centerY = height / 2;
    const bottomY = height * 0.75;

    // 3. Gradient / Color Creation
    let gradient;
    const mode = cfg.colorMode || '2 Gradient';
    if (mode === '3 Gradient') {
      gradient = ctx.createLinearGradient(startX, 0, startX + totalSpan, 0);
      gradient.addColorStop(0, cfg.colorLeft || '#AB55F7');
      gradient.addColorStop(0.5, cfg.colorMid || '#06B6D4');
      gradient.addColorStop(1, cfg.colorRight || '#F59E0B');
    } else if (mode === 'Rainbow') {
      const hue = Math.floor((renderContext.timeline.timestamp * 50) % 360);
      gradient = `hsl(${hue}, 100%, 55%)`;
    } else if (mode === 'Solid') {
      gradient = cfg.colorLeft || '#AB55F7';
    } else {
      gradient = ctx.createLinearGradient(startX, 0, startX + totalSpan, 0);
      gradient.addColorStop(0, cfg.colorLeft || '#AB55F7');
      gradient.addColorStop(1, cfg.colorRight || '#F59E0B');
    }

    ctx.fillStyle = gradient;

    // 4. Render Bars
    for (let i = 0; i < barCount; i++) {
      const val = frequencies[i] || 0;
      const barH = Math.max(4, val * maxHeight);
      const x = startX + i * (barWidth + spacing);

      if (cfg.center) {
        // Centered Y bar
        const y = centerY - barH / 2;
        if (cfg.roundedCaps && barWidth >= 4) {
          this.drawRoundedRect(ctx, x, y, barWidth, barH, Math.min(barWidth / 2, 8));
        } else {
          ctx.fillRect(x, y, barWidth, barH);
        }
      } else {
        // Bottom aligned bar
        const y = bottomY - barH;
        if (cfg.roundedCaps && barWidth >= 4) {
          this.drawRoundedRect(ctx, x, y, barWidth, barH, Math.min(barWidth / 2, 8));
        } else {
          ctx.fillRect(x, y, barWidth, barH);
        }
      }
    }
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
}

// Auto-register to V3 Registry
visualizerRegistryV3.register(new SpectrumBarsPlugin());
