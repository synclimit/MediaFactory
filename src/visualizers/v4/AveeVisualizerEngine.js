/**
 * AveeVisualizerEngine.js
 * 
 * Complete Avee Spectrum Visualizer Engine for MediaFactory M3
 * Contains all 124 visualizer renderers and presets across 6 categories:
 * - 🎚️ Bars (24)
 * - 🌊 Wave (20)
 * - 🔵 Ring / Circle (20)
 * - 🪣 Liquid (20)
 * - ⭐ Line / Dot Matrix (20)
 * - ✨ Particle / Blob (20)
 */

// Persistent peak cache for peak cap bars
const peakCapsCache = new Map();

// ============================================================
// 1. BARS RENDERERS (24)
// ============================================================
export const BARS_RENDERERS = {
  round_cap_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    ctx.fillStyle = cfg.color || '#FF6EC7';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255;
      const barH = Math.max(amp * h * 0.85, barW);
      const x = i * (barW + gap), y = h - barH;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, barW / 2);
      ctx.fill();
    }
  },
  mirror_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap, cy = h / 2;
    ctx.fillStyle = cfg.color || '#00E5FF';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255;
      const halfH = amp * cy * 0.9;
      const x = i * (barW + gap);
      ctx.beginPath();
      ctx.roundRect(x, cy - halfH, barW, halfH * 2, barW / 2);
      ctx.fill();
    }
  },
  circle_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cx = w / 2, cy = h / 2;
    const inR = cfg.innerRadius || Math.min(w, h) * 0.15;
    const maxLen = cfg.maxBarLength || Math.min(w, h) * 0.25;
    const step = (Math.PI * 2) / n;
    ctx.strokeStyle = cfg.color || '#FF8A00';
    ctx.lineWidth = cfg.barWidth || 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, len = amp * maxLen;
      const a = i * step - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inR, cy + Math.sin(a) * inR);
      ctx.lineTo(cx + Math.cos(a) * (inR + len), cy + Math.sin(a) * (inR + len));
      ctx.stroke();
    }
  },
  gradient_glow_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 3, barW = (w / n) - gap;
    const cBot = cfg.colorBottom || '#8A2BE2', cTop = cfg.colorTop || '#00FFF0';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = Math.max(amp * h * 0.85, 4);
      const x = i * (barW + gap), y = h - barH;
      const grad = ctx.createLinearGradient(0, h, 0, y);
      grad.addColorStop(0, cBot);
      grad.addColorStop(1, cTop);
      ctx.save();
      ctx.shadowColor = cTop;
      ctx.shadowBlur = 12;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, barW / 2);
      ctx.fill();
      ctx.restore();
    }
  },
  peak_cap_bar: (ctx, fft, cfg, w, h, t, objId = 'def') => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    let peaks = peakCapsCache.get(objId);
    if (!peaks || peaks.length !== n) {
      peaks = new Float32Array(n);
      peakCapsCache.set(objId, peaks);
    }
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = amp * h * 0.82;
      const x = i * (barW + gap);
      if (barH >= peaks[i]) peaks[i] = barH;
      else peaks[i] = Math.max(0, peaks[i] - 1.6);
      ctx.fillStyle = cfg.barColor || '#00E5FF';
      ctx.fillRect(x, h - barH, barW, barH);
      ctx.fillStyle = cfg.capColor || '#FFFFFF';
      ctx.fillRect(x, h - peaks[i] - 4, barW, 4);
    }
  },
  stacked_blocks_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    const blockH = cfg.blockH || 6, blockGap = cfg.blockGap || 2, unit = blockH + blockGap;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, totalH = amp * h * 0.82;
      const blocks = Math.floor(totalH / unit), x = i * (barW + gap);
      for (let b = 0; b < blocks; b++) {
        const ratio = b / Math.max(blocks, 1);
        ctx.fillStyle = `rgb(${Math.floor(255 * ratio)},${Math.floor(200 * (1 - ratio))},80)`;
        ctx.fillRect(x, h - (b + 1) * unit, barW, blockH);
      }
    }
  },
  thin_line_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 1, barW = (w / n) - gap, baseY = h * 0.92;
    ctx.strokeStyle = cfg.color || '#FFFFFF';
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = amp * h * 0.80, x = i * (barW + gap);
      ctx.beginPath();
      ctx.moveTo(x + barW / 2, baseY);
      ctx.lineTo(x + barW / 2, baseY - barH);
      ctx.stroke();
    }
  },
  twin_flame_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, slotW = w / n, barW = slotW * 0.38, gap = slotW * 0.06;
    for (let i = 0; i < n; i++) {
      const hA = (fft[i] / 255) * h * 0.82;
      const hB = (fft[Math.max(0, i - 1)] / 255) * h * 0.82;
      const slotX = i * slotW;
      ctx.fillStyle = cfg.colorA || '#FF6EC7';
      ctx.fillRect(slotX, h - hA, barW, hA);
      ctx.fillStyle = cfg.colorB || '#00E5FF';
      ctx.fillRect(slotX + barW + gap, h - hB, barW, hB);
    }
  },
  skyscraper_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 3, barW = (w / n) - gap;
    ctx.fillStyle = cfg.color || '#FFD700';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = amp * h * 0.82, x = i * (barW + gap);
      const topW = Math.max(barW * 0.25, barW * (1 - amp * 0.7)), xOff = (barW - topW) / 2;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + barW, h);
      ctx.lineTo(x + barW - xOff, h - barH);
      ctx.lineTo(x + xOff, h - barH);
      ctx.closePath();
      ctx.fill();
    }
  },
  waveform_fill: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2, stepX = w / n;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    for (let i = 0; i < n; i++) {
      ctx.lineTo(i * stepX, cy - (fft[i] / 255) * cy * 0.88);
    }
    ctx.lineTo(w, cy);
    for (let i = n - 1; i >= 0; i--) {
      ctx.lineTo(i * stepX, cy + (fft[i] / 255) * cy * 0.88);
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, cfg.colorTop || 'rgba(0,229,255,0.85)');
    grad.addColorStop(0.5, cfg.colorMid || 'rgba(100,0,255,0.5)');
    grad.addColorStop(1, cfg.colorTop || 'rgba(0,229,255,0.85)');
    ctx.fillStyle = grad;
    ctx.fill();
  },
  equalizer_diamond: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, slotW = w / n, baseY = h * 0.9;
    ctx.fillStyle = cfg.color || '#FF4500';
    for (let i = 0; i < n; i++) {
      const halfH = (fft[i] / 255) * h * 0.4, halfW = slotW * 0.4;
      const cx = i * slotW + slotW / 2, cy = baseY - halfH;
      ctx.beginPath();
      ctx.moveTo(cx, cy - halfH);
      ctx.lineTo(cx + halfW, cy);
      ctx.lineTo(cx, cy + halfH);
      ctx.lineTo(cx - halfW, cy);
      ctx.closePath();
      ctx.fill();
    }
  },
  horizontal_side_bars: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barH = (h / n) - gap;
    for (let i = 0; i < n; i++) {
      const barW = (fft[i] / 255) * w * 0.88, y = i * (barH + gap);
      const grad = ctx.createLinearGradient(0, 0, barW, 0);
      grad.addColorStop(0, cfg.colorLeft || '#8A2BE2');
      grad.addColorStop(1, cfg.colorRight || '#00FFF0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, barW, barH);
    }
  },
  v_arch_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap, midI = n / 2;
    ctx.fillStyle = cfg.color || '#76FF03';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, vMult = Math.abs(i - midI) / midI;
      const barH = (amp * 0.3 + vMult * amp * 0.6) * h * 0.88;
      ctx.fillRect(i * (barW + gap), h - barH, barW, barH);
    }
  },
  color_shift_hue_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = amp * h * 0.82;
      ctx.fillStyle = `hsl(${Math.floor(amp * 270)}, 100%, 55%)`;
      ctx.fillRect(i * (barW + gap), h - barH, barW, barH);
    }
  },
  pixel_mosaic_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, pixW = Math.max(1, Math.floor((w / n) - 1)), pixH = cfg.pixH || 8, gap = 1;
    for (let i = 0; i < n; i++) {
      const barH = (fft[i] / 255) * h * 0.82, x = i * (pixW + gap), rows = Math.floor(barH / (pixH + gap));
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = `hsl(${200 + (r / Math.max(rows, 1)) * 140}, 100%, 55%)`;
        ctx.fillRect(x, h - (r + 1) * (pixH + gap), pixW, pixH);
      }
    }
  },
  staircase_descent_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    ctx.fillStyle = cfg.color || '#FF9100';
    for (let i = 0; i < n; i++) {
      const offset = (i / n) * h * 0.25;
      const barH = Math.max(0, (fft[i] / 255) * h * 0.75 - offset);
      ctx.fillRect(i * (barW + gap), h - barH, barW, barH);
    }
  },
  spine_rib_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, ribH = (h / n) - gap, cx = w / 2;
    for (let i = 0; i < n; i++) {
      const ribW = (fft[i] / 255) * w * 0.44, y = i * (ribH + gap) + ribH / 2;
      const gL = ctx.createLinearGradient(cx - ribW, 0, cx, 0);
      gL.addColorStop(0, 'rgba(0,229,255,0)');
      gL.addColorStop(1, cfg.color || '#00E5FF');
      ctx.fillStyle = gL;
      ctx.fillRect(cx - ribW, y, ribW, ribH);
      const gR = ctx.createLinearGradient(cx, 0, cx + ribW, 0);
      gR.addColorStop(0, cfg.color || '#00E5FF');
      gR.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = gR;
      ctx.fillRect(cx, y, ribW, ribH);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(cx - 1, 0, 2, h);
  },
  fog_mountain_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 1, barW = (w / n) - gap;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = amp * h * 0.85, x = i * (barW + gap), topY = h - barH;
      const grad = ctx.createLinearGradient(x, topY, x, h);
      grad.addColorStop(0, 'rgba(100,200,255,0)');
      grad.addColorStop(0.5, `rgba(50,150,255,${amp * 0.6})`);
      grad.addColorStop(1, `rgba(0,80,180,${amp * 0.95})`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, topY, barW, barH);
    }
  },
  neon_outline_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 3, barW = (w / n) - gap, color = cfg.color || '#39FF14';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    for (let i = 0; i < n; i++) {
      const barH = Math.max((fft[i] / 255) * h * 0.82, 4);
      ctx.strokeRect(i * (barW + gap), h - barH, barW, barH);
    }
    ctx.shadowBlur = 0;
  },
  dual_band_split_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap, mid = h / 2, half = Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, x = i * (barW + gap);
      if (i < half) {
        const barH = amp * mid * 0.88;
        const grad = ctx.createLinearGradient(0, 0, 0, mid);
        grad.addColorStop(0, '#FF6EC7');
        grad.addColorStop(1, 'rgba(255,110,199,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, barW, barH);
      } else {
        const barH = amp * mid * 0.88;
        const grad = ctx.createLinearGradient(0, h, 0, h - barH);
        grad.addColorStop(0, '#00FFF0');
        grad.addColorStop(1, 'rgba(0,255,240,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, h - barH, barW, barH);
      }
    }
  },
  bass_pulse_big_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap, bassAmp = fft[0] / 255;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, w, h);
    const bigW = w * 0.18 * (0.5 + bassAmp * 0.5), bigH = h * 0.7 * bassAmp;
    ctx.fillStyle = cfg.pulseColor || 'rgba(255,100,0,0.3)';
    ctx.fillRect(w / 2 - bigW / 2, h / 2 - bigH / 2, bigW, bigH);
    ctx.fillStyle = cfg.color || '#FF9100';
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.85;
      ctx.fillRect(i * (barW + gap), h - (fft[i] / 255) * h * 0.82, barW, (fft[i] / 255) * h * 0.82);
    }
    ctx.globalAlpha = 1;
  },
  waterfall_trail_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, barH = amp * h * 0.82, x = i * (barW + gap);
      const grad = ctx.createLinearGradient(x, h - barH, x, h);
      grad.addColorStop(0, 'rgba(0,255,180,0)');
      grad.addColorStop(0.4, `rgba(0,255,180,${amp * 0.5})`);
      grad.addColorStop(1, `rgba(0,150,255,${amp * 0.95})`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, h - barH, barW, barH);
    }
  },
  heartbeat_ecg_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, stepX = w / n, baseY = h * 0.75;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, x = i * stepX;
      ctx.lineTo(x + stepX * 0.1, baseY);
      ctx.lineTo(x + stepX * 0.3, baseY - amp * h * 0.65);
      ctx.lineTo(x + stepX * 0.45, baseY + amp * h * 0.12);
      ctx.lineTo(x + stepX * 0.6, baseY);
      ctx.lineTo(x + stepX, baseY);
    }
    ctx.strokeStyle = cfg.color || '#FF1744';
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  icicle_top_hang_bar: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, gap = 2, barW = (w / n) - gap;
    for (let i = 0; i < n; i++) {
      const barH = (fft[i] / 255) * h * 0.82, x = i * (barW + gap);
      const grad = ctx.createLinearGradient(x, 0, x, barH);
      grad.addColorStop(0, cfg.colorTop || '#B3E5FC');
      grad.addColorStop(0.7, cfg.colorMid || '#0288D1');
      grad.addColorStop(1, 'rgba(2,136,209,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, barW, barH);
      ctx.beginPath();
      ctx.moveTo(x, barH);
      ctx.lineTo(x + barW / 2, barH + barW * 0.8);
      ctx.lineTo(x + barW, barH);
      ctx.fillStyle = cfg.colorMid || '#0288D1';
      ctx.fill();
    }
  }
};

