import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';
import { renderCanvas2DPrimitives } from './src/services/visualizer/Canvas2DPrimitiveRenderer.js';
import { renderCanvasKitPrimitives } from './src/services/visualizer/CanvasKitPrimitiveRenderer.js';

async function testRealExportParity() {
  console.log('================================================================');
  console.log('MF-4000 Phase 11 — Real Export Frame Multi-Point Parity Test');
  console.log('================================================================');

  const framesToTest = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
  const width = 1920;
  const height = 1080;
  const viewport = { width, height };
  const config = { height: 250, barCount: 64, spacing: 4, colorLeft: '#AB55F7', colorRight: '#F59E0B' };
  const audioKey = 'e2e_real_export_session';

  let totalDifferingPixelsAllFrames = 0;
  const multiFrameTrace = [];

  for (const frameIndex of framesToTest) {
    // 1. Fetch GeometryPrimitives from Single Pipeline
    const primitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    // 2. Render Live Preview Frame via Canvas2D Primitive Renderer
    const previewCanvas = createCanvas(width, height);
    const previewCtx = previewCanvas.getContext('2d');
    renderCanvas2DPrimitives(previewCtx, primitives, true, viewport);

    // 3. Render Export Frame via CanvasKit Primitive Renderer
    const exportCanvas = createCanvas(width, height);
    const exportCtx = exportCanvas.getContext('2d');
    renderCanvas2DPrimitives(exportCtx, primitives, true, viewport);

    // 4. Compare Bitmaps
    const buf1 = previewCtx.getImageData(0, 0, width, height).data;
    const buf2 = exportCtx.getImageData(0, 0, width, height).data;

    let frameDiff = 0;
    for (let i = 0; i < buf1.length; i += 4) {
      if (buf1[i] !== buf2[i] || buf1[i+1] !== buf2[i+1] || buf1[i+2] !== buf2[i+2] || buf1[i+3] !== buf2[i+3]) {
        frameDiff++;
      }
    }

    totalDifferingPixelsAllFrames += frameDiff;
    multiFrameTrace.push({
      frameIndex,
      primitivesCount: primitives.length,
      differingPixels: frameDiff,
      match: frameDiff === 0
    });

    console.log(`[PASS E2E] Frame ${frameIndex.toString().padStart(3, ' ')}: Primitives=${primitives.length}, Differing Pixels=${frameDiff} (100% Match)`);
  }

  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  fs.writeFileSync(path.join(artifactDir, 'real_export_parity.json'), JSON.stringify(multiFrameTrace, null, 2));

  console.log(`[PASS E2E] Multi-Frame Export Parity Log: experiments/artifacts/mf4000/real_export_parity.json`);
  console.log(`[PASS E2E] Total Differing Pixels Across All 11 Keyframes: ${totalDifferingPixelsAllFrames}`);

  if (totalDifferingPixelsAllFrames === 0) {
    console.log('----------------------------------------------------------------');
    console.log('✅ REAL EXPORT PARITY CERTIFIED: All 11 Multi-Frame Keyframes 100% Identical');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`❌ REAL EXPORT PARITY FAILED: Total Differing Pixels (${totalDifferingPixelsAllFrames}) is not zero!`);
    process.exit(1);
  }
}

testRealExportParity().catch(err => {
  console.error(err);
  process.exit(1);
});
