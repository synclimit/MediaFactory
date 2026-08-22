import puppeteer from 'puppeteer';
import crypto from 'crypto';
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
  return Array.from(data);
}

/**
 * Public Reusable MF-3000 Rendering Function
 * Exposes a clean API for rendering deterministic RGBA frames via Puppeteer Headless Chromium.
 */
export async function renderFrame({
  fft = null,
  width = 1920,
  height = 1080,
  timestamp = 5.0,
  config = null
} = {}) {
  const startTime = Date.now();
  const outDir = path.join(__dirname);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Load baseline metadata if config not provided
  if (!config) {
    const metaPath = path.join(__dirname, '..', 'baseline', 'baseline_metadata.json');
    if (fs.existsSync(metaPath)) {
      config = JSON.parse(fs.readFileSync(metaPath, 'utf-8')).visualizer || {};
    } else {
      config = {
        barCount: 256,
        colorLeft: '#AB55F7',
        colorRight: '#F59E0B',
        width: 1200,
        height: 200,
        center: true,
        thickness: 4,
        spacing: 2
      };
    }
  }

  const dataArray = fft || generateDeterministicFFT(0.5, config.barCount || 256);

  // Read REAL production drawVisualizer.js source code directly
  const drawVisPath = path.resolve(__dirname, '../../src/services/pipeline/renderer/drawVisualizer.js');
  let drawVisCode = fs.readFileSync(drawVisPath, 'utf-8');
  // Strip ES export keyword so it can be evaluated directly in browser page context
  drawVisCode = drawVisCode.replace(/^export\s+/gm, '');

  console.log('[Chromium Renderer] Launching Puppeteer Headless Chromium (1:1 DPI scale)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width, height, deviceScaleFactor: 1 },
    args: [
      '--force-device-scale-factor=1',
      '--high-dpi-support=1',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--enable-gpu-rasterization'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // Set page HTML content with 1080p canvas
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head><style>body { margin: 0; padding: 0; background: #000; overflow: hidden; }</style></head>
      <body>
        <canvas id="stage" width="${width}" height="${height}"></canvas>
      </body>
      </html>
    `);

    // Execute rendering and trace capture inside Headless Chromium browser context
    const renderResult = await page.evaluate(async (dataArr, cfg, w, h, visCode) => {
      // 1. Inject production drawVisualizer function
      const fn = new Function('ctx', 'dataArray', 'config', 'width', 'height', 'clearCanvas', `
        ${visCode}
        drawVisualizer(ctx, dataArray, config, width, height, clearCanvas);
      `);

      const canvas = document.getElementById('stage');
      const rawCtx = canvas.getContext('2d');

      // 2. Wrap Context with Draw Command & Geometry Tracing Adapter
      const drawCommands = [];
      const geometryTrace = [];

      const origFillRect = rawCtx.fillRect.bind(rawCtx);
      const origCreateLinearGradient = rawCtx.createLinearGradient.bind(rawCtx);

      rawCtx.createLinearGradient = function(x0, y0, x1, y1) {
        drawCommands.push({ type: 'createLinearGradient', x0, y0, x1, y1 });
        return origCreateLinearGradient(x0, y0, x1, y1);
      };

      rawCtx.fillRect = function(x, y, width, height) {
        drawCommands.push({
          type: 'fillRect',
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          width,
          height: Math.round(height * 100) / 100
        });

        // Record geometry trace if it's a visualizer bar
        if (width === (cfg.thickness || 4)) {
          geometryTrace.push({
            barIndex: geometryTrace.length,
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            width,
            height: Math.round(height * 100) / 100
          });
        }
        return origFillRect(x, y, width, height);
      };

      // 3. Clear canvas with #111216 background
      rawCtx.fillStyle = '#111216';
      rawCtx.fillRect(0, 0, w, h);

      // 4. Run real production drawVisualizer algorithm
      fn(rawCtx, dataArr, cfg, w, h, false);

      // 5. Extract raw RGBA ImageData pixel buffer & PNG DataURL
      const imgData = rawCtx.getImageData(0, 0, w, h);
      const rgbaArray = Array.from(imgData.data);
      const dataUrl = canvas.toDataURL('image/png');

      return {
        rgbaArray,
        dataUrl,
        drawCommands,
        geometryTrace
      };
    }, dataArray, config, width, height, drawVisCode);

    const renderDurationMs = Date.now() - startTime;
    const version = await browser.version();

    // Process output RGBA Buffer (8,294,400 bytes)
    const rgbaBuffer = Buffer.from(renderResult.rgbaArray);
    const rgbaPath = path.join(outDir, 'frame.rgba');
    fs.writeFileSync(rgbaPath, rgbaBuffer);

    // Generate SHA-256 Fingerprint
    const sha256Hash = crypto.createHash('sha256').update(rgbaBuffer).digest('hex');
    const hashPath = path.join(outDir, 'frame_hash.sha256');
    fs.writeFileSync(hashPath, sha256Hash, 'utf-8');

    // Decode and save PNG image (for audit comparison)
    const base64Data = renderResult.dataUrl.replace(/^data:image\/png;base64,/, '');
    const pngBuffer = Buffer.from(base64Data, 'base64');
    const pngPath = path.join(outDir, 'render.png');
    fs.writeFileSync(pngPath, pngBuffer);

    // Save Renderer Metadata JSON
    const metadata = {
      timestamp: new Date().toISOString(),
      rendererHost: "Puppeteer Headless Chromium",
      chromiumVersion: version,
      canvasSize: `${width}x${height}`,
      pixelFormat: "RGBA32",
      stride: width * 4,
      bufferSizeBytes: rgbaBuffer.length,
      renderDurationMs,
      sha256: sha256Hash,
      drawVisualizerVersion: "1.0.0 (Production Core Reused)"
    };
    const metaOutPath = path.join(outDir, 'renderer_metadata.json');
    fs.writeFileSync(metaOutPath, JSON.stringify(metadata, null, 2), 'utf-8');

    // Save Trace Logs to root directory for mandatory evidence
    const rootDir = path.resolve(__dirname, '../..');
    fs.writeFileSync(path.join(rootDir, 'DRAW_COMMAND_TRACE.json'), JSON.stringify(renderResult.drawCommands, null, 2), 'utf-8');
    fs.writeFileSync(path.join(rootDir, 'GEOMETRY_REPORT.json'), JSON.stringify(renderResult.geometryTrace, null, 2), 'utf-8');

    console.log(`[Chromium Renderer] Frame rendered cleanly in ${renderDurationMs}ms.`);
    console.log(`[Chromium Renderer] RGBA Buffer written: ${rgbaPath} (${rgbaBuffer.length} bytes)`);
    console.log(`[Chromium Renderer] SHA-256 Fingerprint: ${sha256Hash}`);
    console.log(`[Chromium Renderer] PNG Image written: ${pngPath}`);

    return {
      rgbaBuffer,
      pngBuffer,
      metadata,
      drawCommands: renderResult.drawCommands,
      geometryTrace: renderResult.geometryTrace
    };
  } finally {
    await browser.close();
  }
}

// Executable entrypoint for standalone test
if (process.argv[1] && process.argv[1].includes('render_visualizer.js')) {
  renderFrame().catch(err => {
    console.error('[Chromium Renderer Error]', err);
    process.exit(1);
  });
}