// ============================================================
// 2. WAVE RENDERERS (20)
// ============================================================
export const WAVE_RENDERERS = {
  wave_horizon_sine: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const progress = i / n, x = progress * w;
      const amp = (fft[Math.min(i, n - 1)] / 255) * (h * 0.42);
      const y = cy + Math.sin(progress * Math.PI * 6 + t * 3) * amp;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = cfg.color || '#00E5FF';
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  wave_filled_ocean: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.72;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let i = 0; i < n; i++) {
      const progress = i / n, x = progress * w, amp = (fft[i] / 255) * h * 0.35;
      ctx.lineTo(x, baseY - amp - Math.sin(progress * Math.PI * 4 + t * 2.5) * amp * 0.4);
    }
    ctx.lineTo(w, baseY);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, baseY - h * 0.35, 0, baseY);
    grad.addColorStop(0, cfg.colorTop || 'rgba(0,229,255,0.7)');
    grad.addColorStop(1, cfg.colorBot || 'rgba(0,80,180,0.9)');
    ctx.fillStyle = grad;
    ctx.fill();
  },
  wave_dual_mirror: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const progress = i / n, x = progress * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.38;
        const y = cy + sign * (amp + Math.sin(progress * Math.PI * 5 + t * 3) * amp * 0.3);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = sign === -1 ? (cfg.colorTop || '#FF6EC7') : (cfg.colorBot || '#00E5FF');
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  },
  wave_stacked_ribbon: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length;
    const lanes = [
      { y: h * 0.25, speed: 2.5, amp: 0.18, color: '#FF6EC7' },
      { y: h * 0.50, speed: 3.0, amp: 0.22, color: '#FFFFFF' },
      { y: h * 0.75, speed: 2.0, amp: 0.18, color: '#00E5FF' }
    ];
    lanes.forEach(lane => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const progress = i / n, x = progress * w, f = fft[Math.min(i, n - 1)] / 255;
        const y = lane.y + Math.sin(progress * Math.PI * 5 + t * lane.speed) * f * h * lane.amp;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lane.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
  },
  wave_sawtooth: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const progress = i / n, amp = (fft[i] / 255) * h * 0.42;
      const phase = ((progress * 12 + t * 2) % 1) * 2 - 1;
      const y = cy + phase * amp;
      i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
    }
    ctx.strokeStyle = cfg.color || '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  },
  wave_square_pwm: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    for (let i = 0; i < n; i++) {
      const progress = i / n, x = progress * w, amp = (fft[i] / 255) * h * 0.38;
      const duty = 0.4 + (fft[i] / 255) * 0.4, phase = (progress * 10 + t) % 1;
      const lvl = phase < duty ? -amp : amp;
      ctx.lineTo(x, cy + lvl);
      ctx.lineTo(x + (w / n), cy + lvl);
    }
    ctx.strokeStyle = cfg.color || '#00FF7F';
    ctx.lineWidth = 2;
    ctx.stroke();
  },
  wave_thin_hairline: (ctx, fft, cfg, w, h, t) => {
    const cy = h / 2;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const progress = x / w, fi = Math.floor(progress * (fft.length - 1));
      const amp = (fft[fi] / 255) * h * 0.45;
      const y = cy + Math.sin(progress * Math.PI * 8 + t * 4) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = cfg.color || '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  wave_stepped_quantized: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2, lvlH = (h * 0.42) / 12;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const progress = i / n, amp = (fft[i] / 255) * h * 0.42;
      const q = Math.round(amp / lvlH) * lvlH;
      i === 0 ? ctx.moveTo(progress * w, cy - q) : ctx.lineTo(progress * w, cy - q);
    }
    ctx.strokeStyle = cfg.color || '#FF4500';
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  wave_dot_path: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    ctx.fillStyle = cfg.color || '#00E5FF';
    for (let i = 0; i < n; i++) {
      const progress = i / n, amp = (fft[i] / 255) * h * 0.42;
      const y = cy + Math.sin(progress * Math.PI * 6 + t * 3.5) * amp;
      ctx.beginPath();
      ctx.arc(progress * w, y, 2 + (fft[i] / 255) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  wave_spike_telegraph: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.strokeStyle = cfg.color || '#FF1744';
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * w, amp = (fft[i] / 255) * h * 0.44;
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x, cy - amp);
      ctx.stroke();
    }
  },
  wave_inverted_v_peak: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.88, slotW = w / n;
    ctx.strokeStyle = cfg.color || '#76FF03';
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const x = i * slotW, amp = (fft[i] / 255) * h * 0.75;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + slotW / 2, baseY - amp);
      ctx.lineTo(x + slotW, baseY);
      ctx.stroke();
    }
  },
  wave_dual_color_split: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const progress = i / n, fi = Math.floor(progress * (n * 0.5 + n * 0.5));
      const y = cy - (fft[Math.min(fi, n - 1)] / 255) * h * 0.42;
      i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
    }
    ctx.strokeStyle = cfg.colorTop || '#FF6EC7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const progress = i / n, y = cy + (fft[i] / 255) * h * 0.42;
      i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
    }
    ctx.strokeStyle = cfg.colorBot || '#00E5FF';
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  wave_gradient_fill: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < n; i++) {
      const progress = i / n, amp = (fft[i] / 255) * h * 0.82;
      ctx.lineTo(progress * w, h - amp + Math.sin(progress * Math.PI * 3 + t * 2) * amp * 0.12);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, cfg.colorTop || 'rgba(214,0,255,0.9)');
    grad.addColorStop(0.5, cfg.colorMid || 'rgba(0,229,255,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();
  },
  wave_thick_stroke: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    for (let i = 0; i < n - 1; i++) {
      const t1 = i / n, t2 = (i + 1) / n;
      const y1 = cy + Math.sin(t1 * Math.PI * 5 + t * 3) * (fft[i] / 255) * h * 0.40;
      const y2 = cy + Math.sin(t2 * Math.PI * 5 + t * 3) * (fft[i + 1] / 255) * h * 0.40;
      ctx.strokeStyle = cfg.color || '#FF9100';
      ctx.lineWidth = 1 + (fft[i] / 255) * 14;
      ctx.beginPath();
      ctx.moveTo(t1 * w, y1);
      ctx.lineTo(t2 * w, y2);
      ctx.stroke();
    }
  },
  wave_echo_decay: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    const echoes = [{ off: 0, a: 0.9, lw: 3 }, { off: 0.07, a: 0.45, lw: 2 }, { off: 0.14, a: 0.18, lw: 1.5 }];
    echoes.forEach(e => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const progress = i / n, y = cy + Math.sin((progress + e.off) * Math.PI * 6 + t * 3) * (fft[i] / 255) * h * 0.40;
        i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
      }
      ctx.strokeStyle = `rgba(0,229,255,${e.a})`;
      ctx.lineWidth = e.lw;
      ctx.stroke();
    });
  },
  wave_parallax_depth: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    const layers = [
      { speed: 1.5, amp: 0.15, col: 'rgba(0,229,255,0.35)', lw: 6, yOff: 0 },
      { speed: 2.5, amp: 0.25, col: 'rgba(0,229,255,0.65)', lw: 3.5, yOff: 20 },
      { speed: 4.0, amp: 0.35, col: 'rgba(0,229,255,1)', lw: 2, yOff: 40 }
    ];
    layers.forEach(l => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const progress = i / n, amp = (fft[Math.min(i, n - 1)] / 255) * h * l.amp;
        const y = cy + l.yOff + Math.sin(progress * Math.PI * 5 + t * l.speed) * amp;
        i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
      }
      ctx.strokeStyle = l.col;
      ctx.lineWidth = l.lw;
      ctx.stroke();
    });
  },
  wave_bass_pulse: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2, bass = fft[0] / 255, pulse = 1 + bass * 1.8;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const progress = i / n, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.36 * pulse;
      const y = cy + Math.sin(progress * Math.PI * 6 + t * 3) * amp;
      i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
    }
    ctx.strokeStyle = cfg.color || '#FF6EC7';
    ctx.lineWidth = 2 + bass * 5;
    ctx.stroke();
  },
  wave_grid_waveform: (ctx, fft, cfg, w, h, t) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = 0; gy < h; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    const n = fft.length, cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const progress = i / n, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.42;
      const y = cy + Math.sin(progress * Math.PI * 5 + t * 3) * amp;
      i === 0 ? ctx.moveTo(progress * w, y) : ctx.lineTo(progress * w, y);
    }
    ctx.strokeStyle = cfg.color || '#00FF7F';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  },
  wave_crossfade_edge: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    for (let i = 0; i < n - 1; i++) {
      const t1 = i / n, t2 = (i + 1) / n, fade = Math.sin(t1 * Math.PI);
      const y1 = cy + Math.sin(t1 * Math.PI * 6 + t * 3) * (fft[i] / 255) * h * 0.42;
      const y2 = cy + Math.sin(t2 * Math.PI * 6 + t * 3) * (fft[i + 1] / 255) * h * 0.42;
      ctx.strokeStyle = `rgba(255,110,199,${fade * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(t1 * w, y1);
      ctx.lineTo(t2 * w, y2);
      ctx.stroke();
    }
  },
  wave_waterfall_drip: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.4;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const progress = i / n, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.35;
      i === 0 ? ctx.moveTo(progress * w, baseY - amp) : ctx.lineTo(progress * w, baseY - amp);
    }
    ctx.strokeStyle = cfg.color || '#00FFF0';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < n; i += 3) {
      const progress = i / n, x = progress * w, amp = (fft[i] / 255) * h * 0.35;
      const topY = baseY - amp, dripLen = amp * 0.6 * ((Math.sin(t * 2 + i) + 1) / 2);
      const grad = ctx.createLinearGradient(x, topY, x, topY + dripLen);
      grad.addColorStop(0, cfg.color || '#00FFF0');
      grad.addColorStop(1, 'rgba(0,255,240,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, topY + dripLen);
      ctx.stroke();
    }
  }
};

// ============================================================
// 3. RING / CIRCLE RENDERERS (20)
// ============================================================
export const RING_RENDERERS = {
  ring_1: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    ctx.strokeStyle = cfg.color || '#FF8A00'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255) * r * 1.8;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + amp), cy + Math.sin(a) * (r + amp)); ctx.stroke();
    }
  },
  ring_2: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, R = Math.min(w, h) * 0.32, step = Math.PI * 2 / n;
    ctx.strokeStyle = cfg.color || '#00E5FF'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255) * R * 0.7;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a) * Math.max(20, R - amp), cy + Math.sin(a) * Math.max(20, R - amp)); ctx.stroke();
    }
  },
  ring_3: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r1 = Math.min(w, h) * 0.12, r2 = Math.min(w, h) * 0.28, step = Math.PI * 2 / n;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255);
      ctx.strokeStyle = cfg.colorInner || '#FF6EC7';
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * (r1 + amp * 50), cy + Math.sin(a) * (r1 + amp * 50)); ctx.stroke();
      ctx.strokeStyle = cfg.colorOuter || '#00E5FF';
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.lineTo(cx + Math.cos(a) * (r2 + amp * 40), cy + Math.sin(a) * (r2 + amp * 40)); ctx.stroke();
    }
  },
  ring_4: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.22, step = Math.PI * 2 / n;
    const pulse = r * (1 + (fft[0] / 255) * 0.3);
    ctx.strokeStyle = cfg.color || '#D500F9'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i % n) * step - Math.PI / 2, amp = (fft[i % n] / 255) * pulse * 0.5;
      const px = cx + Math.cos(a) * (pulse + amp), py = cy + Math.sin(a) * (pulse + amp);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
  },
  ring_5: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, step = Math.PI * 2 / n;
    for (let ring = 0; ring < 4; ring++) {
      const r = 40 + ring * 30;
      ctx.strokeStyle = `rgba(0,229,255,${0.8 - ring * 0.18})`; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (i % n) * step, amp = (fft[Math.min(i % n, n - 1)] / 255) * (15 + ring * 8);
        const px = cx + Math.cos(a) * (r + amp), py = cy + Math.sin(a) * (r + amp);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
  },
  ring_6: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = fft[i] / 255, arcLen = step * 0.7;
      ctx.lineWidth = 6 + amp * 12; ctx.strokeStyle = `hsl(${Math.floor((i / n) * 360)},100%,55%)`;
      ctx.beginPath(); ctx.arc(cx, cy, r + amp * 60, a - arcLen / 2, a + arcLen / 2); ctx.stroke();
    }
  },
  ring_7: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.15, step = Math.PI * 2 / n;
    ctx.strokeStyle = cfg.color || '#FFD700'; ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255) * 120;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (r + amp), cy + Math.sin(a) * (r + amp)); ctx.stroke();
    }
  },
  ring_8: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, sides = 6, sStep = Math.PI * 2 / sides, r = Math.min(w, h) * 0.2;
    for (let i = 0; i < n; i++) {
      const segIdx = Math.floor(i / n * sides), segT = (i / n * sides) % 1;
      const a1 = segIdx * sStep - Math.PI / 2, a2 = (segIdx + 1) * sStep - Math.PI / 2;
      const amp = (fft[i] / 255) * 50;
      const bx = cx + Math.cos(a1) * (r + amp), by = cy + Math.sin(a1) * (r + amp);
      const ex = cx + Math.cos(a2) * (r + amp), ey = cy + Math.sin(a2) * (r + amp);
      ctx.fillStyle = cfg.color || '#76FF03'; ctx.beginPath();
      ctx.arc(bx + (ex - bx) * segT, by + (ey - by) * segT, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  },
  ring_9: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    ctx.fillStyle = cfg.color || '#00E5FF';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = fft[i] / 255;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * (r + amp * 80), cy + Math.sin(a) * (r + amp * 80), 2 + amp * 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  ring_10: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255) * 90;
      ctx.strokeStyle = `hsl(${Math.floor((i / n) * 360)},100%,55%)`;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + amp), cy + Math.sin(a) * (r + amp)); ctx.stroke();
    }
  },
  ring_11: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, bass = fft[0] / 255, r = Math.min(w, h) * 0.15 * (1 + bass * 0.6);
    ctx.strokeStyle = cfg.color || '#FF1744'; ctx.lineWidth = 3 + bass * 6;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,23,68,0.3)'; ctx.lineWidth = 1 + bass * 12;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2); ctx.stroke();
  },
  ring_12: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.2, step = Math.PI * 2 / n;
    ctx.lineWidth = 8; ctx.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = fft[i] / 255, len = step * 0.8;
      const grad = ctx.createLinearGradient(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + amp * 50), cy + Math.sin(a) * (r + amp * 50));
      grad.addColorStop(0, '#8A2BE2'); grad.addColorStop(1, '#00FFF0');
      ctx.strokeStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r + amp * 25, a - len / 2, a + len / 2); ctx.stroke();
    }
  },
  ring_13: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    ctx.strokeStyle = cfg.color || '#FF6EC7'; ctx.lineWidth = 3;
    for (let i = 0; i < n; i += 2) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255) * 100, spk = i % 4 === 0 ? amp * 1.4 : amp * 0.6;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + spk), cy + Math.sin(a) * (r + spk)); ctx.stroke();
    }
  },
  ring_14: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2 + t * 0.5, amp = fft[i] / 255;
      ctx.strokeStyle = i % 2 === 0 ? (cfg.colorA || '#FF6EC7') : (cfg.colorB || '#00E5FF');
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (60 + amp * 40), cy + Math.sin(a) * (60 + amp * 40));
      ctx.lineTo(cx + Math.cos(a) * (80 + amp * 60), cy + Math.sin(a) * (80 + amp * 60)); ctx.stroke();
    }
  },
  ring_15: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.2, step = Math.PI * 2 / n;
    ctx.strokeStyle = cfg.color || '#00E5FF'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i % n) * step - Math.PI / 2, wv = Math.sin(i * 0.5 + t * 4) * (fft[i % n] / 255) * 60;
      const px = cx + Math.cos(a) * (r + wv), py = cy + Math.sin(a) * (r + wv);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
  },
  ring_16: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = (fft[i] / 255) * 80, gearW = step * 0.4;
      ctx.strokeStyle = cfg.color || '#FF9100';
      ctx.beginPath(); ctx.arc(cx, cy, r + amp, a - gearW, a + gearW); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r, a + gearW, a + step - gearW); ctx.stroke();
    }
  },
  ring_17: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = Math.min(fft.length, 48), r = Math.min(w, h) * 0.2, step = Math.PI * 2 / n;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, flame = (fft[i] / 255) * 100 * (0.7 + Math.random() * 0.6);
      const grad = ctx.createLinearGradient(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + flame), cy + Math.sin(a) * (r + flame));
      grad.addColorStop(0, '#FF6D00'); grad.addColorStop(0.5, '#FF1744'); grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.strokeStyle = grad; ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + flame), cy + Math.sin(a) * (r + flame)); ctx.stroke();
    }
  },
  ring_18: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, halfN = Math.floor(n / 2);
    for (let half = 0; half < 2; half++) {
      const startA = half * Math.PI;
      ctx.strokeStyle = half === 0 ? (cfg.colorA || '#FF6EC7') : (cfg.colorB || '#00E5FF');
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < halfN; i++) {
        const a = startA + i * (Math.PI / halfN) - Math.PI / 2, amp = (fft[half * halfN + i] / 255) * 80;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70);
        ctx.lineTo(cx + Math.cos(a) * (70 + amp), cy + Math.sin(a) * (70 + amp)); ctx.stroke();
      }
    }
  },
  ring_19: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.18, step = Math.PI * 2 / n;
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = i * step - Math.PI / 2, amp = fft[i] / 255;
      const inR = r * (1 - amp * 0.4), outR = r * (1 + amp * 0.8);
      const grad = ctx.createRadialGradient(cx, cy, inR, cx, cy, outR);
      grad.addColorStop(0, 'rgba(0,229,255,0)'); grad.addColorStop(0.5, cfg.color || '#00E5FF'); grad.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.strokeStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, (inR + outR) / 2, a - step / 2, a + step / 2); ctx.stroke();
    }
  },
  ring_20: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length, r = Math.min(w, h) * 0.15, step = Math.PI * 2 / n, bass = fft[0] / 255;
    ctx.shadowColor = cfg.color || '#D500F9'; ctx.shadowBlur = 12 + bass * 20;
    ctx.strokeStyle = cfg.color || '#D500F9'; ctx.lineWidth = 2 + bass * 4; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i % n) * step - Math.PI / 2, amp = (fft[i % n] / 255) * 50 * ((Math.sin(t * 2) + 2) / 2);
      const px = cx + Math.cos(a) * (r + amp), py = cy + Math.sin(a) * (r + amp);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke(); ctx.shadowBlur = 0;
  }
};

// ============================================================
// 4. LIQUID RENDERERS (20)
// ============================================================
export const LIQUID_RENDERERS = {
  liquid_1: (ctx, fft, cfg, w, h, t) => {
    for (let b = 0; b < 6; b++) {
      const amp = fft[Math.floor(b / 6 * (fft.length - 1))] / 255;
      const x = w * 0.15 + b * (w * 0.7 / 6), baseY = h * 0.6 - amp * 150, radius = 20 + amp * 40;
      const grad = ctx.createRadialGradient(x, baseY, 0, x, baseY, radius);
      grad.addColorStop(0, cfg.colorIn || 'rgba(255,110,199,0.9)'); grad.addColorStop(1, 'rgba(255,110,199,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, baseY + Math.sin(t * 2 + b) * 20, radius, 0, Math.PI * 2); ctx.fill();
    }
  },
  liquid_2: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.6; ctx.beginPath(); ctx.moveTo(0, h);
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.35;
      ctx.lineTo(x, baseY - amp + Math.sin(x / w * Math.PI * 3 + t * 2) * 15);
    }
    ctx.lineTo(w, h); ctx.closePath();
    const grad = ctx.createLinearGradient(0, baseY - h * 0.35, 0, h);
    grad.addColorStop(0, cfg.colorTop || 'rgba(0,180,255,0.6)'); grad.addColorStop(0.5, 'rgba(0,100,200,0.8)'); grad.addColorStop(1, 'rgba(0,30,80,0.95)');
    ctx.fillStyle = grad; ctx.fill();
  },
  liquid_3: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 8; i++) {
      const amp = fft[Math.floor(i / 8 * (fft.length - 1))] / 255;
      const x = (w / 9) * (i + 1), y = h / 2 + Math.sin(t * 1.5 + i * 1.2) * 30, r = 15 + amp * 35;
      ctx.fillStyle = `rgba(180,180,220,${0.4 + amp * 0.5})`; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.2, r * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  liquid_4: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 12; i++) {
      const amp = fft[Math.floor(i / 12 * (fft.length - 1))] / 255, x = (w / 13) * (i + 1);
      const r = 8 + amp * 18, y = (h - 20) - ((t * (1.5 + amp * 3) * 30 + i * 50) % (h + 40));
      if (y < -20 || y > h + 20) continue;
      ctx.fillStyle = cfg.color || 'rgba(100,200,255,0.6)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  },
  liquid_5: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < fft.length; i += 4) {
      const amp = fft[i] / 255; if (amp < 0.15) continue;
      const x = (i / fft.length) * w + Math.sin(t + i) * 3, dripH = amp * h * 0.5;
      const grad = ctx.createLinearGradient(x, 0, x, dripH);
      grad.addColorStop(0, cfg.color || 'rgba(0,229,255,0.8)'); grad.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dripH); ctx.stroke();
      ctx.fillStyle = cfg.color || 'rgba(0,229,255,0.8)'; ctx.beginPath(); ctx.arc(x, dripH, 3, 0, Math.PI * 2); ctx.fill();
    }
  },
  liquid_6: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = 64; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, amp = (fft[Math.floor((i / n) * (fft.length - 1))] / 255) * 80;
      const r = 60 + Math.sin(a * 3 + t * 3) * amp * 0.5 + Math.sin(a * 5 + t * 2) * amp * 0.3;
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140);
    grad.addColorStop(0, cfg.colorIn || 'rgba(180,0,255,0.8)'); grad.addColorStop(1, cfg.colorOut || 'rgba(0,229,255,0.3)');
    ctx.fillStyle = grad; ctx.fill();
  },
  liquid_7: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, baseR = 50 + (fft[0] / 255) * 30, n = 48; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, amp = (fft[Math.floor((i / n) * (fft.length - 1))] / 255) * 35;
      const r = baseR + Math.sin(a * 4 + t * 5) * amp;
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fillStyle = cfg.color || 'rgba(0,255,180,0.5)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  },
  liquid_8: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.5;
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.2;
        ctx.lineTo(x, baseY + layer * 40 - amp + Math.sin(x / 50 + t * (2 + layer) + layer * 12) * amp);
      }
      ctx.lineTo(w, h); ctx.closePath();
      const colors = ['rgba(255,110,199,', 'rgba(100,0,255,', 'rgba(0,229,255,'];
      ctx.fillStyle = colors[layer] + `${0.4 - layer * 0.1})`; ctx.fill();
    }
  },
  liquid_9: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length;
    for (let i = 0; i < n; i += 2) {
      const amp = fft[i] / 255; if (amp < 0.1) continue;
      const x = (i / n) * w, bH = amp * h * 0.7, bW = (w / n) * 2 - 1;
      const grad = ctx.createLinearGradient(x, h, x, h - bH);
      grad.addColorStop(0, 'rgba(255,100,0,0.9)'); grad.addColorStop(0.5, 'rgba(255,50,0,0.5)'); grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + bW / 2, h - bH * 1.1, x + bW, h); ctx.fill();
    }
  },
  liquid_10: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length;
    for (let i = 0; i < 8; i++) {
      const amp = fft[Math.floor((i / 8) * (n - 1))] / 255;
      const angle = t * 0.3 + (i * Math.PI) / 4, dist = 30 + amp * 80, r = 15 + amp * 25;
      const bx = cx + Math.cos(angle) * dist, by = cy + Math.sin(angle) * dist;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      grad.addColorStop(0, 'rgba(0,229,255,0.8)'); grad.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    }
  },
  liquid_11: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2; ctx.beginPath(); ctx.moveTo(0, cy);
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.3;
      const y = cy + Math.sin(x / 30 + t * 2) * amp;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = cfg.color || '#00FFF0'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
  },
  liquid_12: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length;
    for (let i = 0; i < n; i += 3) {
      const amp = fft[i] / 255, x = (i / n) * w, y = h * 0.85 - amp * h * 0.6, bW = (w / n) * 3;
      const grad = ctx.createLinearGradient(x, h, x, y);
      grad.addColorStop(0, 'rgba(255,200,0,0.9)'); grad.addColorStop(0.6, 'rgba(255,150,0,0.6)'); grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(x, h); ctx.bezierCurveTo(x, y - 20, x + bW, y - 20, x + bW, h); ctx.fill();
    }
  },
  liquid_13: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.7; ctx.beginPath(); ctx.moveTo(0, h);
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.45;
      ctx.lineTo(x, baseY - amp + Math.sin(x / 40 + t * 3) * amp * 0.3);
    }
    ctx.lineTo(w, h); ctx.closePath();
    const grad = ctx.createLinearGradient(0, baseY - h * 0.45, 0, h);
    grad.addColorStop(0, cfg.colorTop || 'rgba(214,0,255,0.8)'); grad.addColorStop(0.5, 'rgba(100,0,200,0.6)'); grad.addColorStop(1, cfg.colorBot || 'rgba(0,229,255,0.3)');
    ctx.fillStyle = grad; ctx.fill();
  },
  liquid_14: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 10; i++) {
      const amp = fft[Math.floor((i / 10) * (fft.length - 1))] / 255, x = w * 0.08 + i * (w * 0.84 / 10);
      const y = h * 0.5 + Math.cos(t * 2 + i) * 40 - amp * 60, r = 10 + amp * 30;
      ctx.fillStyle = `rgba(${150 + amp * 105},${50 + i * 15},${200 - i * 10},${0.3 + amp * 0.5})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  },
  liquid_15: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length;
    for (let i = 0; i < n; i += 2) {
      const amp = fft[i] / 255; if (amp < 0.08) continue;
      const x = (i / n) * w, topY = h - amp * h * 0.55;
      ctx.fillStyle = `rgba(0,200,100,${amp * 0.7})`; ctx.beginPath(); ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x - 8, topY, x, topY - 10); ctx.quadraticCurveTo(x + 8, topY, x, h); ctx.fill();
    }
  },
  liquid_16: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2;
    for (let layer = 0; layer < 2; layer++) {
      ctx.beginPath(); ctx.moveTo(0, cy);
      for (let i = 0; i <= n; i++) {
        const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.35, dir = layer === 0 ? -1 : 1;
        const y = cy + dir * (amp + Math.sin(x / 25 + t * 3) * amp * 0.2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(w, cy); ctx.closePath();
      ctx.fillStyle = layer === 0 ? 'rgba(0,150,255,0.4)' : 'rgba(0,229,255,0.3)'; ctx.fill();
    }
  },
  liquid_17: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, pulseR = 40 + (fft[0] / 255) * 100;
    for (let ring = 0; ring < 4; ring++) {
      ctx.strokeStyle = `rgba(255,23,68,${0.6 - ring * 0.15})`; ctx.lineWidth = 3 - ring * 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, pulseR + ring * 20, 0, Math.PI * 2); ctx.stroke();
    }
  },
  liquid_18: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.55; ctx.beginPath(); ctx.moveTo(0, baseY);
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.35;
      ctx.lineTo(x, baseY - amp + Math.sin(x / 60 + t * 1.5) * 20);
    }
    ctx.lineTo(w, baseY); ctx.closePath();
    ctx.fillStyle = cfg.color || 'rgba(0,100,200,0.7)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
  },
  liquid_19: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length;
    for (let i = 0; i < n; i += 3) {
      const amp = fft[i] / 255, x = (i / n) * w, y = h - amp * h * 0.7, bW = (w / n) * 3;
      const grad = ctx.createLinearGradient(x, h, x, y);
      grad.addColorStop(0, 'rgba(255,0,100,0.8)'); grad.addColorStop(1, 'rgba(255,0,100,0)');
      ctx.fillStyle = grad; ctx.fillRect(x, y, bW - 1, h - y);
    }
  },
  liquid_20: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h * 0.75; ctx.beginPath(); ctx.moveTo(0, h);
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, amp = (fft[Math.min(i, n - 1)] / 255) * h * 0.5;
      ctx.lineTo(x, baseY - amp + Math.sin(x / 20 + t * 4) * amp * 0.15 + Math.sin(x / 50 + t * 2) * amp * 0.1);
    }
    ctx.lineTo(w, h); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(57,255,20,0.7)'); grad.addColorStop(1, 'rgba(0,50,0,0.9)');
    ctx.fillStyle = grad; ctx.fill();
  }
};

