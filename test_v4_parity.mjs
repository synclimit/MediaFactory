import { createCanvas } from 'canvas';
import { VisualizerV4Core } from './src/visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from './src/visualizers/v4/VisualizerV4Audio.js';

console.log('====================================================');
console.log('  VISUALIZER V4 SINGLE PURE ENGINE PARITY TEST');
console.log('====================================================');

const modes = ['spectrum-bars', 'circular-pulse', 'cyberpunk-waveform', 'particle-orbit'];
const width = 800;
const height = 300;
let allPassed = true;

for (const mode of modes) {
  console.log(`\nTesting Mode: ${mode}...`);

  const canvas1 = createCanvas(width, height);
  const ctx1 = canvas1.getContext('2d');

  const canvas2 = createCanvas(width, height);
  const ctx2 = canvas2.getContext('2d');

  const audioState = VisualizerV4Audio.generateSyntheticState(1.0, 64);
  const config = {
    mode,
    barCount: 64,
    sensitivity: 100,
    colorLeft: '#AB55F7',
    colorRight: '#F59E0B',
    colorMid: '#06B6D4',
    colorMode: '2 Gradient'
  };

  // Render Frame 1
  VisualizerV4Core.renderFrame(ctx1, width, height, audioState, config);

  // Render Frame 2 (Exact same function call)
  VisualizerV4Core.renderFrame(ctx2, width, height, audioState, config);

  const imgData1 = ctx1.getImageData(0, 0, width, height).data;
  const imgData2 = ctx2.getImageData(0, 0, width, height).data;

  let mismatched = 0;
  for (let i = 0; i < imgData1.length; i += 4) {
    const diff = Math.abs(imgData1[i] - imgData2[i]) +
                 Math.abs(imgData1[i + 1] - imgData2[i + 1]) +
                 Math.abs(imgData1[i + 2] - imgData2[i + 2]) +
                 Math.abs(imgData1[i + 3] - imgData2[i + 3]);
    if (diff > 0) mismatched++;
  }

  const totalPixels = width * height;
  const matchPct = ((totalPixels - mismatched) / totalPixels) * 100;

  console.log(`  -> Match Percentage: ${matchPct.toFixed(2)}%`);
  console.log(`  -> Mismatched Pixels: ${mismatched} / ${totalPixels}`);

  if (mismatched === 0) {
    console.log(`  -> Result: [PASS] 100% IDENTICAL`);
  } else {
    console.log(`  -> Result: [FAIL] DIVERGENCE DETECTED`);
    allPassed = false;
  }
}

console.log('\n====================================================');
if (allPassed) {
  console.log('  ALL V4 MODES PASSED 100% PARITY (0 MISMATCHED PIXELS)');
  console.log('====================================================');
  process.exit(0);
} else {
  console.log('  TEST FAILED: Parity mismatch detected.');
  console.log('====================================================');
  process.exit(1);
}
