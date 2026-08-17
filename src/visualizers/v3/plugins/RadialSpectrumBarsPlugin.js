/**
 * RadialSpectrumBarsPlugin.js [Visualizer 3 Plugin]
 * Created from Visualizer Analyzer M3 Analysis Package (b15cb2b4)
 * 
 * Specs extracted by Analyzer Engine:
 * - Geometry: Radial Bars (48 radial spectrum bars emitting outward)
 * - Symmetry: Radial (360-degree circular distribution)
 * - Spatial Anchor: [0.478, 0.27] (Configurable relative center)
 * - Primary Palette: #697E87, #EAD7F1, #C561B2
 * - Audio Bindings:
 *   - Bass (20-250Hz): Inner ring core pulse & radius scaling (1.4x multiplier)
 *   - Mid (250-4kHz): Radial bar length & rotational phase modulation
 *   - Treble (4k-20kHz): Outer cap dots & neon bloom intensity
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class RadialSpectrumBarsPlugin extends IVisualizerPlugin {
  constructor() {
    super(
      'radial-spectrum-bars',
      'Radial Spectrum',
      'Radial spectrum bars pulsating outward from a neon core, generated from M3 Analyzer spec'
    );
    this.defaultConfig = {
      centerX: 0.478,
      centerY: 0.27,
      barCount: 48,
      innerRadiusRatio: 0.18,
      maxBarLength: 160,
      glowIntensity: 1.0,
      bassMultiplier: 1.4,
      colorLeft: '#697E87',
      colorMid: '#EAD7F1',
      colorRight: '#C561B2'
    };
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;

    ctx.clearRect(0, 0, width, height);

    const isFastMode = typeof window !== 'undefined' && window.fastRenderState ? window.fastRenderState.isFastMode() : false;
    const isLivePlaying = Boolean(window.m3IsPlaying) || isFastMode;
    const t = isLivePlaying ? timeline.timestamp : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = (isLivePlaying ? (audioState?.bass || 0) : 0) * (cfg.bassMultiplier || 1.4);
    const mid = isLivePlaying ? (audioState?.mid || 0) : 0;
    const treble = isLivePlaying ? (audioState?.treble || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;

    // Anchor Center (Spec: [0.478, 0.27])
    const cx = width * (cfg.centerX ?? 0.478);
    const cy = height * (cfg.centerY ?? 0.27);
    const minDim = Math.min(width, height);

    // Dynamic Pulsing Inner Radius (Bass binding)
    const baseRadius = minDim * (cfg.innerRadiusRatio || 0.18);
    const pulseRadius = baseRadius + bass * 35;

    ctx.save();

    // 1. Inner Glowing Pulse Core
    const coreGrad = ctx.createRadialGradient(cx, cy, pulseRadius * 0.2, cx, cy, pulseRadius);
    coreGrad.addColorStop(0, cfg.colorMid || '#EAD7F1');
    coreGrad.addColorStop(0.7, cfg.colorRight || '#C561B2');
    coreGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner Core Border Ring
    ctx.shadowColor = cfg.colorRight || '#C561B2';
    ctx.shadowBlur = (15 + treble * 25) * (cfg.glowIntensity || 1.0);
    ctx.strokeStyle = cfg.colorRight || '#C561B2';
    ctx.lineWidth = 3 + bass * 3;
    ctx.stroke();

    // 2. Radial Spectrum Bars
    const barCount = cfg.barCount || 48;
    const maxLen = cfg.maxBarLength || (minDim * 0.25);
    const angleStep = (Math.PI * 2) / barCount;
    const rotOffset = t * 0.2; // Slow rotation

    const color1 = cfg.colorLeft || '#697E87';
    const color2 = cfg.colorMid || '#EAD7F1';
    const color3 = cfg.colorRight || '#C561B2';

    ctx.lineCap = 'round';

    for (let i = 0; i < barCount; i++) {
      const angle = i * angleStep + rotOffset;
      const freqIdx = Math.floor((i / barCount) * freqs.length);
      const freqVal = freqs[freqIdx] || 0.1;

      // Bar Length calculation combining Mid frequency + Bass energy
      const len = Math.max(8, freqVal * maxLen * 1.5 + mid * 25);

      const x1 = cx + Math.cos(angle) * (pulseRadius + 6);
      const y1 = cy + Math.sin(angle) * (pulseRadius + 6);
      const x2 = cx + Math.cos(angle) * (pulseRadius + 6 + len);
      const y2 = cy + Math.sin(angle) * (pulseRadius + 6 + len);

      // Color Gradient per bar
      const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      const progress = i / barCount;
      if (progress < 0.5) {
        barGrad.addColorStop(0, color1);
        barGrad.addColorStop(1, color2);
      } else {
        barGrad.addColorStop(0, color2);
        barGrad.addColorStop(1, color3);
      }

      // Render Radial Bar
      ctx.shadowColor = progress < 0.5 ? color2 : color3;
      ctx.shadowBlur = (10 + treble * 20) * (cfg.glowIntensity || 1.0);
      ctx.strokeStyle = barGrad;
      ctx.lineWidth = Math.max(2, (Math.PI * 2 * pulseRadius) / (barCount * 1.8));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Outer Cap Dot (Treble binding)
      const capDotR = 2.5 + treble * 3;
      const capX = cx + Math.cos(angle) * (pulseRadius + 14 + len);
      const capY = cy + Math.sin(angle) * (pulseRadius + 14 + len);

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(capX, capY, capDotR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

visualizerRegistryV3.register(new RadialSpectrumBarsPlugin());
