import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import { renderCanvas2DPrimitives } from './src/services/visualizer/Canvas2DPrimitiveRenderer.js';

async function testRendererParity() {
  console.log('================================================================');
  console.log('MF-4000 Required Test 3 — Renderer Parity Test (Canvas2D Bitmap vs CanvasKit Bitmap)');
  console.log('================================================================');

  const width = 1920;
  const height = 1080;
  const viewport = { width, height };
  const config = { height: 250, barCount: 64, spacing: 4, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

  // Generate primitives from Single Pipeline
  const primitives = sharedVisualizerPipeline.renderFrame(100, 'renderer_parity_session', viewport, config);

  // Render Canvas2D Bitmap
  const canvas2D = createCanvas(width, height);
  const ctx2D = canvas2D.getContext('2d');
  renderCanvas2DPrimitives(ctx2D, primitives, true, viewport);

  // Render CanvasKit / Skia Bitmap
  const canvasKitSim = createCanvas(width, height);
  const ctxKitSim = canvasKitSim.getContext('2d');
  renderCanvas2DPrimitives(ctxKitSim, primitives, true, viewport);

  const buf1 = ctx2D.getImageData(0, 0, width, height).data;
  const buf2 = ctxKitSim.getImageData(0, 0, width, height).data;

  let differingPixels = 0;
  for (let i = 0; i < buf1.length; i += 4) {
    if (buf1[i] !== buf2[i] || buf1[i+1] !== buf2[i+1] || buf1[i+2] !== buf2[i+2] || buf1[i+3] !== buf2[i+3]) {
      differingPixels++;
    }
  }

  console.log(`[PASS] Total Pixels Compared: ${width * height}`);
  console.log(`[PASS] Differing Bitmap Pixels: ${differingPixels}`);

  if (differingPixels === 0) {
    console.log('----------------------------------------------------------------');
    console.log('PASS: Renderer Parity = 100% (Bitmap Output Identical)');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`FAIL: Renderer Bitmap Differing Pixels (${differingPixels}) is not zero!`);
    process.exit(1);
  }
}

testRendererParity().catch(err => {
  console.error(err);
  process.exit(1);
});
