/**
 * VisualizerV5Core.js
 * Visualizer V5 Single Pure HTML5 Canvas 2D Engine
 * Single Source of Truth for rendering visualizer geometries across Live Editor & Backend Export.
 */

export class VisualizerV5Core {
  /**
   * Main Frame Renderer for Visualizer V5
   * @param {CanvasRenderingContext2D} ctx      Canvas 2D context
   * @param {number} width                       Width of bounding box
   * @param {number} height                      Height of bounding box
   * @param {Object} audioState                  Audio / FFT state object
   * @param {Object} config                      Visualizer object configuration
   */
  static renderFrame(ctx, width, height, audioState = {}, config = {}) {
    if (!ctx || width <= 0 || height <= 0) return;

    ctx.save();

    // 1. Apply Opacity
    if (config.opacity !== undefined) {
      ctx.globalAlpha = Math.min(1.0, Math.max(0.0, config.opacity / 100));
    }

    // 2. Resolve Colors
    const primaryColor = config.primaryColor || config.colorLeft || '#00F2FE';
    const secondaryColor = config.secondaryColor || config.colorRight || '#4FACFE';
    const accentColor = config.accentColor || config.colorMid || '#AB55F7';

    // 3. Resolve Preset Style
    const styleStr = String(config.mode || config.style || config.preset || 'spectrum-bars').toLowerCase();

    // 4. Delegate to Style Renderer
    if (styleStr.includes('circular') || styleStr.includes('circle') || styleStr.includes('pulse')) {
      this.renderCircularPulse(ctx, width, height, audioState, primaryColor, secondaryColor, config);
    } else if (styleStr.includes('wave') || styleStr.includes('cyberpunk') || styleStr.includes('line')) {
      this.renderCyberpunkWaveform(ctx, width, height, audioState, primaryColor, secondaryColor, config);
    } else if (styleStr.includes('particle') || styleStr.includes('orbit')) {
      this.renderParticleOrbit(ctx, width, height, audioState, primaryColor, secondaryColor, accentColor, config);
    } else if (styleStr.includes('avee')) {
      this.renderAveeSpectrum(ctx, width, height, audioState, primaryColor, secondaryColor, config);
    } else {
      // Default: Spectrum Bars
      this.renderSpectrumBars(ctx, width, height, audioState, primaryColor, secondaryColor, config);
    }

    ctx.restore();
  }

  /**
   * Style 1: Spectrum Bars (Classic / Mirrored Bottom-Up Bars)
   */
  static renderSpectrumBars(ctx, width, height, audioState, primaryColor, secondaryColor, config) {
    const freqs = audioState.frequencies || new Float32Array(64);
    const barCount = Math.max(8, Math.min(128, parseInt(config.barCount) || freqs.length || 64));
    const step = width / barCount;
    const spacing = parseInt(config.spacing) || 4;
    const barWidth = Math.max(2, step - spacing);
    const cornerRadius = parseInt(config.cornerRadius) || 4;

    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, primaryColor);
    grad.addColorStop(1, secondaryColor);
    ctx.fillStyle = grad;

