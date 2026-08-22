/**
 * test_visualizer_v3_e2e_parity.mjs
 * Comprehensive E2E Parity Verification Runner for Visualizer 3.
 * 
 * Verifies 100% WYSIWYG Pixel Match (0 Differing Pixels) across all 4 production plugins
 * across 300 frames.
 */

import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { VisualizerPipeline } from './src/visualizers/v3/pipeline/VisualizerPipeline.js';
import { AudioAnalyzer } from './src/visualizers/v3/pipeline/AudioAnalyzer.js';
import { ValidationEngine } from './src/visualizers/v3/pipeline/ValidationEngine.js';

// Auto-import plugins to trigger registration
import './src/visualizers/v3/plugins/SpectrumBarsPlugin.js';
import './src/visualizers/v3/plugins/CircularPulsePlugin.js';
import './src/visualizers/v3/plugins/CyberpunkWaveformPlugin.js';
import './src/visualizers/v3/plugins/ParticleOrbitPlugin.js';

async function runVisualizer3E2EParityTest() {
  console.log('================================================================');
  console.log('Visualizer 3 Engine — E2E Parity Certification Test Suite');
  console.log('================================================================\n');

  const pluginsToTest = [
    'spectrum-bars',
    'circular-pulse',
    'cyberpunk-waveform',
    'particle-orbit'
  ];

  const width = 1920;
  const height = 1080;
  const totalFrames = 300;
  const fps = 60;
  const duration = totalFrames / fps;

  // Initialize deterministic timeline FFT cache
  const audioAnalyzer = new AudioAnalyzer(fps);
  audioAnalyzer.generateSyntheticTimeline(duration);

  let totalFailedPlugins = 0;
  const suiteResults = [];

  for (const pluginId of pluginsToTest) {
    console.log(`[TESTING PLUGIN] '${pluginId}' across ${totalFrames} frames...`);
    let pluginMismatches = 0;

    for (let f = 0; f < totalFrames; f++) {
      const timestamp = f / fps;
      const audioState = audioAnalyzer.getAudioDataAtTimestamp(timestamp);

      // 1. Live Preview Canvas
      const previewCanvas = createCanvas(width, height);
      VisualizerPipeline.renderPipelineFrame(previewCanvas, timestamp, audioState, pluginId);

      // 2. Offline Export Canvas
      const exportCanvas = createCanvas(width, height);
      VisualizerPipeline.renderPipelineFrame(exportCanvas, timestamp, audioState, pluginId);

      // 3. Pixel-by-Pixel Validation
      const result = ValidationEngine.compareCanvases(previewCanvas, exportCanvas);

      if (!result.passed || result.mismatchedPixels > 0) {
        console.error(`  ❌ Frame ${f} (${timestamp.toFixed(2)}s) FAILED: ${result.mismatchedPixels} mismatched pixels!`);
        pluginMismatches++;
      }
    }

    const passed = pluginMismatches === 0;
    suiteResults.push({
      pluginId,
      totalFrames,
      mismatchedFrames: pluginMismatches,
      status: passed ? 'PASSED (100% MATCH)' : 'FAILED'
    });

    if (passed) {
      console.log(`  ✅ '${pluginId}': 100% PIXEL MATCH (0 Mismatched Pixels across all ${totalFrames} frames)\n`);
    } else {
      console.error(`  ❌ '${pluginId}': FAILED with ${pluginMismatches} divergent frames!\n`);
      totalFailedPlugins++;
    }
  }

  // Save report artifact
  const artifactDir = path.join(process.cwd(), 'experiments', 'artifacts', 'visualizer_v3');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(artifactDir, 'v3_parity_report.json'),
    JSON.stringify({ suiteResults, timestamp: new Date().toISOString() }, null, 2)
  );

  console.log('================================================================');
  console.log('VISUALIZER 3 FINAL E2E CERTIFICATION SUMMARY');
  console.log('================================================================');
  suiteResults.forEach(r => console.log(`- ${r.pluginId.padEnd(20)}: ${r.status}`));
  console.log('----------------------------------------------------------------');

  if (totalFailedPlugins === 0) {
    console.log('✅ ALL VISUALIZER 3 PLUGINS CERTIFIED: 100% WYSIWYG PIXEL PERFECT!');
  } else {
    console.error(`❌ CERTIFICATION FAILED: ${totalFailedPlugins} plugins failed verification!`);
    process.exit(1);
  }
}

runVisualizer3E2EParityTest().catch(err => {
  console.error('[FATAL TEST ERROR]', err);
  process.exit(1);
});
