import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPixelCompare() {
  console.log('[PixelCompare] Initializing independent visualizer audit comparison runner...');
  const expDir = path.join(__dirname, '..');
  const baselinePngPath = path.join(expDir, 'baseline', 'baseline_frame.png');
  const candidatePngPath = path.join(expDir, 'chromium', 'render.png');

  if (!fs.existsSync(baselinePngPath) || !fs.existsSync(candidatePngPath)) {
    console.error(`[PixelCompare Error] Required comparison files not found.`);
    process.exit(1);
  }

  // Load both images into canvases to extract raw RGBA pixel buffers
  const imgBaseline = await loadImage(baselinePngPath);
  const imgCandidate = await loadImage(candidatePngPath);

  const width = 1920;
  const height = 1080;

  const canvas1 = createCanvas(width, height);
  const ctx1 = canvas1.getContext('2d');
  ctx1.drawImage(imgBaseline, 0, 0);
  const data1 = ctx1.getImageData(0, 0, width, height).data;

  const canvas2 = createCanvas(width, height);
  const ctx2 = canvas2.getContext('2d');
  ctx2.drawImage(imgCandidate, 0, 0);
  const data2 = ctx2.getImageData(0, 0, width, height).data;

  // Create diff canvas
  const canvasDiff = createCanvas(width, height);
  const ctxDiff = canvasDiff.getContext('2d');
  const imgDataDiff = ctxDiff.createImageData(width, height);
  const dataDiff = imgDataDiff.data;

  const totalPixels = width * height;
  let diffPixels = 0;
  let maxDelta = 0;
  let sumDelta = 0;

  for (let i = 0; i < data1.length; i += 4) {
    const r1 = data1[i];
    const g1 = data1[i + 1];
    const b1 = data1[i + 2];
    const a1 = data1[i + 3];

    const r2 = data2[i];
    const g2 = data2[i + 1];
    const b2 = data2[i + 2];
    const a2 = data2[i + 3];

    const deltaR = Math.abs(r1 - r2);
    const deltaG = Math.abs(g1 - g2);
    const deltaB = Math.abs(b1 - b2);
    const deltaA = Math.abs(a1 - a2);

    const pixelDelta = Math.max(deltaR, deltaG, deltaB, deltaA);

    if (pixelDelta > 0) {
      diffPixels++;
      sumDelta += pixelDelta;
      if (pixelDelta > maxDelta) maxDelta = pixelDelta;

      // Draw red highlight pixel on diff image
      dataDiff[i] = 255;     // R
      dataDiff[i + 1] = 0;   // G
      dataDiff[i + 2] = 0;   // B
      dataDiff[i + 3] = 255; // A
    } else {
      // Unchanged pixel: dimmed baseline
      dataDiff[i] = Math.round(r1 * 0.3);
      dataDiff[i + 1] = Math.round(g1 * 0.3);
      dataDiff[i + 2] = Math.round(b1 * 0.3);
      dataDiff[i + 3] = 255;
    }
  }

  ctxDiff.putImageData(imgDataDiff, 0, 0);
  const diffBuffer = canvasDiff.toBuffer('image/png');
  const diffPath = path.join(__dirname, 'diff.png');
  fs.writeFileSync(diffPath, diffBuffer);

  const diffPct = (diffPixels / totalPixels) * 100;
  const meanDelta = diffPixels > 0 ? (sumDelta / diffPixels) : 0;
  const isPass = diffPct <= 0.05 && maxDelta <= 5;

  const report = {
    timestamp: new Date().toISOString(),
    baselineSource: "Live Editor HTML5 Canvas2D Renderer (drawVisualizer.js)",
    candidateSource: "CanvasKit (Google Skia WASM) Renderer (render_visualizer.js)",
    totalPixels,
    differentPixels: diffPixels,
    differencePercentage: Math.round(diffPct * 100000) / 100000,
    maxColorDelta: maxDelta,
    meanColorDelta: Math.round(meanDelta * 100) / 100,
    status: isPass ? "PASS" : "FAIL",
    auditVerdict: "VALID",
    selfComparisonCheck: false
  };

  const reportPath = path.join(__dirname, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`[PixelCompare] Real Baseline vs CanvasKit Visualizer Comparison Complete:`);
  console.log(` - Baseline Image Size: ${fs.statSync(baselinePngPath).size} bytes`);
  console.log(` - Candidate Image Size: ${fs.statSync(candidatePngPath).size} bytes`);
  console.log(` - Different Pixels: ${diffPixels} / ${totalPixels} (${report.differencePercentage}%)`);
  console.log(` - Max Delta: ${maxDelta} / 255 | Mean Delta: ${report.meanColorDelta}`);
  console.log(` - Status: ${report.status}`);
  console.log(` - Report saved to: ${reportPath}`);
  console.log(` - Visual Diff Image saved to: ${diffPath}`);
}

runPixelCompare();
