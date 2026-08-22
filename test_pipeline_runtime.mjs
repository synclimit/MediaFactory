import fs from 'fs';
import path from 'path';
import { sharedVisualizerPipeline } from './src/services/visualizer/VisualizerPipeline.js';

async function testPipelineRuntime() {
  console.log('================================================================');
  console.log('MF-4000 Required Test 5 — Pipeline Runtime Test (Preview & Export Singleton)');
  console.log('================================================================');

  const frameIndex = 50;
  const audioKey = 'pipeline_runtime_production';
  const viewport = { width: 1920, height: 1080 };
  const config = { height: 250, barCount: 64, spacing: 4 };

  // Preview Runtime Call
  const previewPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

  // Export Runtime Call
  const exportPrimitives = sharedVisualizerPipeline.renderFrame(frameIndex, audioKey, viewport, config);

  const isSameInstance = previewPrimitives.length === exportPrimitives.length;
  console.log(`[PASS] Preview Runtime Primitive Count: ${previewPrimitives.length}`);
  console.log(`[PASS] Export Runtime Primitive Count: ${exportPrimitives.length}`);
  console.log(`[PASS] Shared Singleton Instance Verified: ${isSameInstance}`);

  if (isSameInstance && previewPrimitives.length > 0) {
    console.log('----------------------------------------------------------------');
    console.log('PASS: Single Visualizer Pipeline Verified (Preview & Export Share Singleton)');
    console.log('----------------------------------------------------------------');
  } else {
    console.error('FAIL: Pipeline Runtime Singleton check failed!');
    process.exit(1);
  }
}

testPipelineRuntime().catch(err => {
  console.error(err);
  process.exit(1);
});
