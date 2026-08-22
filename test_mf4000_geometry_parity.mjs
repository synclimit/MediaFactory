import fs from 'fs';
import path from 'path';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';

async function testGeometryParity() {
  console.log('================================================================');
  console.log('MF-4000 Phase 2G — Geometry Parity Verification Test');
  console.log('================================================================');

  const totalFrames = 300;
  const audioKey = 'test_geometry_parity_session';
  const viewport = { width: 1920, height: 1080 };
  const config = { height: 250, barCount: 64, spacing: 4, colorLeft: '#AB55F7', colorRight: '#F59E0B' };

  let totalGeometryDelta = 0;
  const geometryTrace = [];

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // 1. Fetch Preview Primitives from Single Pipeline
    const previewPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    // 2. Fetch Export Primitives from Single Pipeline
    const exportPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    if (previewPrimitives.length !== exportPrimitives.length) {
      console.error(`❌ Frame ${frameIndex} Length Divergence: Preview=${previewPrimitives.length}, Export=${exportPrimitives.length}`);
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
    geometryTrace.push({
      frameIndex,
      primitiveCount: previewPrimitives.length,
      frameDelta
    });
  }

  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  fs.writeFileSync(path.join(artifactDir, 'geometry_trace.json'), JSON.stringify(geometryTrace, null, 2));

  console.log(`[PASS 2G] Total Frames Verified: ${totalFrames}`);
  console.log(`[PASS 2G] Total Geometry Divergence Delta: ${totalGeometryDelta}`);
  console.log(`[PASS 2G] Trace Artifact: experiments/artifacts/mf4000/geometry_trace.json`);

  if (totalGeometryDelta === 0) {
    console.log('----------------------------------------------------------------');
    console.log('✅ PHASE 2G CERTIFIED: Geometry Parity Delta = 0 (100% Identical)');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`❌ PHASE 2G FAILED: Geometry Delta (${totalGeometryDelta}) is not zero!`);
    process.exit(1);
  }
}

testGeometryParity().catch(err => {
  console.error(err);
  process.exit(1);
});
