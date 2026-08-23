/**
 * CaYatur Unique Visualizer Modes Engine
 * Adapted from CaYatur/SoundVisualizer (MIT License)
 * Compatible with Astrofox / MediaFactory Canvas2D & WebGL rendering pipelines
 */

export const CAYATUR_VIZ_MODES = [
  { id: 'terrain', name: '3D Wireframe Terrain', label: '3D Terrain Horizon', description: 'Perspective wireframe audio landscape horizon' },
  { id: 'spectrogram', name: 'Spectrogram Waterfall', label: 'Spectrogram Heatmap', description: 'Realtime scrolling frequency waterfall heatmap' },
  { id: 'orb', name: '3D Energy Orb', label: '3D Energy Orb', description: 'Organic pulsing 3D liquid energy sphere' },
  { id: 'ribbon', name: 'Waveform Ribbon', label: 'Waveform Ribbon', description: 'Continuous flowing 3D audio ribbon' },
  { id: 'dotMatrix', name: 'Dot Matrix EQ', label: 'Dot Matrix EQ', description: 'Retro LED matrix console display' },
  { id: 'starburst', name: '360 Starburst Rays', label: '360 Starburst Rays', description: 'Radial projector light beams' }
];

export class CaYaturVisualizers {
  constructor() {
    this.time = 0;

    // 3D Terrain history
    this.terrainRows = 24;
    this.terrainCols = 48;
    this.terrainHist = [];
    for (let r = 0; r < this.terrainRows; r++) {
      this.terrainHist.push(new Float32Array(this.terrainCols));
    }
    this.terrainAcc = 0;

    // Spectrogram history
    this.specRows = 60;
    this.specHist = [];
    for (let r = 0; r < this.specRows; r++) {
      this.specHist.push(new Float32Array(80));
    }

    // Orb harmonics
    this.orbHarmonics = 5;
    this.orbAmp = new Float32Array(this.orbHarmonics);
    this.orbPhase = new Float32Array(this.orbHarmonics);
    this.orbRot = 0;

    // Ribbon history
    this.ribbonPoints = 40;
    this.ribbonHist = [];
    for (let i = 0; i < this.ribbonPoints; i++) {
      this.ribbonHist.push({ y: 0, amp: 0 });
    }
  }

  draw(mode, ctx, width, height, audio = {}, dt = 0.016) {
    this.time += dt;
    const fft = audio.fft || new Uint8Array(80);
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const treble = audio.treble || 0;

    ctx.save();
    switch (mode) {
      case 'terrain':
        this.renderTerrain(ctx, width, height, fft, bass, dt);
        break;
      case 'spectrogram':
        this.renderSpectrogram(ctx, width, height, fft, dt);
        break;
      case 'orb':
        this.renderOrb(ctx, width, height, fft, bass, dt);
        break;
      case 'ribbon':
        this.renderRibbon(ctx, width, height, fft, bass, dt);
        break;
      case 'dotMatrix':
        this.renderDotMatrix(ctx, width, height, fft);
        break;
      case 'starburst':
      default:
        this.renderStarburst(ctx, width, height, fft, bass, dt);
        break;
    }
    ctx.restore();
  }

