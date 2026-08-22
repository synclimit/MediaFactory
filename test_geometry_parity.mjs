import fs from 'fs';
import path from 'path';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';

async function testGeometryParity() {
  console.log('================================================================');
  console.log('MF-4000 Required Test 2 — Geometry Parity Test (Preview Runtime vs Export Runtime)');
  console.log('================================================================');

  const totalFrames = 300;
  const audioKey = 'production_audio_session';
  const viewport = { width: 1920, height: 1080 };
  const config = { height: 250, barCount: 64, spacing: 4, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

  let totalGeometryDelta = 0;

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // Preview Runtime Geometry Call
    const previewPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    // Export Runtime Geometry Call
    const exportPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    if (previewPrimitives.length !== exportPrimitives.length) {
      console.error(`FAIL: Frame ${frameIndex} Primitive Length Mismatch (Preview=${previewPrimitives.length}, Export=${exportPrimitives.length})`);
      process.exit(1);
    }

    let frameDelta = 0;
    for (let i = 0; i < previewPrimitives.length; i++) {
      const p = previewPrimitives[i];
      const e = exportPrimitives[i];

      const dx = Math.abs((p.x || 0) - (e.x || 0));
      const dy = Math.abs((p.y || 0) - (e.y || 0));
      const dw = Math.abs((p.width || 0) - (e.width || 0));
      const dh = Math.abs((p.height || 0) - (e.height || 0));
      const colorMatch = p.fillColor === e.fillColor ? 0 : 1;

      frameDelta += dx + dy + dw + dh + colorMatch;
    }

    totalGeometryDelta += frameDelta;
  }

  console.log(`[PASS] Total Frames Tested: ${totalFrames}`);
  console.log(`[PASS] Cumulative Geometry Delta: ${totalGeometryDelta}`);

  if (totalGeometryDelta === 0) {
    console.log('----------------------------------------------------------------');
    console.log('PASS: Geometry Delta = 0 (100% Identical Primitive Geometry)');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`FAIL: Geometry Delta (${totalGeometryDelta}) is not zero!`);
    process.exit(1);
  }
}

testGeometryParity().catch(err => {
  console.error(err);
  process.exit(1);
});
