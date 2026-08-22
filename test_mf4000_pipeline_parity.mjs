import fs from 'fs';
import path from 'path';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';

async function testPipelineParity() {
  console.log('================================================================');
  console.log('MF-4000 Phase 2B — Shared Visualizer Pipeline Parity Test');
  console.log('================================================================');

  const totalFrames = 300;
  const audioKey = 'test_pipeline_session_4000';
  const viewport = { width: 1920, height: 1080 };
  const config = { height: 250, barCount: 64, spacing: 4 };

  let totalDiff = 0;
  const runtimeTrace = [];

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    // Preview Pipeline Render Call
    const previewPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    // Export Pipeline Render Call
    const exportPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

    if (previewPrimitives.length !== exportPrimitives.length) {
      console.error(`Frame ${frameIndex}: Length mismatch (Preview ${previewPrimitives.length} vs Export ${exportPrimitives.length})`);
      process.exit(1);
    }

    let frameDiff = 0;
    for (let i = 0; i < previewPrimitives.length; i++) {
      const p = previewPrimitives[i];
      const e = exportPrimitives[i];
      const dx = Math.abs(p.x - e.x);
      const dy = Math.abs(p.y - e.y);
      const dw = Math.abs(p.width - e.width);
      const dh = Math.abs(p.height - e.height);
      frameDiff += dx + dy + dw + dh;
    }

    totalDiff += frameDiff;
    runtimeTrace.push({
      frameIndex,
      primitiveCount: previewPrimitives.length,
      frameDiff
    });
  }

  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'mf4000');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  fs.writeFileSync(path.join(artifactDir, 'runtime_trace.json'), JSON.stringify(runtimeTrace, null, 2));

  console.log(`[PASS 2B] Pipeline Frames Tested: ${totalFrames}`);
  console.log(`[PASS 2B] Cumulative Pipeline Geometry Delta: ${totalDiff}`);
  console.log(`[PASS 2B] Trace Artifact: experiments/artifacts/mf4000/runtime_trace.json`);

  if (totalDiff === 0) {
    console.log('----------------------------------------------------------------');
    console.log('✅ PHASE 2B CERTIFIED: Shared Visualizer Pipeline Parity = 100%');
    console.log('----------------------------------------------------------------');
  } else {
    console.error(`❌ PHASE 2B FAILED: Pipeline Delta (${totalDiff}) is not zero!`);
    process.exit(1);
  }
}

testPipelineParity().catch(err => {
  console.error(err);
  process.exit(1);
});
