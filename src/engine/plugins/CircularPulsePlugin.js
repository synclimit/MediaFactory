import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';

export class CircularPulsePlugin extends IVisualizerPlugin {
  constructor() {
    super('CIRCULAR_PULSE', 'Circular Pulse Visualizer');
  }

  render(renderContext) {
    const { ctx, viewport, timeline, audioState, config } = renderContext;
    const { width, height } = viewport;
    const { timestamp } = timeline;

    ctx.save();

    // 1. Draw Background & Radial Glow
    ctx.fillStyle = config.bgColor || '#090c15';
    ctx.fillRect(0, 0, width, height);

    const bgGlow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.7);
    bgGlow.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    bgGlow.addColorStop(1, 'rgba(5, 7, 13, 1)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.18;
    const bassVal = audioState.bass || 0;

    // 2. Pulse Center Core
    const pulseRadius = baseRadius * (1 + bassVal * 0.3);
    ctx.shadowColor = config.primaryColor || '#00f2fe';
    ctx.shadowBlur = 25 * (1 + bassVal);

    const centerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
    centerGrad.addColorStop(0, 'rgba(0, 242, 254, 0.9)');
    centerGrad.addColorStop(0.6, 'rgba(79, 172, 254, 0.4)');
    centerGrad.addColorStop(1, 'rgba(157, 78, 221, 0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Orbiting Particles
    const numParticles = config.particleCount || 40;
    for (let p = 0; p < numParticles; p++) {
      const angle = (p / numParticles) * Math.PI * 2 + (timestamp * 0.3 * (p % 2 === 0 ? 1 : -1));
      const dist = baseRadius * 1.2 + ((timestamp * 40 + p * 25) % (Math.min(width, height) * 0.35));
      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist;
      const pSize = 1.5 + (p % 3);

      ctx.fillStyle = p % 2 === 0 ? '#00f2fe' : '#9d4edd';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Circular Frequency Spectrum Bars
    const frequencies = audioState.frequencies || new Float32Array(64);
    const numBars = 64;
    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;
      const freqIdx = Math.floor((i / numBars) * frequencies.length);
      const val = frequencies[freqIdx] || 0.05;
      const barHeight = val * Math.min(width, height) * 0.22;

      const x1 = centerX + Math.cos(angle) * (baseRadius + 5);
      const y1 = centerY + Math.sin(angle) * (baseRadius + 5);
      const x2 = centerX + Math.cos(angle) * (baseRadius + 5 + barHeight);
      const y2 = centerY + Math.sin(angle) * (baseRadius + 5 + barHeight);

      const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      barGrad.addColorStop(0, '#00f2fe');
      barGrad.addColorStop(0.5, '#4facfe');
      barGrad.addColorStop(1, '#ff2a85');

      ctx.strokeStyle = barGrad;
      ctx.lineWidth = Math.max(2, (width / 600) * 3);
      ctx.lineCap = 'round';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 5. Oscilloscope Waveform Inner Ring
    const waveform = audioState.waveform || new Float32Array(64);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < waveform.length; i++) {
      const angle = (i / waveform.length) * Math.PI * 2;
      const waveAmp = (waveform[i] || 0) * 15;
      const r = baseRadius - 10 + waveAmp;
      const wx = centerX + Math.cos(angle) * r;
      const wy = centerY + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  getConfigSchema() {
    return {
      bgColor: { type: 'color', label: 'Background Color', default: '#090c15' },
      primaryColor: { type: 'color', label: 'Primary Glow Color', default: '#00f2fe' },
      particleCount: { type: 'number', label: 'Particle Count', default: 40, min: 10, max: 150 }
    };
  }
}
