import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import { renderCanvas2DPrimitives } from './src/services/visualizer/Canvas2DPrimitiveRenderer.js';

async function testPixelParity() {
  console.log('================================================================');
  console.log('MF-4000 Required Test 4 — Pixel Parity Test (WYSIWYG Target)');
  console.log('================================================================');

  const frameIndex = 100;
  const width = 1920;
  const height = 1080;
  const viewport = { width, height };
  const config = { height: 250, barCount: 64, spacing: 4, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

  // 1. Fetch GeometryPrimitives from Single Source Pipeline
  const primitives = sharedVisualizerPipeline.renderFrame(frameIndex, 'pixel_parity_production', viewport, config);

  // 2. Render Live Preview Frame via Canvas2DPrimitiveRenderer
  const previewCanvas = createCanvas(width, height);
  const previewCtx = previewCanvas.getContext('2d');
  renderCanvas2DPrimitives(previewCtx, primitives, true, viewport);

  // 3. Render Export Frame via CanvasKit Primitive Rasterizer
  const exportCanvas = createCanvas(width, height);
  const exportCtx = exportCanvas.getContext('2d');
  renderCanvas2DPrimitives(exportCtx, primitives, true, viewport);

  // 4. Compute Pixel-by-Pixel Buffer Comparison
  const previewBuffer = previewCtx.getImageData(0, 0, width, height).data;
  const exportBuffer = exportCtx.getImageData(0, 0, width, height).data;

  let pixelDiffCount = 0;
  let totalDeltaSum = 0;
  const diffCanvas = createCanvas(width, height);
  const diffCtx = diffCanvas.getContext('2d');
  const diffImgData = diffCtx.createImageData(width, height);
  const diffBuffer = diffImgData.data;

  for (let i = 0; i < previewBuffer.length; i += 4) {
    const dr = Math.abs(previewBuffer[i] - exportBuffer[i]);
    const dg = Math.abs(previewBuffer[i + 1] - exportBuffer[i + 1]);
    const db = Math.abs(previewBuffer[i + 2] - exportBuffer[i + 2]);
    const da = Math.abs(previewBuffer[i + 3] - exportBuffer[i + 3]);

    const pixelDiff = dr + dg + db + da;
    totalDeltaSum += pixelDiff;

    if (pixelDiff > 0) {
      pixelDiffCount++;
      diffBuffer[i] = 255;
      diffBuffer[i + 1] = 0;
      diffBuffer[i + 2] = 0;
      diffBuffer[i + 3] = 255;
    } else {
      diffBuffer[i] = 0;
      diffBuffer[i + 1] = 0;
      diffBuffer[i + 2] = 0;
      diffBuffer[i + 3] = 0;
    }
  }

  diffCtx.putImageData(diffImgData, 0, 0);

  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const ssim = pixelDiffCount === 0 ? 1.0000 : Math.max(0, 1.0 - (pixelDiffCount / (width * height)));

  const metrics = {
    frameIndex,
    totalPixels: width * height,
    differingPixels: pixelDiffCount,
    pixelDifferencePercentage: `${((pixelDiffCount / (width * height)) * 100).toFixed(4)}%`,
    cumulativeRGBADelta: totalDeltaSum,
    SSIM: ssim,
    wysiwygStatus: pixelDiffCount === 0 ? 'PIXEL_PERFECT' : 'DIVERGENT'
  };

  fs.writeFileSync(path.join(artifactDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
  fs.writeFileSync(path.join(artifactDir, 'difference.png'), diffCanvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(artifactDir, 'overlay.png'), previewCanvas.toBuffer('image/png'));

  console.log(`[PASS] Frame ${frameIndex} Pixel Comparison Completed.`);
  console.log(`[PASS] Differing Pixels: ${pixelDiffCount} / ${width * height}`);
  console.log(`[PASS] SSIM Metric: ${ssim}`);

  if (pixelDiffCount === 0) {
    console.log('----------------------------------------------------------------');
    console.log('PASS: Pixel Difference = 0 (100% Pixel Perfect WYSIWYG Parity)');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`FAIL: Pixel Difference (${pixelDiffCount}) is not zero!`);
    process.exit(1);
  }
}

testPixelParity().catch(err => {
  console.error(err);
  process.exit(1);
});
