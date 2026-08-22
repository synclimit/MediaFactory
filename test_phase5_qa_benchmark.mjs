import { generateGeometry as b01 } from './src/visualizers/categories/bars/B01_ClassicVertical.js';
import { generateGeometry as b02 } from './src/visualizers/categories/bars/B02_StaggeredCenter.js';
import { generateGeometry as b03 } from './src/visualizers/categories/bars/B03_MirrorBars.js';
import { generateGeometry as b04 } from './src/visualizers/categories/bars/B04_SplitDual.js';
import { generateGeometry as b05 } from './src/visualizers/categories/bars/B05_RoundedPillBars.js';
import { generateGeometry as b06 } from './src/visualizers/categories/bars/B06_HorizontalBars.js';
import { generateGeometry as c01 } from './src/visualizers/categories/circle/C01_BasicCircular.js';
import { generateGeometry as w01 } from './src/visualizers/categories/waves/W01_Oscilloscope.js';
import { generateGeometry as w02 } from './src/visualizers/categories/waves/W02_FilledSine.js';
import { generateGeometry as w03 } from './src/visualizers/categories/waves/W03_SymmetricalDual.js';
import { generateGeometry as w04 } from './src/visualizers/categories/waves/W04_BezierSpline.js';
import { generateGeometry as w05 } from './src/visualizers/categories/waves/W05_DotMatrixWave.js';
import { performance } from 'perf_hooks';

const migratedPlugins = [
  { id: 'bars-classic-vertical', fn: b01, file: 'B01_ClassicVertical.js' },
  { id: 'bars-staggered-center', fn: b02, file: 'B02_StaggeredCenter.js' },
  { id: 'bars-mirror', fn: b03, file: 'B03_MirrorBars.js' },
  { id: 'bars-split-dual', fn: b04, file: 'B04_SplitDual.js' },
  { id: 'bars-rounded-pill', fn: b05, file: 'B05_RoundedPillBars.js' },
  { id: 'bars-horizontal', fn: b06, file: 'B06_HorizontalBars.js' },
  { id: 'circle-basic', fn: c01, file: 'C01_BasicCircular.js' },
  { id: 'waves-oscilloscope', fn: w01, file: 'W01_Oscilloscope.js' },
  { id: 'waves-filled-sine', fn: w02, file: 'W02_FilledSine.js' },
  { id: 'waves-symmetrical-dual', fn: w03, file: 'W03_SymmetricalDual.js' },
  { id: 'waves-bezier-spline', fn: w04, file: 'W04_BezierSpline.js' },
  { id: 'waves-dot-matrix', fn: w05, file: 'W05_DotMatrixWave.js' }
];

console.log('================================================================');
console.log('MF-4000 Phase 5 — QUALITY ASSURANCE & GEOMETRY VALIDATION');
console.log('================================================================\n');

const sampleFFT = { spectrum: new Uint8Array(64).fill(128), waveform: new Uint8Array(256).fill(128) };
const sampleViewport = { width: 1920, height: 1080 };
const sampleConfig = { barCount: 64, color: '#00ffcc' };

let validationFailures = 0;

for (const plugin of migratedPlugins) {
  const primitives = plugin.fn(sampleFFT, sampleViewport, sampleConfig, {});
  let valid = Array.isArray(primitives) && primitives.length > 0;

  if (valid) {
    for (const p of primitives) {
      if (!p.type) { valid = false; break; }
      if (p.x !== undefined && (isNaN(p.x) || !isFinite(p.x))) { valid = false; break; }
      if (p.y !== undefined && (isNaN(p.y) || !isFinite(p.y))) { valid = false; break; }
      if (p.width !== undefined && (isNaN(p.width) || p.width < 0)) { valid = false; break; }
      if (p.height !== undefined && (isNaN(p.height) || p.height < 0)) { valid = false; break; }
    }
  }

  if (!valid) validationFailures++;
  console.log(`[GEOMETRY QA] ${plugin.id.padEnd(24)} | Primitives=${(primitives || []).length} | Valid=${valid ? '🟢 PASS' : '🔴 FAIL'}`);
}

console.log('\n================================================================');
console.log('MF-4000 Phase 5 — PERFORMANCE BENCHMARK (100, 300, 1000 FRAMES)');
console.log('================================================================\n');

for (const plugin of migratedPlugins) {
  const start = performance.now();
  let primCount = 0;
  for (let f = 0; f < 1000; f++) {
    const prims = plugin.fn(sampleFFT, sampleViewport, sampleConfig, {});
    if (f === 0) primCount = prims.length;
  }
  const totalMs = performance.now() - start;
  const avgMsPerFrame = (totalMs / 1000).toFixed(4);

  console.log(`[BENCHMARK] ${plugin.id.padEnd(24)} | 1000 Frames = ${totalMs.toFixed(2)}ms | Avg=${avgMsPerFrame}ms/frame | Primitives=${primCount}`);
}

console.log('\n================================================================');
console.log(`QA SUMMARY: Validation Failures = ${validationFailures}`);
console.log('================================================================');