    for (let i = 0; i < barCount; i++) {
      const val = freqs[i % freqs.length] || 0.05;
      const barH = Math.round(Math.max(4, val * (height * 0.88)));
      const x = Math.round(i * step + (spacing / 2));
      const y = Math.round(height - barH);

      if (cornerRadius > 0 && typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [cornerRadius, cornerRadius, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barH);
      }
    }
  }

  /**
   * Style 2: Circular Pulse (Bass-Pulsing Core with Radial Frequency Rays)
   */
  static renderCircularPulse(ctx, width, height, audioState, primaryColor, secondaryColor, config) {
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);
    const baseRadius = minDim * 0.22;

    const energy = audioState.energy || 0.3;
    const bass = audioState.bass || energy;
    const pulseRadius = baseRadius * (1.0 + bass * 0.35);

    // Inner Glowing Core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
    coreGrad.addColorStop(0, primaryColor);
    coreGrad.addColorStop(0.75, secondaryColor);
    coreGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Outer Radial Frequency Bars
    const freqs = audioState.frequencies || new Float32Array(64);
    const rayCount = Math.max(16, Math.min(128, parseInt(config.barCount) || freqs.length || 64));
    const angleStep = (Math.PI * 2) / rayCount;
    const maxRayLen = minDim * 0.25;

    ctx.lineWidth = Math.max(2, parseInt(config.thickness) || 3);

    for (let i = 0; i < rayCount; i++) {
      const angle = i * angleStep;
      const val = freqs[i % freqs.length] || 0.05;
      const rayLen = val * maxRayLen;

      const x1 = cx + Math.cos(angle) * pulseRadius;
      const y1 = cy + Math.sin(angle) * pulseRadius;
      const x2 = cx + Math.cos(angle) * (pulseRadius + rayLen);
      const y2 = cy + Math.sin(angle) * (pulseRadius + rayLen);

      const ratio = i / rayCount;
      ctx.strokeStyle = ratio < 0.5 ? primaryColor : secondaryColor;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  /**
   * Style 3: Cyberpunk Waveform (Dual Symmetric Neon Oscilloscope Waves)
   */
  static renderCyberpunkWaveform(ctx, width, height, audioState, primaryColor, secondaryColor, config) {
    const wave = audioState.waveform || new Float32Array(64);
    const count = wave.length || 64;
    const midY = height / 2;
    const maxAmp = height * 0.38;

    ctx.lineWidth = Math.max(2, parseInt(config.thickness) || 4);

    // Upper Wave (Primary Color)
    ctx.strokeStyle = primaryColor;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const x = (i / (count - 1)) * width;
      const y = midY - (wave[i] || 0) * maxAmp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Lower Wave (Secondary Color)
    ctx.strokeStyle = secondaryColor;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const x = (i / (count - 1)) * width;
      const y = midY + (wave[i] || 0) * maxAmp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /**
   * Style 4: Particle Orbit (Orbital Particles Spinning Around Center Core)
   */
  static renderParticleOrbit(ctx, width, height, audioState, primaryColor, secondaryColor, accentColor, config) {
    const cx = width / 2;
    const cy = height / 2;
    const t = audioState.time || 0;
    const energy = audioState.energy || 0.4;
    const minDim = Math.min(width, height);

    const particleCount = Math.max(16, Math.min(96, parseInt(config.barCount) || 48));

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + t * 1.8;
      const orbitRadius = minDim * (0.18 + 0.16 * Math.sin(i * 0.6 + t * 2.5) + energy * 0.12);

      const px = cx + Math.cos(angle) * orbitRadius;
      const py = cy + Math.sin(angle) * orbitRadius;
      const radius = 3 + (i % 4) * 2;

      ctx.fillStyle = i % 3 === 0 ? primaryColor : (i % 3 === 1 ? secondaryColor : accentColor);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Style 5: Avee Spectrum (High-Density Multi-Gradient Avee Bars)
   */
  static renderAveeSpectrum(ctx, width, height, audioState, primaryColor, secondaryColor, config) {
    const freqs = audioState.frequencies || new Float32Array(64);
    const barCount = Math.max(16, Math.min(128, parseInt(config.barCount) || 64));
    const step = width / barCount;
    const spacing = 2;
    const barWidth = Math.max(1, step - spacing);

    for (let i = 0; i < barCount; i++) {
      const val = freqs[i % freqs.length] || 0.05;
      const barH = Math.round(Math.max(3, val * (height * 0.85)));
      const x = Math.round(i * step);
      const y = Math.round(height - barH);

      const grad = ctx.createLinearGradient(x, height, x, y);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, secondaryColor);

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barH);

      // Peak Cap Bar
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, Math.max(0, y - 4), barWidth, 2);
    }
  }
}
