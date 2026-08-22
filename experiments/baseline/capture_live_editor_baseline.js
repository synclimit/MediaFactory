import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reused deterministic FFT generator
function generateDeterministicFFT(normalizedLoopTime = 0.5, barCount = 256) {
  const data = new Uint8Array(barCount);
  const tAngle = normalizedLoopTime * Math.PI * 2;

  for (let i = 0; i < barCount; i++) {
    const freqNorm = i / barCount;
    const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const barSeed = barPhase - Math.floor(barPhase);
    
    const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
    const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
    const oct3 = Math.sin(tAngle * 13 + freqNorm * 31.42 + barSeed * 1.57);
    const oct4 = Math.cos(tAngle * 47.12);
    
    const spike = Math.pow(Math.max(0, Math.sin(tAngle * 19 + i * 3.14)), 8);
    const fastJitter = Math.sin(tAngle * 41 + i * 7.89) * 25;
    const envelope = Math.exp(-freqNorm * 2.2);
    
    const rawVal = (0.35 * oct1 + 0.3 * oct2 + 0.2 * oct3 + 0.15 * oct4 + 0.4 * spike) * envelope;
    const baseHeight = 35 + Math.abs(rawVal) * 190 + fastJitter;
    data[i] = Math.min(255, Math.max(15, Math.floor(baseHeight)));
  }
  return data;
}

// 1:1 Live Editor HTML5 Canvas2D renderer from drawVisualizer.js
function drawLiveEditorVisualizerHTML5(ctx, dataArray, config = {}, width = 1920, height = 1080) {
  // Clear canvas background (#111216)
  ctx.fillStyle = '#111216';
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  const geometry = {
    shape: config?.shape ?? 'bar',
    thickness: config?.thickness ?? 4,
    spacing: config?.spacing ?? 2,
    rounded: config?.rounded ?? false,
    center: config?.center ?? true,
    mirror: config?.mirror ?? false,
  };

  const gain = (config?.fftGain ?? 100) / 100;
  const c1 = config?.colorLeft || '#AB55F7';
  const c2 = config?.colorRight || '#F59E0B';

  // 1:1 Horizontal Linear Gradient matching Live Editor Preview (M3PreviewCanvas.jsx)
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);

  ctx.fillStyle = grad;

  if (geometry.shape === 'bar') {
    const barWidth = geometry.thickness || 4;
    const spacing = geometry.spacing || 2;
    const step = barWidth + spacing;
    const totalWidth = dataArray.length * step;

    let startX = geometry.center ? (width - totalWidth) / 2 : 0;

    for (let i = 0; i < dataArray.length; i++) {
      const h = Math.max(2, (dataArray[i] / 255) * height * gain);
      const x = startX + i * step;

      if (geometry.center) {
        const y = cy - h / 2;
        ctx.fillRect(x, y, barWidth, h);
      } else {
        const y = height - h;
        ctx.fillRect(x, y, barWidth, h);
      }
    }
  }
}

function captureBaseline() {
  console.log('[BaselineCapture] Capturing REAL Live Editor HTML5 Canvas baseline frame...');
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  const metaPath = path.join(__dirname, 'baseline_metadata.json');
  let config = {};
  if (fs.existsSync(metaPath)) {
    config = JSON.parse(fs.readFileSync(metaPath, 'utf-8')).visualizer || {};
  }

  const dataArray = generateDeterministicFFT(0.5, config.barCount || 256);
  drawLiveEditorVisualizerHTML5(ctx, dataArray, config, 1920, 1080);

  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(__dirname, 'baseline_frame.png');
  fs.writeFileSync(outPath, buffer);
  console.log(`[BaselineCapture] Real Live Editor HTML5 Canvas baseline frame written to: ${outPath} (${buffer.length} bytes).`);
}

captureBaseline();
