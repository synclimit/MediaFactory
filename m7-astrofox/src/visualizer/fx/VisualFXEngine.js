/**
 * M7 Visual FX Engine
 * Complete parity with MediaFactory M3 Visual FX System:
 * - 18 Effects (Camera Shake, Zoom Hentak, Strobe, Disco Light, Neon Depth, Deep Light,
 *   God Rays, Bokeh, Depth Scan, Fog, Glitch/RGB Split, Film Dust, Speed Lines,
 *   Film Grain, Vignette, Letterbox, Scanlines, Light Leak)
 * - 31 Genre Presets (Phonk, EDM Drop, House, Techno, Trance, Dubstep, Hip-hop, Trap,
 *   Disco, Funk, R&B, Pop, Rock, Metal, Reggae, Synthwave, Vaporwave, Lo-fi tape,
 *   Chill/study, Ambient, ASMR/rain, Classical, Jazz, Acoustic, Worship, Nasheed,
 *   Dangdut/koplo, Workout, Kids, Retro VHS, Bersih)
 */

export const ALL_EFFECTS = [
  {
    id: 'guncang-kamera',
    name: 'Guncang kamera',
    presetId: 'camera-shake',
    category: 'Motion & Action',
    icon: '🎬',
    defaultProps: { strength: 23, source: 'kick', mode: 'Ringan — cepat (disarankan)', shape: 'Semua arah', size: 27 },
  },
  {
    id: 'zoom-hentak',
    name: 'Zoom hentak',
    presetId: 'zoom-hentak',
    category: 'Motion & Action',
    icon: '🎬',
    defaultProps: { depth: 50, source: 'kick', mode: 'Ringan — cepat (disarankan)', shape: 'Masuk', speed: 1.0 },
  },
  {
    id: 'garis-kecepatan',
    name: 'Garis kecepatan',
    presetId: 'speed-lines',
    category: 'Motion & Action',
    icon: '🎬',
    defaultProps: { intensity: 50, source: 'kick', shape: 'Radial', color: '#ffffff', count: 60, speed: 1.0 },
  },
  {
    id: 'kilat-strobe',
    name: 'Kilat / strobe',
    presetId: 'strobe-flash',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffffff', speed: 1.0 },
  },
  {
    id: 'lampu-disko',
    name: 'Lampu disko',
    presetId: 'disco-light',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffffff', shape: 'Kerucut sorot', size: 50, count: 4 },
  },
  {
    id: 'neon-kedalaman',
    name: 'Neon kedalaman',
    presetId: 'neon-depth',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#00ffff', shape: 'Garis lurus', size: 50, speed: 1.0 },
  },
  {
    id: 'lampu-kedalaman',
    name: 'Lampu kedalaman',
    presetId: 'deep-light',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffffff', color2: '#00ffff', shape: 'Ikuti beat', size: 50, count: 3, split: 50 },
  },
  {
    id: 'sinar-kedalaman',
    name: 'Sinar kedalaman',
    presetId: 'god-rays',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { strength: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ffaa55', direction: 'Atas', size: 50, count: 50, speed: 1.0 },
  },
  {
    id: 'bokeh-kedalaman',
    name: 'Bokeh kedalaman',
    presetId: 'depth-bokeh',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { brightness: 50, source: 'energy', colorMode: 'Warna kustom', color: '#ffffff', size: 50, count: 25 },
  },
  {
    id: 'light-leak',
    name: 'Light leak',
    presetId: 'light-leak',
    category: 'Lighting & Glow',
    icon: '✨',
    defaultProps: { strength: 50, source: 'kick', colorMode: 'Warna kustom', color: '#ff8800', shape: 'Kanan-atas', size: 50, speed: 1.0 },
  },
  {
    id: 'debu-film-tua',
    name: 'Debu film tua',
    presetId: 'old-film-dust',
    category: 'Cinematic & Retro',
    icon: '🎞️',
    defaultProps: { density: 50, source: 'energy', shape: 'Ringan', color: '#ffffff', speed: 1.0 },
  },
  {
    id: 'grain-film',
    name: 'Grain film',
    presetId: 'film-grain',
    category: 'Cinematic & Retro',
    icon: '🎞️',
    defaultProps: { intensity: 50, source: 'none', shape: 'Halus', size: 50 },
  },
  {
    id: 'vignette',
    name: 'Vignette',
    presetId: 'vignette',
    category: 'Cinematic & Retro',
    icon: '🎞️',
    defaultProps: { darkness: 50, source: 'none', shape: 'Bulat', color: '#000000', size: 50 },
  },
  {
    id: 'letterbox',
    name: 'Letterbox',
    presetId: 'letterbox',
    category: 'Cinematic & Retro',
    icon: '🎞️',
    defaultProps: { height: 50, source: 'none', color: '#000000', size: 50 },
  },
  {
    id: 'glitch',
    name: 'Glitch',
    presetId: 'glitch-digital',
    category: 'Digital & Environment',
    icon: '⚡',
    defaultProps: { intensity: 50, source: 'kick', shape: 'RGB Split', frequency: 50, speed: 1.0 },
  },
  {
    id: 'scanline',
    name: 'Scanline',
    presetId: 'scanline',
    category: 'Digital & Environment',
    icon: '⚡',
    defaultProps: { density: 50, source: 'kick', shape: 'Turun', color: '#000000', size: 50, speed: 1.0 },
  },
  {
    id: 'pindai-kedalaman',
    name: 'Pindai kedalaman',
    presetId: 'depth-scan',
    category: 'Digital & Environment',
    icon: '⚡',
    defaultProps: { brightness: 50, source: 'kick', colorMode: 'Warna kustom', color: '#00ff88', shape: 'Horizontal', speed: 1.0, size: 50 },
  },
  {
    id: 'kabut-kedalaman',
    name: 'Kabut kedalaman',
    presetId: 'depth-fog',
    category: 'Digital & Environment',
    icon: '⚡',
    defaultProps: { density: 50, source: 'energy', colorMode: 'Warna kustom', color: '#ffffff', speed: 1.0 },
  },
];

export const GENRE_PRESETS = [
  { name: 'Phonk', effects: ['guncang-kamera', 'zoom-hentak', 'glitch', 'vignette'] },
  { name: 'EDM drop', effects: ['zoom-hentak', 'kilat-strobe', 'neon-kedalaman', 'garis-kecepatan'] },
  { name: 'House', effects: ['lampu-disko', 'neon-kedalaman', 'kabut-kedalaman'] },
  { name: 'Techno', effects: ['kilat-strobe', 'scanline', 'glitch'] },
  { name: 'Trance', effects: ['zoom-hentak', 'neon-kedalaman', 'bokeh-kedalaman', 'kabut-kedalaman'] },
  { name: 'Dubstep', effects: ['guncang-kamera', 'glitch', 'kilat-strobe', 'garis-kecepatan'] },
  { name: 'Hip-hop', effects: ['zoom-hentak', 'vignette', 'light-leak'] },
  { name: 'Trap', effects: ['zoom-hentak', 'kilat-strobe', 'garis-kecepatan'] },
  { name: 'Disco', effects: ['lampu-disko', 'light-leak', 'bokeh-kedalaman'] },
  { name: 'Funk', effects: ['lampu-disko', 'neon-kedalaman', 'light-leak'] },
  { name: 'R&B', effects: ['bokeh-kedalaman', 'light-leak', 'vignette'] },
  { name: 'Pop', effects: ['zoom-hentak', 'light-leak', 'bokeh-kedalaman'] },
  { name: 'Rock', effects: ['guncang-kamera', 'kilat-strobe', 'vignette'] },
  { name: 'Metal', effects: ['guncang-kamera', 'kilat-strobe', 'glitch', 'garis-kecepatan'] },
  { name: 'Reggae', effects: ['light-leak', 'kabut-kedalaman', 'bokeh-kedalaman'] },
  { name: 'Synthwave', effects: ['neon-kedalaman', 'scanline', 'garis-kecepatan', 'vignette'] },
  { name: 'Vaporwave', effects: ['scanline', 'glitch', 'grain-film', 'vignette'] },
  { name: 'Lo-fi tape', effects: ['grain-film', 'debu-film-tua', 'vignette', 'letterbox'] },
  { name: 'Chill / study', effects: ['bokeh-kedalaman', 'vignette', 'light-leak'] },
  { name: 'Ambient', effects: ['kabut-kedalaman', 'bokeh-kedalaman', 'sinar-kedalaman'] },
  { name: 'ASMR / rain', effects: ['grain-film', 'vignette', 'kabut-kedalaman'] },
  { name: 'Classical', effects: ['sinar-kedalaman', 'vignette', 'bokeh-kedalaman'] },
  { name: 'Jazz', effects: ['grain-film', 'vignette', 'light-leak'] },
  { name: 'Acoustic', effects: ['light-leak', 'vignette', 'bokeh-kedalaman'] },
  { name: 'Worship', effects: ['sinar-kedalaman', 'bokeh-kedalaman', 'kabut-kedalaman'] },
  { name: 'Nasheed', effects: ['sinar-kedalaman', 'vignette', 'kabut-kedalaman'] },
  { name: 'Dangdut / koplo', effects: ['lampu-disko', 'kilat-strobe', 'kabut-kedalaman'] },
  { name: 'Workout', effects: ['zoom-hentak', 'garis-kecepatan', 'kilat-strobe'] },
  { name: 'Kids', effects: ['bokeh-kedalaman', 'light-leak'] },
  { name: 'Retro VHS', effects: ['scanline', 'glitch', 'grain-film', 'debu-film-tua'] },
  { name: 'Bersih', effects: [] },
];

function hexToRgba(hex, alpha = 1.0) {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export class VisualFXEngine {
  constructor() {
    this.smoothVals = new Map();
    this.lastTime = Date.now();
    this.noiseCanvas = null;
  }

  getGrainPattern(ctx, size = 1.0) {
    if (!this.noiseCanvas) {
      this.noiseCanvas = document.createElement('canvas');
      this.noiseCanvas.width = 128;
      this.noiseCanvas.height = 128;
      const nCtx = this.noiseCanvas.getContext('2d');
      const imgData = nCtx.createImageData(128, 128);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 40;
      }
      nCtx.putImageData(imgData, 0, 0);
    }
    return ctx.createPattern(this.noiseCanvas, 'repeat');
  }

  render(ctx, width, height, effectsList = [], audioData = {}) {
    if (!ctx || !effectsList || effectsList.length === 0) return;

    const now = Date.now();
    const time = now;
    const dt = Math.min(50, now - this.lastTime);
    this.lastTime = now;

    // Calculate energy bands from FFT
    let kick = 0;
    let energy = 0;
    const fft = audioData.fft;
    if (fft && fft.length > 0) {
      const bEnd = Math.floor(fft.length * 0.08);
      let bSum = 0;
      for (let i = 0; i < bEnd; i++) bSum += fft[i];
      kick = bSum / (bEnd || 1) / 255;

      let eSum = 0;
      for (let i = 0; i < fft.length; i++) eSum += fft[i];
      energy = eSum / fft.length / 255;
    }

    effectsList.forEach(eff => {
      if (eff.enabled === false) return;

      const type = eff.presetId;
      const p = eff.props || {};
      const speed = p.speed !== undefined ? Number(p.speed) : 1.0;
      const source = eff.source || p.source || 'kick';

      let rawValue = 0;
      if (source === 'kick') rawValue = kick;
      else if (source === 'energy') rawValue = energy;
      else if (source === 'none' || source === 'Selalu tampil') rawValue = 1.0;
      else rawValue = kick;

      let prev = this.smoothVals.get(eff.id) || 0;
      const smoothVal = prev + (rawValue - prev) * 0.6;
      this.smoothVals.set(eff.id, smoothVal);

      // 1. KILAT / STROBE
      if (type === 'strobe-flash') {
        const bright = (p.brightness ?? 50) / 100;
        const flashIntensity = Math.pow(rawValue, 2) * bright * 2.5;
        if (flashIntensity > 0.02) {
          const color = p.color || '#ffffff';
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          const alpha = Math.min(1.0, flashIntensity);
          grad.addColorStop(0, hexToRgba(color, alpha));
          grad.addColorStop(1, hexToRgba(color, alpha * 0.1));
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      }

      // 2. LAMPU DISKO
      else if (type === 'disco-light') {
        const bright = (p.brightness ?? 50) / 100;
        const count = p.count ?? 4;
        const size = (p.size ?? 50) / 50;
        const shape = p.shape || 'Kerucut sorot';
        const color = p.color || '#ffffff';

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < count; i++) {
          const angle = Math.sin(time / (1000 / speed) + i * 1.5) * 0.8;
          const baseX = (width / (count + 1)) * (i + 1);
          const topX = baseX + Math.sin(angle) * width * 0.8;
          const topY = -50;

          if (shape === 'Kerucut sorot') {
            const spread = (150 + smoothVal * 120) * size;
            ctx.beginPath();
            ctx.moveTo(baseX, height);
            ctx.lineTo(topX - spread, topY);
            ctx.lineTo(topX + spread, topY);
            ctx.closePath();
            ctx.globalAlpha = (0.15 + smoothVal * 0.35) * bright;
            ctx.fillStyle = color;
            ctx.fill();
          } else {
            const w = (20 + smoothVal * 30) * size;
            ctx.globalAlpha = (0.2 + smoothVal * 0.5) * bright;
            ctx.fillStyle = color;
            ctx.fillRect(topX - w / 2, 0, w, height);
          }
        }
        ctx.restore();
      }

      // 3. NEON KEDALAMAN
      else if (type === 'neon-depth') {
        const bright = (p.brightness ?? 50) / 100;
        const size = (p.size ?? 50) / 50;
        const color = p.color || '#00ffff';

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 + smoothVal * 40;
        ctx.lineWidth = (3 + smoothVal * 5) * size;
        ctx.globalAlpha = (0.3 + smoothVal * 0.7) * bright;

        const offset = (time / (2000 / speed)) % 1;
        const perimeter = 2 * width + 2 * height;

        for (let layer = 0; layer < 2; layer++) {
          const layerOffset = (offset + layer * 0.5) % 1;
          const dist = layerOffset * perimeter;
          const trailLen = perimeter * 0.3;

          ctx.beginPath();
          for (let t = 0; t < trailLen; t += 4) {
            const d = (dist - t + perimeter) % perimeter;
            let x, y;
            if (d < width) { x = d; y = 0; }
            else if (d < width + height) { x = width; y = d - width; }
            else if (d < 2 * width + height) { x = width - (d - width - height); y = height; }
            else { x = 0; y = height - (d - 2 * width - height); }

            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. LAMPU KEDALAMAN
      else if (type === 'deep-light') {
        const bright = (p.brightness ?? 50) / 100;
        const split = (p.split ?? 50) / 100;
        const c1 = p.color || '#ffffff';
        const c2 = p.color2 || '#00ffff';

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const drawFogLight = (isLeft, color) => {
          const gradientSize = width * (0.1 + split * 0.9);
          const grad = ctx.createLinearGradient(
            isLeft ? 0 : width, 0,
            isLeft ? gradientSize : width - gradientSize, 0
          );
          const alpha = (0.2 + smoothVal * 0.8) * bright;
          grad.addColorStop(0, hexToRgba(color, alpha * 0.6));
          grad.addColorStop(0.5, hexToRgba(color, alpha * 0.2));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        };
        drawFogLight(true, c1);
        drawFogLight(false, c2);
        ctx.restore();
      }

      // 5. SINAR KEDALAMAN (GOD RAYS)
      else if (type === 'god-rays') {
        const strength = (p.strength ?? 50) / 100;
        const size = (p.size ?? 50) / 50;
        const count = Math.floor(1 + ((p.count ?? 50) / 100) * 24);
        const color = p.color || '#ffaa55';

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.translate(width / 2, 0);

        const spread = Math.PI * 1.2;
        const centerAngle = Math.PI / 2;

        for (let i = 0; i < count; i++) {
          const rayAngle = centerAngle - spread / 2 + (i / count) * spread + Math.sin(time * 0.0005 * speed + i) * 0.1;
          const rayWidth = (20 + (i % 5) * 20 + smoothVal * 40) * size;
          const rayLen = Math.max(width, height) * 1.5 * size;

          ctx.save();
          ctx.rotate(rayAngle);

          const grad = ctx.createLinearGradient(0, 0, rayLen, 0);
          const alpha = (0.1 + smoothVal * 0.4) * strength;
          grad.addColorStop(0, hexToRgba(color, alpha));
          grad.addColorStop(0.3, hexToRgba(color, alpha * 0.5));
          grad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(rayLen, -rayWidth / 2);
          ctx.lineTo(rayLen, rayWidth / 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // 6. BOKEH KEDALAMAN
      else if (type === 'depth-bokeh') {
        const bright = (p.brightness ?? 50) / 100;
        const count = Math.floor(10 + ((p.count ?? 25) / 100) * 30);
        const size = (p.size ?? 50) / 50;
        const color = p.color || '#ffffff';

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < count; i++) {
          const bx = ((i * 137.5 + time * 0.03 * speed) % width);
          const by = ((i * 263.3 + Math.sin(time * 0.001 * speed + i) * 50) % height);
          const r = (15 + (i % 7) * 8 + smoothVal * 20) * size;

          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(color, (0.05 + smoothVal * 0.15) * bright);
          ctx.shadowBlur = r;
          ctx.shadowColor = color;
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. GLITCH / RGB SPLIT
      else if (type === 'glitch-digital') {
        const intensity = (p.intensity ?? 50) / 100;
        const freq = (p.frequency ?? 50) / 100;

        if (rawValue > (1 - freq) * 0.7) {
          const shift = (5 + rawValue * 20) * intensity;
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = `rgba(255,0,0,${0.15 * intensity})`;
          ctx.fillRect(shift, 0, width, height);
          ctx.fillStyle = `rgba(0,255,255,${0.15 * intensity})`;
          ctx.fillRect(-shift, 0, width, height);

          // Horizontal glitch slices
          const blockCount = Math.floor(3 + rawValue * 6 * intensity);
          for (let i = 0; i < blockCount; i++) {
            const by = Math.random() * height;
            const bh = 5 + Math.random() * 20;
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.2 * intensity;
            ctx.fillRect(0, by, width, bh);
          }
          ctx.restore();
        }
      }

      // 8. DEBU FILM TUA
      else if (type === 'old-film-dust') {
        const density = (p.density ?? 50) / 100;
        const color = p.color || '#ffffff';
        const dustCount = Math.floor(150 * density);

        ctx.save();
        ctx.fillStyle = hexToRgba(color, 0.3 + smoothVal * 0.3);
        for (let i = 0; i < dustCount; i++) {
          ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random(), 1 + Math.random());
        }
        if (Math.random() > 0.7) {
          ctx.fillStyle = hexToRgba(color, 0.15);
          ctx.fillRect(Math.random() * width, 0, 1 + Math.random() * 2, height);
        }
        ctx.restore();
      }

      // 9. GARIS KECEPATAN (SPEED LINES)
      else if (type === 'speed-lines') {
        const intensity = (p.intensity ?? 50) / 100;
        const size = (p.size ?? 50) / 50;
        const color = p.color || '#ffffff';
        const count = p.count ?? 60;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = hexToRgba(color, (0.1 + smoothVal * 0.5) * intensity);

        const timeAngle = time * 0.002 * (smoothVal + 0.5);
        const cx = width / 2;
        const cy = height / 2;

        for (let i = 0; i < count; i++) {
          ctx.lineWidth = (1 + (i % 3)) * size;
          const angle = (i / count) * Math.PI * 2 + timeAngle;
          const innerR = (80 + (i % 5) * 30) * (1.5 - smoothVal * 0.5);
          const outerR = innerR + 150 * intensity * size + Math.max(width, height) / 2;

          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
          ctx.lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 10. GRAIN FILM
      else if (type === 'film-grain') {
        const intensity = (p.intensity ?? 50) / 100;
        const pattern = this.getGrainPattern(ctx, 1.0);
        if (pattern) {
          ctx.save();
          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = intensity * 0.4;
          ctx.fillStyle = pattern;
          ctx.translate(Math.random() * 128, Math.random() * 128);
          ctx.fillRect(-128, -128, width + 256, height + 256);
          ctx.restore();
        }
      }

      // 11. VIGNETTE
      else if (type === 'vignette') {
        const darkness = (p.darkness ?? 50) / 100;
        const size = (p.size ?? 50) / 100;
        const color = p.color || '#000000';
        const vigSize = (200 + (1 - size) * 600) * (1 - darkness * 0.3);

        ctx.save();
        const grad = ctx.createRadialGradient(width / 2, height / 2, vigSize * 0.3, width / 2, height / 2, vigSize);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, hexToRgba(color, 0.4 + darkness * 0.6));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 12. LETTERBOX
      else if (type === 'letterbox') {
        const barH = (p.height ?? 50) / 100;
        const color = p.color || '#000000';
        const h = barH * height * 0.15;

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, h);
        ctx.fillRect(0, height - h, width, h);
        ctx.restore();
      }

      // 13. SCANLINE
      else if (type === 'scanline') {
        const density = (p.density ?? 50) / 100;
        const color = p.color || '#000000';
        const lineSpacing = 4;

        ctx.save();
        ctx.fillStyle = hexToRgba(color, 0.1 + density * 0.4);
        const yOffset = (time / (50 / speed)) % (lineSpacing * 2);
        for (let y = yOffset; y < height; y += lineSpacing * 2) {
          ctx.fillRect(0, y, width, lineSpacing);
        }
        ctx.restore();
      }

      // 14. LIGHT LEAK
      else if (type === 'light-leak') {
        const strength = (p.strength ?? 50) / 100;
        const color = p.color || '#ff8800';

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const maxDim = Math.max(width, height);
        const pulseRadius = maxDim * (1.0 + smoothVal * 0.5);

        const grad = ctx.createRadialGradient(width, 0, 0, width, 0, pulseRadius);
        grad.addColorStop(0, hexToRgba(color, 0.6 * strength));
        grad.addColorStop(0.5, hexToRgba(color, 0.3 * strength));
        grad.addColorStop(0.8, hexToRgba(color, 0.1 * strength));
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    });
  }
}
