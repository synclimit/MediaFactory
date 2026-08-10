/**
 * Visualizer V4 Single Pure 2D Canvas Engine
 * 100% WYSIWYG Single Source of Truth
 * 
 * Works identically on:
 * - Frontend Chromium HTML5 Canvas 2D
 * - Backend Node.js Cairo node-canvas 2D
 */

export class VisualizerV4Core {
  /**
   * Main Dispatcher for Visualizer V4 Rendering
   */
  static renderFrame(ctx, width, height, audioState = {}, config = {}) {
    if (!ctx || width <= 0 || height <= 0) return;

    const w = Math.round(width);
    const h = Math.round(height);

    ctx.save();
    const mode = (config.mode || config.style || 'spectrum-bars').toLowerCase();

    if (mode.includes('double') || mode.includes('mirror')) {
      this.renderDoubleSpectrum(ctx, w, h, audioState, config);
    } else if (mode.includes('radial') || mode.includes('ring-wave')) {
      this.renderRadialWave(ctx, w, h, audioState, config);
    } else if (mode.includes('circle') || mode.includes('pulse')) {
      this.renderCircularPulse(ctx, w, h, audioState, config);
    } else if (mode.includes('wave') || mode.includes('cyberpunk') || mode.includes('oscilloscope')) {
      this.renderWaveformOscilloscope(ctx, w, h, audioState, config);
    } else if (mode.includes('particle') || mode.includes('orbit') || mode.includes('galaxy')) {
      this.renderParticleOrbit(ctx, w, h, audioState, config);
    } else {
      // Default: Spectrum Bars
      this.renderSpectrumBars(ctx, w, h, audioState, config);
    }

    ctx.restore();
  }

  /**
   * 1. Spectrum Bars (Vertical Audio Frequency Bars)
   */
  static renderSpectrumBars(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const barCount = Math.max(8, Math.min(128, parseInt(config.barCount || 64, 10)));
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);
    const order = config.frequencyOrder || 'Bass -> Treble';

    const colorLeft = config.colorLeft || config.color1 || '#AB55F7';
    const colorRight = config.colorRight || config.color2 || '#F59E0B';
    const colorMid = config.colorMid || '#06B6D4';
    const colorMode = config.colorMode || '2 Gradient';

    const barSpacing = Math.max(1, Math.floor(w / (barCount * 4)));
    const totalSpacing = barSpacing * (barCount - 1);
    const barWidth = Math.max(2, Math.floor((w - totalSpacing) / barCount));
    const startX = Math.round((w - (barWidth * barCount + totalSpacing)) / 2);

