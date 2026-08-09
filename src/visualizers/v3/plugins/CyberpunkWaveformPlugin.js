/**
 * CyberpunkWaveformPlugin.js [Visualizer 3 Plugin]
 * Cyberpunk grid & oscilloscope waveform plugin.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class CyberpunkWaveformPlugin extends IVisualizerPlugin {
  constructor() {
    super('cyberpunk-waveform', 'Cyberpunk Waveform', 'Neon cyberpunk oscilloscope waveform & perspective grid');
    this.defaultConfig = {
      colorWave: '#00F0FF',
      colorGrid: '#FF0055',
      lineWidth: 3
    };
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // 1. Perspective Horizon Grid
    ctx.strokeStyle = cfg.colorGrid || '#FF0055';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    const gridLines = 16;
    for (let i = 0; i <= gridLines; i++) {
      const x = (i / gridLines) * width;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(width / 2, centerY);
      ctx.stroke();
    }

    const scrollY = (timeline.timestamp * 100) % 40;
    for (let y = centerY; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y + scrollY);
      ctx.lineTo(width, y + scrollY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // 2. Oscilloscope Waveform Line
    let wave = audioState?.waveform;
    if (!wave || wave.length === 0) {
      wave = new Float32Array(64);
      const ts = timeline.timestamp;
      for (let i = 0; i < 64; i++) {
        wave[i] = Math.sin(ts * 6 + (i / 64) * Math.PI * 4) * 0.35;
      }
    }
    const step = width / (wave.length - 1);

    ctx.strokeStyle = cfg.colorWave || '#00F0FF';
    ctx.lineWidth = cfg.lineWidth || 3;
    ctx.beginPath();

    for (let i = 0; i < wave.length; i++) {
      const x = i * step;
      const y = centerY + wave[i] * (height * 0.25);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

visualizerRegistryV3.register(new CyberpunkWaveformPlugin());