  /* 1. 3D WIREFRAME TERRAIN LANDSCAPE */
  renderTerrain(ctx, w, h, fft, bass, dt) {
    this.terrainAcc += (dt || 0.016) * 24;
    if (this.terrainAcc >= 1) {
      this.terrainAcc -= 1;
      const newRow = new Float32Array(this.terrainCols);
      const binsPerCol = Math.floor(fft.length / this.terrainCols) || 1;
      for (let c = 0; c < this.terrainCols; c++) {
        // Symmetric center bass
        const distFromCenter = Math.abs(c - this.terrainCols / 2) / (this.terrainCols / 2);
        const binIdx = Math.min(fft.length - 1, Math.floor((1 - distFromCenter) * fft.length * 0.7));
        const val = (fft[binIdx] || 0) / 255;
        newRow[c] = val * (1 - distFromCenter * 0.4);
      }
      this.terrainHist.pop();
      this.terrainHist.unshift(newRow);
    }

    const cx = w / 2;
    const horizonY = h * 0.35;
    const bottomY = h * 0.95;

    ctx.lineWidth = 1.5;

    // Draw horizontal depth mesh lines
    for (let r = this.terrainRows - 1; r >= 0; r--) {
      const zNorm = r / (this.terrainRows - 1); // 0 (near) to 1 (far horizon)
      const persp = 1 / (1 + zNorm * 3.5);
      const rowY = horizonY + (bottomY - horizonY) * (1 - zNorm * zNorm);
      const rowWidth = w * (0.3 + 0.7 * (1 - zNorm));
      const rowXStart = cx - rowWidth / 2;

      ctx.beginPath();
      for (let c = 0; c < this.terrainCols; c++) {
        const x = rowXStart + (c / (this.terrainCols - 1)) * rowWidth;
        const heightAmp = (this.terrainHist[r][c] || 0) * h * 0.35 * persp;
        const y = rowY - heightAmp;

        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const alpha = (1 - zNorm * 0.7);
      ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.85})`; // Glowing synthwave orange
      ctx.stroke();
    }

    // Draw longitudinal wireframe lines connecting vertices
    ctx.lineWidth = 1.0;
    for (let c = 0; c < this.terrainCols; c += 2) {
      ctx.beginPath();
      for (let r = 0; r < this.terrainRows; r++) {
        const zNorm = r / (this.terrainRows - 1);
        const persp = 1 / (1 + zNorm * 3.5);
        const rowY = horizonY + (bottomY - horizonY) * (1 - zNorm * zNorm);
        const rowWidth = w * (0.3 + 0.7 * (1 - zNorm));
        const x = (cx - rowWidth / 2) + (c / (this.terrainCols - 1)) * rowWidth;
        const heightAmp = (this.terrainHist[r][c] || 0) * h * 0.35 * persp;
        const y = rowY - heightAmp;

        if (r === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.45)'; // Cyan wireframe
      ctx.stroke();
    }
  }

  /* 2. SPECTROGRAM WATERFALL HEATMAP */
  renderSpectrogram(ctx, w, h, fft, dt) {
    const newRow = new Float32Array(80);
    for (let i = 0; i < 80; i++) {
      newRow[i] = (fft[i] || 0) / 255;
    }
    this.specHist.pop();
    this.specHist.unshift(newRow);

    const cellW = w / 80;
    const cellH = h / this.specRows;

    for (let r = 0; r < this.specRows; r++) {
      const rowData = this.specHist[r];
      const y = r * cellH;

      for (let c = 0; c < 80; c++) {
        const val = rowData[c];
        if (val < 0.05) continue;

        const x = c * cellW;
        // Heatmap color: Blue -> Cyan -> Yellow -> Red/White
        let color;
        if (val < 0.3) {
          color = `rgba(14, 165, 233, ${val / 0.3})`;
        } else if (val < 0.6) {
          color = `rgba(168, 85, 247, ${(val - 0.3) / 0.3})`;
        } else if (val < 0.85) {
          color = `rgba(249, 115, 22, ${(val - 0.6) / 0.25})`;
        } else {
          color = `rgba(255, 255, 255, ${val})`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
      }
    }
  }

  /* 3. 3D PULSING ENERGY LIQUID ORB */
  renderOrb(ctx, w, h, fft, bass, dt) {
    const cx = w / 2;
    const cy = h / 2;
    const minDim = Math.min(w, h);
    const baseR = minDim * 0.28 * (1 + bass * 0.45);

    this.orbRot += dt * 0.4;
    const points = 120;

    // Update harmonic amplitudes from FFT bands
    for (let k = 0; k < this.orbHarmonics; k++) {
      const bin = Math.min(fft.length - 1, k * 12);
      const target = (fft[bin] || 0) / 255;
      this.orbAmp[k] += (target - this.orbAmp[k]) * 0.25;
      this.orbPhase[k] += dt * (0.8 + k * 0.4);
    }

    // Outer glow layers
    for (let layer = 2; layer >= 0; layer--) {
      const layerScale = 1 + layer * 0.12;
      const alpha = layer === 0 ? 0.9 : (0.4 - layer * 0.15);

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        let mod = 0;
        for (let k = 0; k < this.orbHarmonics; k++) {
          mod += Math.sin(theta * (k + 2) + this.orbPhase[k] + this.orbRot) * this.orbAmp[k] * 0.25;
        }

        const r = baseR * layerScale * (1 + mod);
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      if (layer === 0) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.4);
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.9)');
        grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.6)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0.1)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.lineWidth = 2.5 + (2 - layer) * 1.5;
      ctx.strokeStyle = layer === 0 ? '#ffffff' : (layer === 1 ? '#f97316' : '#00e5ff');
      ctx.stroke();
    }
  }

  /* 4. FLOWING 3D WAVEFORM RIBBON */
  renderRibbon(ctx, w, h, fft, bass, dt) {
    const avgAmp = bass * 0.6 + ((fft[20] || 0) / 255) * 0.4;
    this.ribbonHist.pop();
    this.ribbonHist.unshift({
      y: (Math.sin(this.time * 2.5) * 0.5 + Math.cos(this.time * 1.8) * 0.3) * (h * 0.3) * (1 + bass * 0.5),
      amp: avgAmp
    });

    const stepX = w / (this.ribbonPoints - 1);
    const cy = h / 2;

    ctx.beginPath();
    // Top line
    for (let i = 0; i < this.ribbonPoints; i++) {
      const x = i * stepX;
      const point = this.ribbonHist[i];
      const ribbonHalfH = 8 + point.amp * (h * 0.25);
      const y = cy + point.y - ribbonHalfH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // Bottom line
    for (let i = this.ribbonPoints - 1; i >= 0; i--) {
      const x = i * stepX;
      const point = this.ribbonHist[i];
      const ribbonHalfH = 8 + point.amp * (h * 0.25);
      const y = cy + point.y + ribbonHalfH;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.85)');
    grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.85)');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0.85)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  /* 5. RETRO DOT MATRIX SPECTRUM */
  renderDotMatrix(ctx, w, h, fft) {
    const cols = 24;
    const rows = 16;
    const padX = w * 0.05;
    const padY = h * 0.08;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const colStep = innerW / cols;
    const rowStep = innerH / rows;
    const dotR = Math.min(colStep, rowStep) * 0.36;

    for (let c = 0; c < cols; c++) {
      const binIdx = Math.floor((c / cols) * fft.length * 0.8);
      const level = (fft[binIdx] || 0) / 255;
      const litRows = Math.round(level * rows);
      const cx = padX + (c + 0.5) * colStep;

      for (let r = 0; r < rows; r++) {
        const cy = padY + (rows - 1 - r + 0.5) * rowStep;
        const isLit = r < litRows;

        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);

        if (isLit) {
          const rowRatio = r / rows;
          if (rowRatio > 0.8) ctx.fillStyle = '#ef4444';      // Top Red
          else if (rowRatio > 0.5) ctx.fillStyle = '#f97316'; // Mid Orange
          else ctx.fillStyle = '#10b981';                     // Bottom Green
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'; // Unlit dim dot
        }
        ctx.fill();
      }
    }
  }

  /* 6. 360 STARBURST RAYS */
  renderStarburst(ctx, w, h, fft, bass, dt) {
    const cx = w / 2;
    const cy = h / 2;
    const rays = 64;
    const minDim = Math.min(w, h);
    const innerR = minDim * 0.12;
    const maxR = minDim * 0.45;

    for (let i = 0; i < rays; i++) {
      const theta = (i / rays) * Math.PI * 2 + this.time * 0.2;
      const binIdx = Math.floor((Math.abs(i - rays / 2) / (rays / 2)) * fft.length * 0.7);
      const val = (fft[binIdx] || 0) / 255;
      const rayLen = innerR + val * (maxR - innerR) * (1 + bass * 0.5);

      const x1 = cx + Math.cos(theta) * innerR;
      const y1 = cy + Math.sin(theta) * innerR;
      const x2 = cx + Math.cos(theta) * rayLen;
      const y2 = cy + Math.sin(theta) * rayLen;

      ctx.lineWidth = 2.0 + val * 3.0;
      ctx.strokeStyle = `rgba(249, 115, 22, ${0.35 + val * 0.65})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}