    for (let i = 0; i < barCount; i++) {
      let freqIdx = Math.floor((i / barCount) * rawFrequencies.length);
      if (order === 'Treble -> Bass') {
        freqIdx = Math.floor(((barCount - 1 - i) / barCount) * rawFrequencies.length);
      } else if (order === 'Center Bass') {
        const center = (barCount - 1) / 2;
        const distFromCenter = Math.abs(i - center) / center;
        freqIdx = Math.floor(distFromCenter * rawFrequencies.length);
      }

      const freqVal = rawFrequencies[Math.min(freqIdx, rawFrequencies.length - 1)] || 0;
      const normalizedHeight = Math.min(1.0, Math.max(0.04, freqVal * gain));
      const barHeight = Math.max(4, Math.round(normalizedHeight * (h - 20)));

      const x = Math.round(startX + i * (barWidth + barSpacing));
      const y = Math.round(h - barHeight);

      ctx.fillStyle = this.getGradientOrColor(ctx, x, y, barWidth, barHeight, i, barCount, colorMode, colorLeft, colorMid, colorRight);
      ctx.fillRect(x, y, barWidth, barHeight);

      // Peak Cap Dot
      const capY = Math.max(0, y - 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, capY, barWidth, 2);
    }
  }

  /**
   * 2. Double Mirror Spectrum (Top & Bottom Symmetrical Bars - Migrated from V1/V3)
   */
  static renderDoubleSpectrum(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const barCount = Math.max(8, Math.min(128, parseInt(config.barCount || 64, 10)));
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);

    const colorLeft = config.colorLeft || config.color1 || '#F43F5E';
    const colorRight = config.colorRight || config.color2 || '#8B5CF6';
    const midY = Math.round(h / 2);

    const barSpacing = Math.max(1, Math.floor(w / (barCount * 4)));
    const totalSpacing = barSpacing * (barCount - 1);
    const barWidth = Math.max(2, Math.floor((w - totalSpacing) / barCount));
    const startX = Math.round((w - (barWidth * barCount + totalSpacing)) / 2);

    for (let i = 0; i < barCount; i++) {
      const freqIdx = Math.floor((i / barCount) * rawFrequencies.length);
      const freqVal = (rawFrequencies[freqIdx] || 0) * gain;
      const halfHeight = Math.max(2, Math.round(freqVal * (h * 0.45)));

      const x = Math.round(startX + i * (barWidth + barSpacing));
      const topY = midY - halfHeight;
      const botY = midY;

      const grad = ctx.createLinearGradient(x, topY, x, midY + halfHeight);
      grad.addColorStop(0, colorLeft);
      grad.addColorStop(1, colorRight);
      ctx.fillStyle = grad;

      ctx.fillRect(x, topY, barWidth, halfHeight * 2);
    }
  }

  /**
   * 3. Circular Pulse (Radial Ring & Audio Rays)
   */
  static renderCircularPulse(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const colorLeft = config.colorLeft || config.color1 || '#06B6D4';
    const colorRight = config.colorRight || config.color2 || '#EC4899';
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);

    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    const baseRadius = Math.round(Math.min(w, h) * 0.22);
    const bassEnergy = (audio.bass || audio.energy || 0.5) * gain;
    const pulseRadius = Math.round(baseRadius + bassEnergy * 25);

    // 1. Center Glow Circle
    const grad = ctx.createRadialGradient(cx, cy, Math.round(pulseRadius * 0.2), cx, cy, pulseRadius);
    grad.addColorStop(0, colorLeft);
    grad.addColorStop(0.8, colorRight);
    grad.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 2. Radial Rays
    const rayCount = Math.max(24, Math.min(96, parseInt(config.barCount || 48, 10)));
    const maxRayLength = Math.round(Math.min(w, h) * 0.25);

    ctx.lineWidth = Math.max(2, Math.round((Math.PI * 2 * pulseRadius) / (rayCount * 2.5)));
    ctx.strokeStyle = colorRight;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const freqIdx = Math.floor((i / rayCount) * rawFrequencies.length);
      const freqVal = (rawFrequencies[freqIdx] || 0.1) * gain;
      const rayLen = Math.round(freqVal * maxRayLength);

      const x1 = Math.round(cx + Math.cos(angle) * (pulseRadius + 4));
      const y1 = Math.round(cy + Math.sin(angle) * (pulseRadius + 4));
      const x2 = Math.round(cx + Math.cos(angle) * (pulseRadius + 4 + rayLen));
      const y2 = Math.round(cy + Math.sin(angle) * (pulseRadius + 4 + rayLen));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  /**
   * 4. Radial Mirror Ring Wave (Migrated from V2/V3)
   */
  static renderRadialWave(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const colorLeft = config.colorLeft || config.color1 || '#10B981';
    const colorRight = config.colorRight || config.color2 || '#6366F1';
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);

    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    const radius = Math.round(Math.min(w, h) * 0.25);
    const points = rawFrequencies.length || 64;

    ctx.strokeStyle = colorLeft;
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const idx = i % points;
      const angle = (idx / points) * Math.PI * 2;
      const val = (rawFrequencies[idx] || 0) * gain;
      const r = radius + val * 60;
      const x = Math.round(cx + Math.cos(angle) * r);
      const y = Math.round(cy + Math.sin(angle) * r);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * 5. Waveform Oscilloscope (Perspective Grid + Smooth Neon Wave)
   */
  static renderWaveformOscilloscope(ctx, w, h, audio, config) {
    const waveform = audio.waveform || new Float32Array(64);
    const colorLeft = config.colorLeft || config.color1 || '#10B981';
    const colorRight = config.colorRight || config.color2 || '#3B82F6';
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);

    const midY = Math.round(h / 2);
    const maxAmp = Math.round(h * 0.4 * gain);

    // 1. Center Guide Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // 2. Neon Waveform Line
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, colorLeft);
    grad.addColorStop(1, colorRight);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const step = w / (waveform.length - 1);
    for (let i = 0; i < waveform.length; i++) {
      const x = Math.round(i * step);
      const y = Math.round(midY + (waveform[i] || 0) * maxAmp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mirror Waveform
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < waveform.length; i++) {
      const x = Math.round(i * step);
      const y = Math.round(midY - (waveform[i] || 0) * (maxAmp * 0.5));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /**
   * 6. Particle Orbit (Orbital Galaxy Particles)
   */
  static renderParticleOrbit(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const colorLeft = config.colorLeft || config.color1 || '#8B5CF6';
    const colorRight = config.colorRight || config.color2 || '#EC4899';
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);

    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    const particleCount = 48;
    const time = (audio.time || 0) * 1.5;

    for (let i = 0; i < particleCount; i++) {
      const ringIdx = i % 3;
      const radiusBase = Math.round(Math.min(w, h) * (0.15 + ringIdx * 0.12));
      const freqIdx = Math.floor((i / particleCount) * rawFrequencies.length);
      const freqVal = (rawFrequencies[freqIdx] || 0.2) * gain;

      const angle = (i / particleCount) * Math.PI * 2 + time * (ringIdx === 1 ? -1 : 1);
      const r = Math.round(radiusBase + freqVal * 20);

      const x = Math.round(cx + Math.cos(angle) * r);
      const y = Math.round(cy + Math.sin(angle) * (r * 0.6));

      const size = Math.max(2, Math.round(3 + freqVal * 4));

      ctx.fillStyle = ringIdx === 0 ? colorLeft : (ringIdx === 1 ? colorRight : '#FFFFFF');
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Helper: Deterministic Gradient Generator
   */
  static getGradientOrColor(ctx, x, y, bw, bh, index, total, colorMode, c1, c2, c3) {
    if (colorMode === 'Solid') return c1;

    if (colorMode === '3 Gradient') {
      const grad = ctx.createLinearGradient(x, y + bh, x, y);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c3);
      return grad;
    }

    if (colorMode === 'Rainbow') {
      const hue = Math.round((index / total) * 360);
      return `hsl(${hue}, 100%, 55%)`;
    }

    const grad = ctx.createLinearGradient(x, y + bh, x, y);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    return grad;
  }
}