// ============================================================
// 5. LINE / DOT MATRIX RENDERERS (20)
// ============================================================
export const LINEDOT_RENDERERS = {
  linedot_1: (ctx, fft, cfg, w, h, t) => {
    const rows = fft.length, lineH = h / rows;
    for (let i = 0; i < rows; i++) {
      const amp = fft[i] / 255, lineW = amp * w * 0.9;
      ctx.strokeStyle = `rgba(0,229,255,${0.3 + amp * 0.6})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo((w - lineW) / 2, i * lineH); ctx.lineTo((w + lineW) / 2, i * lineH); ctx.stroke();
    }
  },
  linedot_2: (ctx, fft, cfg, w, h, t) => {
    const cols = fft.length, colW = w / cols;
    for (let i = 0; i < cols; i++) {
      const amp = fft[i] / 255, lineH = amp * h * 0.9;
      ctx.strokeStyle = `rgba(255,110,199,${0.3 + amp * 0.6})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i * colW, (h - lineH) / 2); ctx.lineTo(i * colW, (h + lineH) / 2); ctx.stroke();
    }
  },
  linedot_3: (ctx, fft, cfg, w, h, t) => {
    const gx = 20, gy = 16, cW = w / gx, cH = h / gy;
    for (let x = 0; x < gx; x++) {
      for (let y = 0; y < gy; y++) {
        const val = (fft[Math.floor((x / gx) * (fft.length - 1))] / 255) * (1 - Math.abs(y - gy / 2) / (gy / 2));
        if (val < 0.1) continue;
        ctx.fillStyle = `rgba(0,255,127,${val * 0.8})`; ctx.fillRect(x * cW + 1, y * cH + 1, cW - 2, cH - 2);
      }
    }
  },
  linedot_4: (ctx, fft, cfg, w, h, t) => {
    const cols = fft.length, rows = 14, sX = w / cols, sY = h / rows;
    for (let i = 0; i < cols; i++) {
      const lit = Math.floor((fft[i] / 255) * rows);
      for (let d = 0; d < lit; d++) {
        const hue = d > 10 ? 0 : d > 7 ? 40 : 120;
        ctx.fillStyle = `hsl(${hue},100%,55%)`; ctx.beginPath();
        ctx.arc(i * sX + sX / 2, h - d * sY - sY / 2, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  linedot_5: (ctx, fft, cfg, w, h, t) => {
    const step = 10; ctx.strokeStyle = 'rgba(0,229,255,0.3)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += step) {
      const amp = fft[Math.floor((x / w) * (fft.length - 1))] / 255;
      for (let y = 0; y < h; y += step) {
        ctx.globalAlpha = amp * 0.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + step, y + step); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + step, y); ctx.lineTo(x, y + step); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  },
  linedot_6: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length; ctx.strokeStyle = cfg.color || '#FFD700'; ctx.lineWidth = 1.5;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, x = (i / n) * w, zigH = amp * h * 0.4, zigW = w / n, cy = h / 2;
      ctx.beginPath(); ctx.moveTo(x, cy - zigH); ctx.lineTo(x + zigW / 2, cy + zigH); ctx.lineTo(x + zigW, cy - zigH); ctx.stroke();
    }
  },
  linedot_7: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cx = w / 2, cy = h / 2; ctx.fillStyle = cfg.color || '#00E5FF';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 10 + t, r = 10 + (i / n) * 150;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1 + (fft[i] / 255) * 4, 0, Math.PI * 2); ctx.fill();
    }
  },
  linedot_8: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2; ctx.fillStyle = cfg.color || '#FF6EC7';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, x = (i / n) * w;
      ctx.beginPath(); ctx.arc(x, cy + Math.sin(x / w * Math.PI * 4 + t * 3) * amp * h * 0.35, 2 + amp * 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  linedot_9: (ctx, fft, cfg, w, h, t) => {
    const cols = Math.min(fft.length, 40); ctx.fillStyle = cfg.color || '#00FF7F'; ctx.font = '10px monospace';
    for (let i = 0; i < cols; i++) {
      const amp = fft[i] / 255, x = (i / cols) * w, yOff = ((t * (0.5 + amp * 3) * 50 + i * 30) % h);
      for (let c = 0; c < 5; c++) {
        ctx.globalAlpha = (1 - c * 0.2) * amp;
        ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)), x, (yOff + c * 20) % h);
      }
    }
    ctx.globalAlpha = 1;
  },
  linedot_10: (ctx, fft, cfg, w, h, t) => {
    const n = Math.min(fft.length, 50); ctx.fillStyle = cfg.color || '#FFFFFF';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.1, d = 50 + (i / n) * Math.min(w, h) * 0.4;
      ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 1 + (fft[i] / 255) * 3, 0, Math.PI * 2); ctx.fill();
    }
  },
  linedot_11: (ctx, fft, cfg, w, h, t) => {
    const n = Math.min(fft.length, 30); ctx.strokeStyle = 'rgba(0,229,255,0.3)'; ctx.lineWidth = 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255;
      pts.push({ x: (i / n) * w + Math.sin(t + i) * 10, y: h / 2 + Math.cos(t * 2 + i * 0.5) * amp * 100, amp });
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 120) {
          ctx.globalAlpha = (1 - d / 120) * 0.5; ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1; ctx.fillStyle = '#00E5FF';
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 2 + p.amp * 4, 0, Math.PI * 2); ctx.fill(); });
  },
  linedot_12: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length; ctx.strokeStyle = cfg.color || '#39FF14'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) { ctx.globalAlpha = 0.1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, y = h / 2 + Math.sin(x / w * Math.PI * 5 + t * 3) * (fft[Math.min(i, n - 1)] / 255) * h * 0.4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
  linedot_13: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, baseY = h - 30; ctx.fillStyle = cfg.color || '#FF4500';
    for (let i = 0; i < n; i++) {
      const dots = Math.floor(((fft[i] / 255) * h * 0.75) / 10), x = (i / n) * w;
      for (let d = 0; d < dots; d++) {
        ctx.beginPath(); ctx.arc(x + w / n / 2, baseY - d * 10, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  linedot_14: (ctx, fft, cfg, w, h, t) => {
    const n = Math.min(fft.length, 60); ctx.fillStyle = cfg.color || '#00E5FF';
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, x = (i / n) * w, startY = ((t * (1 + amp * 4) * 40 + i * 20) % h);
      for (let p = 0; p < 3; p++) {
        ctx.globalAlpha = amp * (1 - p * 0.3); ctx.fillRect(x, (startY + p * 15) % h, 2 + amp * 4, 2 + amp * 4);
      }
    }
    ctx.globalAlpha = 1;
  },
  linedot_15: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2, n = fft.length; ctx.strokeStyle = cfg.color || '#FF1744'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, amp = fft[Math.floor((i / 12) * (n - 1))] / 255;
      const len = 20 + amp * Math.min(w, h) * 0.4;
      ctx.globalAlpha = 0.3 + amp * 0.6; ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  linedot_16: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2; ctx.fillStyle = cfg.color || '#D500F9';
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 0; i < n; i++) {
        const x = (i / n) * w, amp = fft[i] / 255, offset = strand === 0 ? 1 : -1;
        const y = cy + offset * Math.sin(x / w * Math.PI * 4 + t * 3) * amp * 50;
        ctx.beginPath(); ctx.arc(x, y, 2 + amp * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  linedot_17: (ctx, fft, cfg, w, h, t) => {
    const n = Math.min(fft.length, 40); ctx.fillStyle = cfg.color || '#FFFFFF'; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    const stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({ x: (i * 97 + t * 10) % w, y: (i * 53 + Math.sin(t + i) * 20) % h, r: 1 + (fft[i] / 255) * 3, amp: fft[i] / 255 });
    }
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
        if (d < 80) { ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke(); }
      }
    }
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
  },
  linedot_18: (ctx, fft, cfg, w, h, t) => {
    const gx = 16, gy = 12, cW = w / gx, cH = h / gy;
    for (let x = 0; x < gx; x++) {
      for (let y = 0; y < gy; y++) {
        const val = (fft[Math.floor((x / gx) * (fft.length - 1))] / 255) * (1 - (Math.hypot(x - gx / 2, y - gy / 2) / Math.hypot(gx / 2, gy / 2)) * 0.5);
        const r = Math.max(1, val * cW * 0.35);
        ctx.fillStyle = `hsla(${Math.floor(val * 270)},100%,55%,${val})`; ctx.beginPath();
        ctx.arc(x * cW + cW / 2, y * cH + cH / 2, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  linedot_19: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2; ctx.strokeStyle = cfg.color || '#FFD700'; ctx.lineWidth = 2;
    ctx.beginPath(); let x = 0;
    for (let i = 0; i < n; i++) {
      const amp = fft[i] / 255, segW = w / n, lvl = amp > 0.5 ? -amp * h * 0.3 : 0, dur = amp > 0.5 ? segW * 0.3 : segW;
      ctx.lineTo(x, cy + lvl); x += dur; ctx.lineTo(x, cy + lvl);
      if (amp > 0.5) { ctx.lineTo(x, cy); x += segW - dur; ctx.lineTo(x, cy); }
    }
    ctx.stroke();
  },
  linedot_20: (ctx, fft, cfg, w, h, t) => {
    const n = fft.length, cy = h / 2; ctx.strokeStyle = cfg.color || '#FF1744'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / n) * w, amp = fft[i] / 255, stepX = w / n;
      ctx.lineTo(x + stepX * 0.1, cy);
      ctx.lineTo(x + stepX * 0.25, cy - amp * h * 0.4);
      ctx.lineTo(x + stepX * 0.4, cy + amp * h * 0.08);
      ctx.lineTo(x + stepX * 0.55, cy);
      ctx.lineTo(x + stepX, cy);
    }
    ctx.stroke();
  }
};

// ============================================================
// 6. PARTICLE / BLOB RENDERERS (20)
// ============================================================
export const PARTICLE_RENDERERS = {
  particle_1: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 40; i++) {
      const amp = fft[Math.floor((i / 40) * (fft.length - 1))] / 255, a = (i / 40) * Math.PI * 2 + t * 2, d = amp * 120;
      ctx.fillStyle = `rgba(255,${100 + i * 3},0,${amp})`; ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 2 + amp * 6, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_2: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 30; i++) {
      const amp = fft[Math.floor((i / 30) * (fft.length - 1))] / 255;
      const x = w / 2 + (i - 15) * 12 + Math.sin(t + i) * 10, y = h - ((t * (1 + amp * 3) * 40 + i * 40) % (h + 40));
      ctx.fillStyle = `rgba(0,229,255,${amp * 0.8})`; ctx.beginPath(); ctx.arc(x, y, 2 + amp * 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_3: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 25; i++) {
      const amp = fft[Math.floor((i / 25) * (fft.length - 1))] / 255;
      const x = (i * w / 25 + Math.sin(t * 2 + i) * 30) % w, y = h / 2 + Math.sin(t * 3 + i * 0.7) * 100 * amp;
      ctx.fillStyle = `rgba(255,255,0,${0.2 + amp * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 3 + amp * 8, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_4: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 40; i++) {
      const amp = fft[Math.floor((i / 40) * (fft.length - 1))] / 255;
      const x = (i * 17 + t * 20 * amp) % w, y = (t * (0.3 + amp) * 15 + i * 25) % (h + 20);
      ctx.fillStyle = `rgba(200,220,255,${0.3 + amp * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 2 + amp * 4, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_5: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 30; i++) {
      const amp = fft[Math.floor((i / 30) * (fft.length - 1))] / 255, x = w * 0.1 + i * (w * 0.8 / 30);
      const y = h - ((t * (1 + amp * 2) * 25 + i * 30) % (h + 30));
      ctx.fillStyle = `rgba(255,${80 + i * 5},0,${amp * 0.9})`; ctx.beginPath(); ctx.arc(x, y, 2 + amp * 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_6: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 40; i++) {
      const amp = fft[Math.floor((i / 40) * (fft.length - 1))] / 255, a = (i / 40) * Math.PI * 2 + t * (1 + amp * 2);
      const d = 30 + amp * 100 + i * 2;
      ctx.fillStyle = `rgba(180,0,255,${amp * 0.8})`; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + amp * 4, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_7: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 50; i++) {
      const amp = fft[Math.floor((i / 50) * (fft.length - 1))] / 255, a = i * 2.4 + t * 0.3, d = Math.max(5, 20 + i * 3 - amp * 40);
      ctx.fillStyle = `rgba(0,229,255,${amp * 0.7})`; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.5 + amp * 4, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_8: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 20; i++) {
      const amp = fft[Math.floor((i / 20) * (fft.length - 1))] / 255, a = (i / 20) * Math.PI * 2 + t * (0.5 + amp), d = 50 + amp * 100;
      for (let trail = 0; trail < 4; trail++) {
        const ta = a - trail * 0.1, td = d - trail * 8;
        ctx.fillStyle = `rgba(0,229,255,${(1 - trail * 0.25) * amp})`; ctx.beginPath();
        ctx.arc(w / 2 + Math.cos(ta) * td, h / 2 + Math.sin(ta) * td, 3 - trail * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  particle_9: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 15; i++) {
      const amp = fft[Math.floor((i / 15) * (fft.length - 1))] / 255; if (amp < 0.2) continue;
      const x = w * 0.1 + i * (w * 0.8 / 15), y = h * 0.5 + Math.sin(t * 3 + i) * 50, maxR = 15 + amp * 30;
      for (let ring = 3; ring >= 0; ring--) {
        ctx.fillStyle = `rgba(100,200,255,${(0.3 - ring * 0.07) * amp})`; ctx.beginPath();
        ctx.arc(x, y, (maxR * (ring + 1)) / 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  particle_10: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 60; i++) {
      const amp = fft[Math.floor((i / 60) * (fft.length - 1))] / 255;
      ctx.fillStyle = `rgba(150,150,150,${0.15 + amp * 0.35})`; ctx.beginPath();
      ctx.arc((i * 11 + Math.sin(t + i * 0.3) * 30) % w, (i * 13 + t * amp * 20) % h, 1 + amp * 3, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_11: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 35; i++) {
      const amp = fft[Math.floor((i / 35) * (fft.length - 1))] / 255;
      const x = w / 2 + (i - 17) * 15 + Math.sin(t * 2 + i) * 8, y = h * 0.3 - amp * 50 + Math.cos(t * 3 + i) * 15;
      ctx.fillStyle = `rgba(255,200,0,${amp * 0.8})`; ctx.beginPath(); ctx.arc(x, y, 2 + amp * 4, 0, Math.PI * 2); ctx.fill();
      for (let s = 0; s < 3; s++) {
        ctx.fillStyle = `rgba(255,100,0,${amp * 0.3})`; ctx.beginPath();
        ctx.arc(x + Math.sin(t * 5 + i + s) * 8, y + s * 6 + amp * 10, (2 + amp * 4) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  particle_12: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 80; i++) {
      const amp = fft[Math.floor((i / 80) * (fft.length - 1))] / 255;
      const a = (i / 80) * Math.PI * 6 + t * 0.5, r = (i / 80) * 150 * (1 + amp * 0.5);
      ctx.fillStyle = `hsla(${Math.floor((i / 80) * 360)},100%,60%,${0.3 + amp * 0.5})`; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5 + amp * 3, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_13: (ctx, fft, cfg, w, h, t) => {
    for (let layer = 0; layer < 3; layer++) {
      const yBase = h * 0.3 + layer * h * 0.2;
      for (let i = 0; i < fft.length; i += 3) {
        const amp = fft[i] / 255, x = (i / fft.length) * w;
        ctx.fillStyle = `hsla(${120 + layer * 60 + amp * 60},100%,60%,${0.3 + amp * 0.4 - layer * 0.08})`; ctx.beginPath();
        ctx.arc(x, yBase + Math.sin(x / w * Math.PI * 2 + t * (2 - layer * 0.5) + layer) * amp * 40, 2 + amp * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  particle_14: (ctx, fft, cfg, w, h, t) => {
    const bass = fft[0] / 255; if (bass < 0.3) return;
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + t * 3, d = bass * 150 * (0.5 + Math.random() * 0.5);
      ctx.fillStyle = `hsla(${Math.floor(Math.random() * 60 + 30)},100%,60%,${bass * 0.7})`; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d + Math.random() * 20 - 10, cy + Math.sin(a) * d + Math.random() * 20 - 10, 2 + bass * 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_15: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 40; i++) {
      const amp = fft[Math.floor((i / 40) * (fft.length - 1))] / 255;
      ctx.fillStyle = `rgba(255,255,200,${0.15 + amp * 0.35})`; ctx.beginPath();
      ctx.arc((i * w / 40 + Math.sin(t * 0.5 + i) * 20) % w, h / 2 + Math.sin(t + i * 0.4) * amp * 100, 2 + amp * 6, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_16: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 30; i++) {
      const amp = fft[Math.floor((i / 30) * (fft.length - 1))] / 255, x = w * 0.1 + i * (w * 0.8 / 30) + Math.sin(t + i) * 5;
      const y = h - ((t * (0.5 + amp * 2) * 20 + i * 35) % (h + 40)) - 20, r = 3 + amp * 8;
      ctx.fillStyle = `rgba(100,100,100,${0.2 + amp * 0.3})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(150,150,150,${0.1 + amp * 0.15})`; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.5, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_17: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 50; i++) {
      const amp = fft[Math.floor((i / 50) * (fft.length - 1))] / 255, x = (i * 13 + t * amp * 10) % w, y = (t * (1 + amp * 2) * 30 + i * 20) % (h + 20);
      ctx.strokeStyle = `rgba(100,180,255,${amp * 0.6})`; ctx.lineWidth = 1 + amp; ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(t + i) * 3, y + 8 + amp * 12); ctx.stroke();
    }
  },
  particle_18: (ctx, fft, cfg, w, h, t) => {
    const bass = fft[0] / 255, cx = w / 2, cy = h / 2;
    for (let i = 0; i < 40; i++) {
      const amp = fft[Math.floor((i / 40) * (fft.length - 1))] / 255, a = (i / 40) * Math.PI * 2 + t * 3 + bass * 2, d = 20 + bass * 80 + Math.random() * 30;
      ctx.fillStyle = `hsla(${Math.floor(Math.random() * 360)},100%,60%,${amp * 0.7})`; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + amp * 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_19: (ctx, fft, cfg, w, h, t) => {
    for (let i = 0; i < 30; i++) {
      const amp = fft[Math.floor((i / 30) * (fft.length - 1))] / 255, x = w * 0.1 + i * (w * 0.8 / 30);
      const y = h * 0.5 + Math.sin(t * 2 + i * 0.8) * 60 * amp, r = 3 + amp * 6;
      ctx.fillStyle = `rgba(180,255,0,${amp * 0.6})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(180,255,0,${amp * 0.15})`; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
    }
  },
  particle_20: (ctx, fft, cfg, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 60; i++) {
      const amp = fft[Math.floor((i / 60) * (fft.length - 1))] / 255, a = i * 2.4 + t * 0.2, d = 20 + (i / 60) * 140 + amp * 30;
      ctx.fillStyle = `hsla(${200 + (i / 60) * 160},80%,50%,${0.2 + amp * 0.5})`; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1 + amp * 4, 0, Math.PI * 2); ctx.fill();
    }
  }
};

// ============================================================
// ALL 124 RENDERERS MAP
// ============================================================
export const ALL_AVEE_RENDERERS = {
  ...BARS_RENDERERS,
  ...WAVE_RENDERERS,
  ...RING_RENDERERS,
  ...LIQUID_RENDERERS,
  ...LINEDOT_RENDERERS,
  ...PARTICLE_RENDERERS
};

// ============================================================
// CATEGORY DEFINITIONS
// ============================================================
export const AVEE_CATEGORIES = [
  { id: 'bars', name: 'Bars Spectrum', icon: '🎚️', count: 24, description: 'Bar vertikal & horizontal responsif irama' },
  { id: 'wave', name: 'Waveform Spectrum', icon: '🌊', count: 20, description: 'Gelombang audio & jejak osiloskop' },
  { id: 'ring', name: 'Ring & Circle', icon: '🔵', count: 20, description: 'Spektrum radial, cincin & lingkar matahari' },
  { id: 'liquid', name: 'Liquid & Fluid', icon: '🪣', count: 20, description: 'Efek cairan mengalir, ombak & tetesan' },
  { id: 'linedot', name: 'Line & Dot Matrix', icon: '⭐', count: 20, description: 'Matriks titik LED, garis laser & grid' },
  { id: 'particle', name: 'Particle & Blob', icon: '✨', count: 20, description: 'Semburan partikel, bintang & debu cahaya' }
];

// ============================================================
// PRESET METADATA (124 PRESETS)
// ============================================================
const BARS_LIST = [
  ['round_cap_bar', '1. Round Cap Bar', 'Modern Soft Pill Bar', 'Paling gampang terlihat "premium" langsung dengan ujung melengkung halus.', '#FF6EC7', 960, 200],
  ['mirror_bar', '2. Mirror Bar', 'Symmetric Reflect', 'Simetris atas-bawah dari garis tengah horizontal, seolah dipantulkan cermin.', '#00E5FF', 960, 220],
  ['circle_bar', '3. Circle Bar', 'Radial Outward', 'Radial keluar dari lingkaran tengah seperti matahari/bunga.', '#FF8A00', 450, 450],
  ['gradient_glow_bar', '4. Gradient Glow Bar', 'Neon Glow Effect', 'Gradien vertikal (ungu ke cyan) + efek shadow blur neon EDM.', '#00FFF0', 960, 220],
  ['peak_cap_bar', '5. Peak Cap Bar', 'Gravity Falling Dot Peak', 'Bar biasa + dot puncak putih yang jatuh pelan mengikuti gravitasi.', '#00E5FF', 960, 200],
  ['stacked_blocks_bar', '6. Stacked Blocks Bar', 'Discrete LED Blocks', 'Setiap bar terdiri dari blok-blok LED terpisah warna-warni.', '#FFD700', 960, 200],
  ['thin_line_bar', '7. Thin Line Bar', 'Oscilloscope Hairlines', 'Garis tipis 1px vertikal minimalis, mirip tampilan oscilloscope studio.', '#FFFFFF', 960, 200],
  ['twin_flame_bar', '8. Twin Flame Bar', 'Dual Side-by-Side Bars', 'Dua bar berdampingan per frekuensi bin, warna berbeda (pink & cyan).', '#FF6EC7', 960, 200],
  ['skyscraper_bar', '9. Skyscraper Bar', 'Trapezoid Pyramid Bar', 'Bar trapezoid/piramida: lebar di bawah, menyempit ke atas.', '#FFD700', 960, 220],
  ['waveform_fill', '10. Waveform Fill', 'Filled Wave Area', 'Area terisi antara puncak atas dan bawah (simetris) gaya DAW.', '#00E5FF', 960, 220],
  ['equalizer_diamond', '11. Equalizer Diamond', 'Diamond Shape per Bin', 'Setiap frekuensi bin digambar sebagai belah ketupat/diamond.', '#FF4500', 960, 200],
  ['horizontal_side_bars', '12. Horizontal Side Bars', 'Left-to-Right Growing Bars', 'Bar tumbuh horizontal dari kiri ke kanan, gradien ungu ke cyan.', '#00FFF0', 600, 300],
  ['v_arch_bar', '13. V-Arch Bar', 'V-Envelope Modulation', 'Amplitudo minimum di tengah, naik makin ke tepi (efek konser dramatik).', '#76FF03', 960, 220],
  ['color_shift_hue_bar', '14. Color Shift Hue', 'Dynamic Amplitude Hue', 'Warna berubah merah→hijau→biru→violet sesuai kekuatan audio.', '#FF1744', 960, 200],
  ['pixel_mosaic_bar', '15. Pixel Mosaic Bar', 'Retro Pixel Art Grid', 'Bar terdiri dari grid kotak-kotak kecil pixel art bertumpuk.', '#00E5FF', 960, 200],
  ['staircase_descent_bar', '16. Staircase Descent', 'Cascade Waterfall Height', 'Tinggi bar menurun bertahap kiri→kanan (efek tangga air terjun).', '#FF9100', 960, 200],
  ['spine_rib_bar', '17. Spine Rib Bar', 'Center Spine with Ribs', 'Tulang punggung vertikal di tengah + tulang rusuk horizontal menyamping.', '#00E5FF', 960, 240],
  ['fog_mountain_bar', '18. Fog Mountain Bar', 'Fog Mountain Gradient', 'Bar dengan gradien transparan di atas, solid di bawah (efek kabut gunung).', '#38BDF8', 960, 220],
  ['neon_outline_bar', '19. Neon Outline Bar', 'Stroke-Only Hollow Glow', 'Hanya outline kotak dengan glow hijau neon, isi transparan.', '#39FF14', 960, 200],
  ['dual_band_split_bar', '20. Dual Band Split', 'Treble Top & Bass Bottom', 'Layar dibagi dua: treble turun dari atas (pink), bass naik dari bawah (cyan).', '#FF6EC7', 960, 240],
  ['bass_pulse_big_bar', '21. Bass Pulse Big Bar', 'Giant Center Pulse Box', 'Persegi besar berdenyut di tengah + bar normal di atasnya.', '#FF9100', 960, 220],
  ['waterfall_trail_bar', '22. Waterfall Trail Bar', 'Upward Fading Trail', 'Bar dengan ekor gradien yang memudar ke atas, kesan air terjun.', '#00FFB4', 960, 200],
  ['heartbeat_ecg_bar', '23. Heartbeat ECG Bar', 'ECG Waveform Spikes', 'Setiap bin frekuensi digambar sebagai spike ECG detak jantung naik-turun.', '#FF1744', 960, 200],
  ['icicle_top_hang_bar', '24. Icicle Top Hang Bar', 'Ceiling Stalactites', 'Bar menggantung dari langit-langit (stalaktit es) runcing ke bawah.', '#B3E5FC', 960, 220]
];

const WAVE_LIST = [
  ['wave_horizon_sine', 'W1. Horizon Sine Wave', 'Sine Oscilloscope Trace', 'Gelombang sinus halus dari kiri ke kanan, berayun ikut amplitudo.', '#00E5FF', 960, 220],
  ['wave_filled_ocean', 'W2. Filled Ocean Wave', 'Gradient Fill Surface', 'Permukaan ombak lautan terisi gradien biru-cyan dinamis.', '#00B0FF', 960, 220],
  ['wave_dual_mirror', 'W3. Dual Mirror Wave', 'Symmetric Sine Waves', 'Dua gelombang simetris: satu ke atas (pink) satu ke bawah (cyan).', '#FF6EC7', 960, 220],
  ['wave_stacked_ribbon', 'W4. Stacked Ribbon Waves', '3 Parallel Wave Ribbons', '3 garis gelombang bertumpuk di level berbeda dengan kecepatan beda.', '#FFFFFF', 960, 220],
  ['wave_sawtooth', 'W5. Sawtooth Wave', 'Linear Rising-Falling Wave', 'Gelombang gigi gergaji linear yang tajam naik-jatuh mengikuti audio.', '#FFD700', 960, 220],
  ['wave_square_pwm', 'W6. Square PWM Wave', 'Pulse-Width Modulated', 'Gelombang kotak digital dengan lebar pulsa berubah-ubah ikut bass.', '#00FF7F', 960, 220],
  ['wave_thin_hairline', 'W7. Thin Hairline Wave', '1px Thin Oscilloscope', 'Jejak osiloskop 1px ultra-tipis minimalis & sangat responsif.', '#FFFFFF', 960, 200],
  ['wave_stepped_quantized', 'W8. Stepped Quantized', '12-Level Digital Wave', 'Gelombang terkuantisasi 12 level digital terpisah.', '#FF4500', 960, 200],
  ['wave_dot_path', 'W9. Dot Path Wave', 'Sine Dot Matrix Track', 'Titik-titik bertebaran mengikuti lintasan sinus ikut ketukan.', '#00E5FF', 960, 200],
  ['wave_spike_telegraph', 'W10. Spike Telegraph', 'Baseline Vertical Spikes', 'Paku vertikal mencuat dari garis tengah horizontal mirip EKG.', '#FF1744', 960, 200],
  ['wave_inverted_v_peak', 'W11. Inverted V Peak', 'Triangle Spikes Surface', 'Puncak segitiga tajam mencuat dari dasar layar saat audio keras.', '#76FF03', 960, 220],
  ['wave_dual_color_split', 'W12. Dual-Color Split', 'Pink Treble & Cyan Bass', 'Layar dibagi dua: gelombang treble di atas, gelombang bass di bawah.', '#FF6EC7', 960, 220],
  ['wave_gradient_fill', 'W13. Gradient Fill Wave', 'Purple-Cyan Gradient Fill', 'Area gelombang terisi gradien warna ungu-cyan dramatis.', '#D600FF', 960, 220],
  ['wave_thick_stroke', 'W14. Thick Stroke Wave', 'Amplitude Adaptive Width', 'Ketebalan garis gelombang berubah: tipis saat hening, tebal saat keras.', '#FF9100', 960, 220],
  ['wave_echo_decay', 'W15. Echo Decay Wave', '3 Fading Echo Copies', '3 lapisan gelombang memudar (100%→50%→20%) memberi efek gema.', '#00E5FF', 960, 220],
  ['wave_parallax_depth', 'W16. Parallax Depth Wave', '3D Parallax Depth Layers', '3 lapisan gelombang dengan kecepatan berbeda menghasilkan ilusi 3D.', '#00E5FF', 960, 220],
  ['wave_bass_pulse', 'W17. Bass Pulse Wave', 'Kick Drum Expanding Wave', 'Gelombang mengembang & menggemuk saat kick drum bass hit.', '#FF6EC7', 960, 220],
  ['wave_grid_waveform', 'W18. Grid Waveform', 'Oscilloscope Lab Grid', 'Gelombang sinus di atas latar grid laboratorium elektronik.', '#00FF7F', 960, 220],
  ['wave_crossfade_edge', 'W19. Cross-Fade Edge', 'Edge Transparent Fade', 'Gelombang solid di tengah dan memudar transparan ke ujung kiri-kanan.', '#FF6EC7', 960, 200],
  ['wave_waterfall_drip', 'W20. Waterfall Drip Wave', 'Wave with Falling Drips', 'Gelombang di atas dengan tetesan air yang jatuh dari setiap puncak.', '#00FFF0', 960, 220]
];

const RING_LIST = [
  ['ring_1', 'R1. Basic Radial Outward', 'Radial Outward Bars', 'Bar menjalar keluar dari lingkaran tengah.', '#FF8A00', 450, 450],
  ['ring_2', 'R2. Inward Implode Ring', 'Inward Collapsing Bars', 'Bar menuju pusat lingkaran, kesan agresif & bass-heavy.', '#00E5FF', 450, 450],
  ['ring_3', 'R3. Dual Ring (Inner+Outer)', 'Double Ring Concentric', 'Dua lingkaran konsentris dengan bar keluar pink & cyan.', '#FF6EC7', 450, 450],
  ['ring_4', 'R4. Deforming Outline Ring', 'Wobbly Frequency Outline', 'Lingkaran outline yang bergoyang meliuk ikut frekuensi.', '#D500F9', 450, 450],
  ['ring_5', 'R5. Concentric Ripple Rings', '4 Concentric Ripple Rings', '4 cincin konsentris yang bergetar selaras ikut musik.', '#00E5FF', 450, 450],
  ['ring_6', 'R6. Rainbow Hue Arc Ring', 'Full Spectrum Color Arcs', 'Segmen busur warna pelangi penuh 360 derajat.', '#FFFFFF', 450, 450],
  ['ring_7', 'R7. Starburst Ray Ring', 'Sun Rays Bursting Out', 'Sinar matahari memancar dari pusat lingkaran.', '#FFD700', 450, 450],
  ['ring_8', 'R8. Hexagonal Dot Ring', 'Hexagon Perimeter Dots', 'Titik-titik mengikuti jalur segi enam geometrik.', '#76FF03', 450, 450],
  ['ring_9', 'R9. Orbit Dot Ring', 'Orbiting Dot Swarm', 'Titik-titik mengorbit pusat dengan radius sesuai frekuensi.', '#00E5FF', 450, 450],
  ['ring_10', 'R10. Rainbow Radial Bar', 'HSL Hue-Mapped Rays', 'Bar radial dengan warna pelangi sesuai sudut posisi.', '#FFFFFF', 450, 450],
  ['ring_11', 'R11. Bass Breathing Ring', 'Pulsing Bass Ring', 'Lingkaran bernapas mengembang-mengecil ikut ketukan bass.', '#FF1744', 450, 450],
  ['ring_12', 'R12. Gradient Arc Segments', 'Purple-Cyan Gradient Arcs', 'Segmen busur dengan gradien warna ungu ke cyan.', '#00FFF0', 450, 450],
  ['ring_13', 'R13. Spike Crown Ring', 'Alternating Sharp Spikes', 'Duri tajam bergantian panjang-pendek dari keliling lingkaran.', '#FF6EC7', 450, 450],
  ['ring_14', 'R14. Dual Rotating Ring', 'Two Spinning Color Rings', 'Dua cincin warna berbeda berputar dinamis.', '#FF6EC7', 450, 450],
  ['ring_15', 'R15. Waveform Circle Ring', 'Sine Wave Along Circle', 'Gelombang sinus meliuk sepanjang keliling lingkaran.', '#00E5FF', 450, 450],
  ['ring_16', 'R16. Gear Tooth Ring', 'Mechanical Gear Tooth', 'Gigi mekanik muncul-masuk dari lingkaran seperti gir mesin.', '#FF9100', 450, 450],
  ['ring_17', 'R17. Flame Ring', 'Radial Fiery Flames', 'Kobaran lidah api radial menyala dari lingkaran.', '#FF6D00', 450, 450],
  ['ring_18', 'R18. Split Semicircle Ring', 'L/R Semicircle Split', 'Dua setengah lingkaran warna berbeda saling berhadapan.', '#FF6EC7', 450, 450],
  ['ring_19', 'R19. Glow Pulse Ring', 'Radial Gradient Glow', 'Segmen bercahaya dengan efek gradien radial halus.', '#00E5FF', 450, 450],
  ['ring_20', 'R20. Neon Bloom Ring', 'Glowing Neon Bass Bloom', 'Lingkaran neon bersinar mekar mengikuti bass kuat.', '#D500F9', 450, 450]
];

const LIQUID_LIST = [
  ['liquid_1', 'L1. Lava Lamp Blobs', 'Floating Lava Lamp Blobs', 'Gumpalan bola melayang dan berdenyut ikut ketukan musik.', '#FF6EC7', 850, 240],
  ['liquid_2', 'L2. Water Surface Wave', 'Filled Ocean Wave Surface', 'Permukaan air berombak terisi gradien biru laut.', '#00B0FF', 850, 240],
  ['liquid_3', 'L3. Mercury Droplets', 'Reflective Metal Droplets', 'Tetesan merkuri berkilau yang meluncur dan memantul.', '#B0BEC5', 850, 240],
  ['liquid_4', 'L4. Bubble Rise', 'Rising Audio Bubbles', 'Gelembung-gelembung naik ke atas sesuai tingkat amplitudo.', '#64B5F6', 850, 240],
  ['liquid_5', 'L5. Dripping Paint', 'Colored Dripping Paint', 'Cat menetes dari atas layar mengikuti respons frekuensi.', '#00E5FF', 850, 240],
  ['liquid_6', 'L6. Plasma Membrane', 'Wobbly Plasma Membrane', 'Membran plasma meliuk-liuk elastis ikut suara.', '#D500F9', 450, 450],
  ['liquid_7', 'L7. Jelly Wobble', 'Bouncing Jelly Blob', 'Gumpalan jeli kenyal yang memantul dan bergetar.', '#00FF7F', 450, 450],
  ['liquid_8', 'L8. Triple Layer Tide', '3 Overlapping Tide Layers', '3 lapisan gelombang pasang surut bertumpuk.', '#FF6EC7', 850, 240],
  ['liquid_9', 'L9. Magma Eruption', 'Rising Lava Magma Curves', 'Kurva magma cair naik membakar dari dasar layar.', '#FF6D00', 850, 240],
  ['liquid_10', 'L10. Ink Spread Orbs', 'Spreading Ink Orbs', 'Gumpalan tinta pekat menyebar anggun dari pusat.', '#00E5FF', 450, 450],
  ['liquid_11', 'L11. Neon Liquid River', 'Thick Neon Flow Line', 'Aliran sungai cairan neon tebal yang bergelombang.', '#00FFF0', 850, 240],
  ['liquid_12', 'L12. Honey Drip', 'Golden Flowing Honey', 'Tetesan madu kental emas yang mengalir anggun.', '#FFD700', 850, 240],
  ['liquid_13', 'L13. Gradient Mountain Fill', 'Dramatic Purple-Cyan Fill', 'Area pegunungan terisi gradien warna ungu-cyan.', '#D600FF', 850, 240],
  ['liquid_14', 'L14. Floating Color Orbs', 'Drifting Colored Spheres', 'Bola-bola warna mengapung lembut di udara.', '#FFFFFF', 850, 240],
  ['liquid_15', 'L15. Acid Drop Rise', 'Rising Acid Droplets', 'Tetesan cairan asam hijau naik dari dasar.', '#00E676', 850, 240],
  ['liquid_16', 'L16. Mirror Liquid Wave', 'Symmetric Top/Bot Liquid', 'Cairan simetris atas-bawah memantul dari garis tengah.', '#00B0FF', 850, 240],
  ['liquid_17', 'L17. Blood Pulse Rings', 'Pulsing Arterial Rings', 'Cincin arteri berdenyut kencang mengikuti ketukan bass.', '#FF1744', 450, 450],
  ['liquid_18', 'L18. Ocean Swell', 'Rolling Ocean Swell Fill', 'Gelombang laut menggulung terisi gradien biru dalam.', '#0288D1', 850, 240],
  ['liquid_19', 'L19. Liquid Equalizer', 'Fluid Frequency Columns', 'Kolom bar frekuensi dengan tampilan cairan dinamis.', '#FF0064', 850, 240],
  ['liquid_20', 'L20. Acid Rain Surface', 'Green Toxic Wave Fill', 'Permukaan gelombang hijau asam beracun bercahaya.', '#39FF14', 850, 240]
];

const LINEDOT_LIST = [
  ['linedot_1', 'LD1. Horizontal Scan Lines', 'Centered Horizontal Scans', 'Garis horizontal membentang dari tengah sesuai nada.', '#00E5FF', 850, 240],
  ['linedot_2', 'LD2. Vertical Scan Lines', 'Vertical Amplitude Scans', 'Garis vertikal memanjang mengikuti frekuensi audio.', '#FF6EC7', 850, 240],
  ['linedot_3', 'LD3. Grid Pulse', 'Frequency-Mapped Grid Cells', 'Kotak-kotak grid menyala berdenyut sesuai spektrum nada.', '#00FF7F', 850, 240],
  ['linedot_4', 'LD4. Classic LED Dot Matrix', 'Stacked LED Dot Equalizer', 'Equalizer titik LED klasik bertumpuk ala audio jadul.', '#FF4500', 850, 240],
  ['linedot_5', 'LD5. Cross-Hatch Pattern', 'Diagonal Cross Lines', 'Pola garis silang diagonal bereaksi terhadap amplitudo.', '#00E5FF', 850, 240],
  ['linedot_6', 'LD6. Zigzag Frequency', 'Sharp Zigzag per Bin', 'Pola zigzag tajam per frekuensi bin yang bergerak lincah.', '#FFD700', 850, 240],
  ['linedot_7', 'LD7. Spiral Dot Field', 'Dots Along Spiral Track', 'Titik-titik menyebar indah di sepanjang jalur spiral.', '#00E5FF', 450, 450],
  ['linedot_8', 'LD8. Wave Dot Path', 'Dots Along Sine Wave', 'Titik-titik menyusuri jalur gelombang sinus yang bergerak.', '#FF6EC7', 850, 240],
  ['linedot_9', 'LD9. Matrix Rain Code', 'Falling Digital Code Rain', 'Huruf katakana hijau jatuh ala film The Matrix.', '#00FF7F', 850, 240],
  ['linedot_10', 'LD10. Starfield Depth', 'Stars Radiating from Center', 'Bintang-bintang memancar keluar dari pusat layar.', '#FFFFFF', 450, 450],
  ['linedot_11', 'LD11. Connection Web', 'Nodes with Distance Lines', 'Jaringan titik-titik saling terhubung garis laba-laba.', '#00E5FF', 850, 240],
  ['linedot_12', 'LD12. Laser Grid + Wave', 'Laser Grid with Wave Line', 'Garis gelombang tajam di atas grid laser futuristik.', '#39FF14', 850, 240],
  ['linedot_13', 'LD13. Frequency Bar Dots', 'Dot Column Spectrum Bars', 'Kolom bar digambar sebagai susunan titik-titik vertikal.', '#FF4500', 850, 240],
  ['linedot_14', 'LD14. Pixel Rain', 'Falling Square Pixels', 'Piksel kotak jatuh berhamburan sesuai amplitudo.', '#00E5FF', 850, 240],
  ['linedot_15', 'LD15. Laser Fan Lines', 'Center Fan Laser Beams', 'Sinar-sinar laser kipas memancar dari pusat.', '#FF1744', 450, 450],
  ['linedot_16', 'LD16. DNA Helix Dots', 'Double Helix Dot Strands', 'Dua untai titik DNA berpilin berputar anggun.', '#D500F9', 850, 240],
  ['linedot_17', 'LD17. Constellation Map', 'Connected Star Points', 'Peta konstelasi bintang terhubung garis antar bintang.', '#FFFFFF', 850, 240],
  ['linedot_18', 'LD18. Particle Grid', 'Hue-Mapped Grid Dots', 'Grid titik warna-warni bereaksi terhadap frekuensi.', '#FFFFFF', 850, 240],
  ['linedot_19', 'LD19. Morse Code Line', 'Dash-Dot Signal Pattern', 'Pola sinyal kode Morse strip-titik memanjang.', '#FFD700', 850, 240],
  ['linedot_20', 'LD20. Seismograph Line', 'ECG Spike Seismograph', 'Garis seismograf berdetik tajam mencatat getaran lagu.', '#FF1744', 850, 240]
];

const PARTICLE_LIST = [
  ['particle_1', 'P1. Explosion Burst', 'Radial Burst Particles', 'Partikel meledak dari pusat secara radial saat beat.', '#FF6D00', 450, 450],
  ['particle_2', 'P2. Fountain Spray', 'Upward Spray Particles', 'Partikel menyembur ke atas seperti air mancur cahaya.', '#00E5FF', 850, 240],
  ['particle_3', 'P3. Firefly Swarm', 'Glowing Floating Fireflies', 'Kunang-kunang bercahaya melayang lembut dan berkedip.', '#FFD700', 850, 240],
  ['particle_4', 'P4. Snow Fall', 'Gentle Falling Snowflakes', 'Salju lembut turun perlahan mengikuti irama tenang.', '#E0F7FA', 850, 240],
  ['particle_5', 'P5. Ember Rise', 'Rising Ember Sparks', 'Bara api membubung naik dari bawah ke atas.', '#FF6D00', 850, 240],
  ['particle_6', 'P6. Vortex Swirl', 'Spinning Vortex Particles', 'Partikel berputar kencang dalam pusaran vortex.', '#D500F9', 450, 450],
  ['particle_7', 'P7. Gravity Well', 'Particles Pulled to Center', 'Partikel ditarik ke pusat gravitasi saat bass melemah.', '#00E5FF', 450, 450],
  ['particle_8', 'P8. Comet Trails', 'Trailing Orbit Comets', 'Komet berekor cahaya mengorbit pusat layar.', '#00E5FF', 450, 450],
  ['particle_9', 'P9. Bubble Pop', 'Expanding Pop Circles', 'Lingkaran gelembung mengembang lalu meletus.', '#64B5F6', 850, 240],
  ['particle_10', 'P10. Dust Cloud', 'Floating Dust Motes', 'Debu halus melayang lembut di udara berlatar gelap.', '#888888', 850, 240],
  ['particle_11', 'P11. Spark Shower', 'Falling Spark Trails', 'Hujan percikan api dengan ekor cahaya keemasan.', '#FFD700', 850, 240],
  ['particle_12', 'P12. Galaxy Spiral', 'Spiral Arm Particles', 'Partikel membentuk lengan spiral galaksi berputar.', '#FFFFFF', 450, 450],
  ['particle_13', 'P13. Aurora Curtain', 'Layered Aurora Dots', 'Tirai aurora borealis berlapis warna hijau & ungu.', '#00FF7F', 850, 240],
  ['particle_14', 'P14. Firework Pop', 'Bass-Triggered Firework', 'Kembang api meledak meriah saat bass drop kuat.', '#FFD700', 450, 450],
  ['particle_15', 'P15. Pollen Drift', 'Gently Drifting Pollen', 'Serbuk sari bunga melayang lembut di angin musik.', '#FFFDE0', 850, 240],
  ['particle_16', 'P16. Smoke Rise', 'Rising Smoke Puffs', 'Kepulan asap naik perlahan bergoyang anggun.', '#888888', 850, 240],
  ['particle_17', 'P17. Rain Drops', 'Falling Rain Streaks', 'Tetesan hujan jatuh berkecepatan dinamis sesuai beat.', '#64B5F6', 850, 240],
  ['particle_18', 'P18. Confetti Pop', 'Colorful Confetti Burst', 'Confetti warna-warni bertebaran meriah saat bass.', '#FFFFFF', 450, 450],
  ['particle_19', 'P19. Lightning Bugs', 'Glowing Bug Particles', 'Partikel serangga bercahaya hijau neon menyala-padam.', '#AAFF00', 850, 240],
  ['particle_20', 'P20. Nebula Cloud', 'Cosmic Nebula Particles', 'Partikel nebula kosmik spiral berlatar angkasa.', '#7B68EE', 450, 450]
];

export const ALL_AVEE_PRESETS = [
  ...BARS_LIST.map(([mode, label, style, desc, color, w, h]) => ({
    mode, label, style, description: desc, cat: 'Bars', category: 'bars', color, defaultW: w, defaultH: h
  })),
  ...WAVE_LIST.map(([mode, label, style, desc, color, w, h]) => ({
    mode, label, style, description: desc, cat: 'Wave', category: 'wave', color, defaultW: w, defaultH: h
  })),
  ...RING_LIST.map(([mode, label, style, desc, color, w, h]) => ({
    mode, label, style, description: desc, cat: 'Ring', category: 'ring', color, defaultW: w, defaultH: h
  })),
  ...LIQUID_LIST.map(([mode, label, style, desc, color, w, h]) => ({
    mode, label, style, description: desc, cat: 'Liquid', category: 'liquid', color, defaultW: w, defaultH: h
  })),
  ...LINEDOT_LIST.map(([mode, label, style, desc, color, w, h]) => ({
    mode, label, style, description: desc, cat: 'LineDot', category: 'linedot', color, defaultW: w, defaultH: h
  })),
  ...PARTICLE_LIST.map(([mode, label, style, desc, color, w, h]) => ({
    mode, label, style, description: desc, cat: 'Particle', category: 'particle', color, defaultW: w, defaultH: h
  }))
];

/**
 * Main Avee Visualizer Frame Renderer
 */
export function renderAveeVisualizerFrame(ctx, width, height, audioState = {}, config = {}) {
  const mode = config.mode || 'round_cap_bar';
  const renderer = ALL_AVEE_RENDERERS[mode];
  if (!renderer) return false;

  const barCount = Math.max(16, Math.min(128, parseInt(config.barCount || 64, 10)));
  const gain = Math.max(0.1, parseFloat(config.gain || config.sensitivity || 100) / 100);
  const time = typeof audioState.time === 'number' ? audioState.time : (performance.now() / 1000);
  const rawFreqs = audioState.frequencies || new Float32Array(64);

  // Universal Color Normalization for Avee Visualizer Renderers
  const primaryColor = config.colorLeft || config.color || config.color1 || config.colorTop || config.colorA || config.colorInner || '#FF6EC7';
  const secondaryColor = config.colorRight || config.color2 || config.colorBot || config.colorBottom || config.colorB || config.colorOuter || '#00E5FF';
  const midColor = config.colorMid || config.color3 || '#06B6D4';

  const normalizedConfig = {
    ...config,
    color: primaryColor,
    colorLeft: primaryColor,
    color1: primaryColor,
    colorTop: config.colorTop || primaryColor,
    colorA: config.colorA || primaryColor,
    colorInner: config.colorInner || primaryColor,
    barColor: config.barColor || primaryColor,
    
    colorRight: secondaryColor,
    color2: secondaryColor,
    colorBot: config.colorBot || secondaryColor,
    colorBottom: config.colorBottom || secondaryColor,
    colorB: config.colorB || secondaryColor,
    colorOuter: config.colorOuter || secondaryColor,
    
    colorMid: midColor,
    color3: midColor
  };

  // Convert raw frequencies (Float32 or Uint8) into 0-255 Uint8Array with logarithmic distribution
  const fftData = new Uint8Array(barCount);
  const rawLen = rawFreqs.length || 64;
  for (let i = 0; i < barCount; i++) {
    const freqIdx = Math.min(rawLen - 1, Math.floor((i / barCount) * rawLen));
    const rawVal = rawFreqs[freqIdx] || 0;
    const scaledVal = (rawVal <= 1.0 ? rawVal * 255.0 : rawVal) * gain;
    fftData[i] = Math.min(255, Math.max(0, Math.floor(scaledVal)));
  }

  // Execute specific renderer
  renderer(ctx, fftData, normalizedConfig, width, height, time, config.id || 'def');
  return true;
}
