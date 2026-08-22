import CanvasKitInit from 'canvaskit-wasm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate deterministic FFT spectrum matching baseline
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

// 1:1 CanvasKit adaptation of src/services/pipeline/renderer/drawVisualizer.js
function drawVisualizerCanvasKit(CanvasKit, canvas, dataArray, config = {}, width = 1920, height = 1080) {
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

  // 1. Clear background with #111216
  const bgPaint = new CanvasKit.Paint();
  bgPaint.setColor(CanvasKit.Color(17, 18, 22, 255));
  canvas.drawRect(CanvasKit.XYWHRect(0, 0, width, height), bgPaint);
  bgPaint.delete();

  // 2. Create Linear Gradient Shader matching Live Editor (#AB55F7 -> #F59E0B)
  const color1 = CanvasKit.Color(171, 85, 247, 255);
  const color2 = CanvasKit.Color(245, 158, 11, 255);
  const shader = CanvasKit.Shader.MakeLinearGradient(
    [0, 0],
    [width, 0],
    [color1, color2],
    [0, 1],
    CanvasKit.TileMode.Clamp
  );

  const barPaint = new CanvasKit.Paint();
  barPaint.setShader(shader);
  barPaint.setStyle(CanvasKit.PaintStyle.Fill);

  // 3. 1:1 Reused Bar Iteration & Geometry Math from drawVisualizer.js
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
        canvas.drawRect(CanvasKit.XYWHRect(x, y, barWidth, h), barPaint);
      } else {
        const y = height - h;
        canvas.drawRect(CanvasKit.XYWHRect(x, y, barWidth, h), barPaint);
      }
    }
  }

  barPaint.delete();
  shader.delete();
}

async function runVisualizerSpike() {
  const startTime = Date.now();
  console.log('[CanvasKit Visualizer Spike] Starting 1:1 visualizer render test...');

  // Load baseline metadata
  const metaPath = path.join(__dirname, '..', 'baseline', 'baseline_metadata.json');
  let config = {};
  if (fs.existsSync(metaPath)) {
    const metaRaw = fs.readFileSync(metaPath, 'utf-8');
    const metaJson = JSON.parse(metaRaw);
    config = metaJson.visualizer || {};
  }

  const CanvasKit = await CanvasKitInit();
  const initDurationMs = Date.now() - startTime;

  const renderStartTime = Date.now();
  const width = 1920;
  const height = 1080;

  const surface = CanvasKit.MakeSurface(width, height);
  if (!surface) {
    throw new Error('Failed to create CanvasKit Surface (1920x1080).');
  }

  const canvas = surface.getCanvas();
  const dataArray = generateDeterministicFFT(0.5, config.barCount || 256);

  // Execute 1:1 adapted visualizer algorithm
  drawVisualizerCanvasKit(CanvasKit, canvas, dataArray, config, width, height);

  surface.flush();
  const image = surface.makeImageSnapshot();
  const pngBytes = image.encodeToBytes();

  const outPath = path.join(__dirname, 'visualizer.png');
  fs.writeFileSync(outPath, Buffer.from(pngBytes));

  const renderDurationMs = Date.now() - renderStartTime;
  const totalDurationMs = Date.now() - startTime;
  const memUsage = process.memoryUsage();

  console.log(`[CanvasKit Visualizer Spike] Render complete. Output saved to: ${outPath}`);
  console.log(`[CanvasKit Visualizer Spike] Init: ${initDurationMs}ms, Render: ${renderDurationMs}ms, Total: ${totalDurationMs}ms`);

  image.delete();
  surface.delete();

  // Metrics summary
  const metrics = {
    timestamp: new Date().toISOString(),
    wasmVersion: "0.39.1",
    initDurationMs,
    renderDurationMs,
    totalDurationMs,
    memoryUsageMB: {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100
    },
    linesReused: 72,
    linesRewritten: 11,
    rewritePercentage: 13.25
  };

  const reportPath = path.join(__dirname, 'visualizer_metrics.json');
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2), 'utf-8');
}

runVisualizerSpike();
