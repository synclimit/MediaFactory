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
    ctx.clearRect(0, 0, w, h);
    const mode = (config.mode || config.style || 'spectrum-bars').toLowerCase();

    if (mode.includes('headphone') || mode.includes('jocker')) {
      this.renderHeadphoneRing(ctx, w, h, audioState, config);
    } else if (mode.includes('ecg') || mode.includes('heartbeat') || mode.includes('ink')) {
      this.renderEcgHeartbeat(ctx, w, h, audioState, config);
    } else if (mode.includes('glitch') || mode.includes('rgb') || mode.includes('chromatic')) {
      this.renderRgbGlitchBadge(ctx, w, h, audioState, config);
    } else if (mode.includes('tunnel') || mode.includes('3d') || mode.includes('matrix')) {
      this.render3dNeonTunnel(ctx, w, h, audioState, config);
    } else if (mode.includes('sawtooth') || mode.includes('polygon') || mode.includes('serrated')) {
      this.renderSawtoothPolygon(ctx, w, h, audioState, config);
    } else if (mode.includes('flame') || mode.includes('fire') || mode.includes('burn')) {
      this.renderFlameRing(ctx, w, h, audioState, config);
    } else if (mode.includes('crosshair') || mode.includes('axis') || mode.includes('dot-matrix')) {
      this.renderCrosshairDots(ctx, w, h, audioState, config);
    } else if (mode.includes('capsule') || mode.includes('pill')) {
      this.renderCapsulePills(ctx, w, h, audioState, config);
    } else if (mode.includes('fountain') || mode.includes('dust') || mode.includes('side-fountain')) {
      this.renderDustFountainBottomBar(ctx, w, h, audioState, config);
    } else if (mode.includes('liquid') || mode.includes('fluid') || mode.includes('neon-wave')) {
      this.renderNeonLiquidWave(ctx, w, h, audioState, config);
    } else if (mode.includes('kinetic') || mode.includes('shockwave')) {
      this.renderKineticPulseRing(ctx, w, h, audioState, config);
    } else if (mode.includes('double') || mode.includes('mirror') || mode.includes('split')) {
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
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
   * 7. Neon Liquid Wave (Ultra-Smooth Fluid Bezier Wave with Glowing Neon Aura)
   */
  static renderNeonLiquidWave(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const colorLeft = config.colorLeft || config.color1 || '#EC4899';
    const colorRight = config.colorRight || config.color2 || '#8B5CF6';
    const colorMid = config.colorMid || '#06B6D4';
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);
    const time = (audio.time || 0) * 2;

    const midY = Math.round(h * 0.65);
    const pointsCount = 16;
    const stepX = w / (pointsCount - 1);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, colorLeft);
    grad.addColorStop(0.5, colorMid);
    grad.addColorStop(1, colorRight);

    ctx.save();

    // 1. Fill Fluid Body
    ctx.beginPath();
    ctx.moveTo(0, h);

    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      const freqIdx = Math.floor((i / pointsCount) * rawFrequencies.length);
      const freqVal = (rawFrequencies[freqIdx] || 0.1) * gain;
      const waveOffset = Math.sin(time + i * 0.5) * 15;
      const y = midY - (freqVal * (h * 0.45) + waveOffset);
      const x = i * stepX;
      points.push({ x, y });
    }

    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(w, h);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.45;
    ctx.fill();

    // 2. Neon Contour Stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 8. Kinetic Pulse Ring & Shockwave
   */
  static renderKineticPulseRing(ctx, w, h, audio, config) {
    const rawFrequencies = audio.frequencies || new Float32Array(64);
    const colorLeft = config.colorLeft || config.color1 || '#F59E0B';
    const colorRight = config.colorRight || config.color2 || '#EF4444';
    const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);

    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    const baseRadius = Math.round(Math.min(w, h) * 0.2);
    const bass = (audio.bass || audio.energy || 0.4) * gain;
    const pulseR = Math.round(baseRadius + bass * 35);

    // Shockwave Rings
    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      const shockR = pulseR + ((audio.time * 80 + r * 45) % 120);
      const alpha = Math.max(0, 1 - (shockR - baseRadius) / 120);
      ctx.beginPath();
      ctx.arc(cx, cy, shockR, 0, Math.PI * 2);
      ctx.strokeStyle = colorLeft;
      ctx.globalAlpha = alpha * 0.6;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // Center Core Ring
    const grad = ctx.createLinearGradient(cx - pulseR, cy - pulseR, cx + pulseR, cy + pulseR);
    grad.addColorStop(0, colorLeft);
    grad.addColorStop(1, colorRight);

    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = grad;
    ctx.stroke();

    // Spiked Frequency Rays
    const rayCount = 64;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const freqIdx = Math.floor((i / rayCount) * rawFrequencies.length);
      const val = (rawFrequencies[freqIdx] || 0.1) * gain;
      const len = Math.round(val * 70);

      const x1 = Math.round(cx + Math.cos(angle) * (pulseR + 6));
      const y1 = Math.round(cy + Math.sin(angle) * (pulseR + 6));
      const x2 = Math.round(cx + Math.cos(angle) * (pulseR + 6 + len));
      const y2 = Math.round(cy + Math.sin(angle) * (pulseR + 6 + len));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = i % 2 === 0 ? colorLeft : colorRight;
      ctx.stroke();
    }
  }

  /**
   * 9. Neon Headphone Ring Arc (Screenshots 1 & 4)
   */
  static renderHeadphoneRing(ctx, w, h, audio, config) {
    const cx = w / 2;
    const cy = h / 2 - 10;
    const radius = Math.min(w, h) * 0.22;
    const energy = audio.energy || 0.2;
    const gain = Math.max(0.1, parseFloat(config.gain || 100) / 100);
    const colorLeft = config.colorLeft || '#00F2FE';
    const colorRight = config.colorRight || '#4FACFE';

    // 1. Headphone Arc Headband
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineWidth = 8;
    ctx.strokeStyle = colorLeft;
    ctx.shadowColor = colorLeft;
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Ear Cups
    const leftCupX = cx + Math.cos(Math.PI * 0.85) * radius;
    const leftCupY = cy + Math.sin(Math.PI * 0.85) * radius;
    const rightCupX = cx + Math.cos(Math.PI * 2.15) * radius;
    const rightCupY = cy + Math.sin(Math.PI * 2.15) * radius;

    ctx.fillStyle = colorRight;
    ctx.beginPath();
    ctx.arc(leftCupX, leftCupY, 12 + energy * 6, 0, Math.PI * 2);
    ctx.arc(rightCupX, rightCupY, 12 + energy * 6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Headband Outer Frequency Rays
    const freqs = audio.frequencies || new Float32Array(32);
    const rayCount = 32;
    for (let i = 0; i < rayCount; i++) {
      const angle = Math.PI * 0.85 + (i / (rayCount - 1)) * (Math.PI * 1.3);
      const val = (freqs[i % freqs.length] || 0.1) * gain;
      const rayLen = 10 + val * 50;
      const x1 = cx + Math.cos(angle) * (radius + 8);
      const y1 = cy + Math.sin(angle) * (radius + 8);
      const x2 = cx + Math.cos(angle) * (radius + 8 + rayLen);
      const y2 = cy + Math.sin(angle) * (radius + 8 + rayLen);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = i % 2 === 0 ? colorLeft : colorRight;
      ctx.stroke();
    }

    // 3. Time Display inside Headphone
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0:25', cx, cy + 5);

    // 4. Bottom Horizontal Equalizer Waveform
    const waveY = h - 25;
    const waveWidth = 200;
    const startX = cx - waveWidth / 2;
    for (let i = 0; i < 24; i++) {
      const val = (freqs[i % freqs.length] || 0.1) * gain;
      const barH = 4 + val * 24;
      const bx = startX + i * 8;
      ctx.fillStyle = colorLeft;
      ctx.fillRect(bx, waveY - barH / 2, 5, barH);
    }
    ctx.restore();
  }

  /**
   * 10. ECG Heartbeat Ink Waveform (Screenshot 3)
   */
  static renderEcgHeartbeat(ctx, w, h, audio, config) {
    const cy = h / 2;
    const freqs = audio.frequencies || new Float32Array(64);
    const energy = audio.energy || 0.2;
    const color = config.colorLeft || '#FF3366';

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, cy);

    const step = w / 64;
    for (let i = 0; i < 64; i++) {
      const x = i * step;
      let y = cy;
      const val = freqs[i] || 0;
      // Inject ECG Spike Patterns
      if (i % 16 === 7) y -= val * (h * 0.45);
      else if (i % 16 === 8) y += val * (h * 0.35);
      else if (i % 16 === 9) y -= val * (h * 0.15);
      else y += (Math.sin(i * 0.5 + audio.time * 4) * 5) * (1 + val);

      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Ink Particle Drops
    const particleCount = 20;
    for (let p = 0; p < particleCount; p++) {
      const px = (p / particleCount) * w + Math.sin(audio.time * 2 + p) * 10;
      const py = cy + Math.sin(audio.time * 5 + p * 3) * (energy * 40);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 2 + (p % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * 11. RGB Glitch Chromatic Badge (Screenshot 5)
   */
  static renderRgbGlitchBadge(ctx, w, h, audio, config) {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.25;
    const energy = audio.energy || 0.2;
    const glitchOffset = (Math.random() < 0.3 ? (Math.random() - 0.5) * 12 : 2) * energy;

    ctx.save();

    // Red Channel Offset
    ctx.beginPath();
    ctx.arc(cx - glitchOffset, cy, radius + energy * 15, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.85)';
    ctx.stroke();

    // Cyan Channel Offset
    ctx.beginPath();
    ctx.arc(cx + glitchOffset, cy, radius + energy * 15, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
    ctx.stroke();

    // Main White Ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + energy * 10, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Badge Title Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'black 22px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUDIO', cx, cy + 8);
    ctx.restore();
  }

  /**
   * 12. 3D Cyber Neon Tunnel (Screenshot 6)
   */
  static render3dNeonTunnel(ctx, w, h, audio, config) {
    const cx = w / 2;
    const cy = h / 2;
    const energy = audio.energy || 0.2;
    const color = config.colorLeft || '#00F2FE';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Converging 3D Perspective Lines
    const cornerX = [0, w, w, 0];
    const cornerY = [0, 0, h, h];
    for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cornerX[c], cornerY[c]);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Concentric Perspective Frames
    const frameCount = 6;
    for (let f = 0; f < frameCount; f++) {
      const progress = ((audio.time * 1.5 + f / frameCount) % 1);
      const fw = w * progress * (1 + energy * 0.3);
      const fh = h * progress * (1 + energy * 0.3);
      const fx = cx - fw / 2;
      const fy = cy - fh / 2;

      ctx.lineWidth = 2 + progress * 3;
      ctx.strokeRect(fx, fy, fw, fh);
    }
    ctx.restore();
  }

  /**
   * 13. Serrated Sawtooth Polygon Ring (Screenshot 8)
   */
  static renderSawtoothPolygon(ctx, w, h, audio, config) {
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.22;
    const freqs = audio.frequencies || new Float32Array(48);
    const gain = Math.max(0.1, parseFloat(config.gain || 100) / 100);
    const color = config.colorLeft || '#00F2FE';

    ctx.save();
    ctx.beginPath();
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const val = (freqs[i % freqs.length] || 0.1) * gain;
      const r = baseRadius + (i % 2 === 0 ? val * 45 : -val * 10);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 14. Fiery Flame Audio Ring (Screenshot 9)
   */
  static renderFlameRing(ctx, w, h, audio, config) {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.22;
    const freqs = audio.frequencies || new Float32Array(32);
    const energy = audio.energy || 0.2;

    ctx.save();
    // Fire Outer Ring
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const val = (freqs[i] || 0.1) * 40;
      const flameHeight = 15 + val * (1 + energy);
      const fx = cx + Math.cos(angle) * (radius + flameHeight);
      const fy = cy + Math.sin(angle) * (radius + flameHeight);

      const grad = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius + flameHeight + 10);
      grad.addColorStop(0, '#FFCC00');
      grad.addColorStop(0.5, '#FF3300');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, 8 + val * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center Core
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FF9900';
    ctx.shadowColor = '#FF3300';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 15. Minimalist Crosshair Axis + Floating Dots (Screenshot 10)
   */
  static renderCrosshairDots(ctx, w, h, audio, config) {
    const cx = w / 2;
    const cy = h / 2;
    const freqs = audio.frequencies || new Float32Array(16);
    const color = config.colorLeft || '#FFFFFF';

    ctx.save();
    // Vertical Axis Pill
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy - 70, 10, 140, 5);
    ctx.fill();

    // Horizontal Floating Dots
    for (let i = 0; i < 8; i++) {
      const val = (freqs[i] || 0.1) * 35;
      const offsetX = 25 + i * 14 + val;
      const dotR = 4 + (i % 2 === 0 ? 2 : 0);

      // Right dots
      ctx.beginPath();
      ctx.arc(cx + offsetX, cy, dotR, 0, Math.PI * 2);
      ctx.fill();

      // Left dots
      ctx.beginPath();
      ctx.arc(cx - offsetX, cy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * 16. Neon Capsule Pill Waves (Screenshot 11)
   */
  static renderCapsulePills(ctx, w, h, audio, config) {
    const freqs = audio.frequencies || new Float32Array(16);
    const count = 7;
    const cx = w / 2;
    const cy = h / 2;
    const color = config.colorLeft || '#F59E0B';

    ctx.save();
    const pillW = 28;
    const totalW = count * (pillW + 12);
    const startX = cx - totalW / 2;

    for (let i = 0; i < count; i++) {
      const val = (freqs[i * 2] || 0.1);
      const pillH = 30 + val * (h * 0.45);
      const px = startX + i * (pillW + 12);
      const py = cy - pillH / 2;

      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(px, py, pillW, pillH, pillW / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * 17. Dual Side Dust Fountains + Bottom Capsule Bar (Screenshot 13)
   */
  static renderDustFountainBottomBar(ctx, w, h, audio, config) {
    const freqs = audio.frequencies || new Float32Array(32);
    const energy = audio.energy || 0.2;
    const color = config.colorLeft || '#10B981';

    ctx.save();
    // 1. Left & Right Fountain Dust Particles
    const dustCount = 40;
    for (let d = 0; d < dustCount; d++) {
      const isLeft = d % 2 === 0;
      const fx = isLeft ? 40 + Math.sin(d) * 30 : w - 40 - Math.sin(d) * 30;
      const fy = h - ((audio.time * 120 + d * 25) % h);
      const r = 2 + (d % 4);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Bottom Center Capsule Equalizer Bar
    const barW = 260;
    const startX = w / 2 - barW / 2;
    const waveY = h - 35;
    for (let i = 0; i < 30; i++) {
      const val = (freqs[i] || 0.1);
      const hVal = 4 + val * 24;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(startX + i * 8.5, waveY - hVal / 2, 5, hVal);
    }
    ctx.restore();
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
