/**
 * test_mf1406a_procedural_unification.mjs
 * Certification test verifying single procedural evaluation gateway via RenderingContext & AdaptationResult.
 */

import { RenderingContext } from './src/services/pipeline/fastrender/workspace/RenderingContext.js';
import { activeFastProceduralProvider } from './src/services/pipeline/fastrender/workspace/extensions/ProceduralProvider.js';
import { FFTCacheStrategy, generateDeterministicFFT } from './src/services/pipeline/fastrender/workspace/adaptation/strategies/FFTCacheStrategy.js';
import { SeededNoiseStrategy } from './src/services/pipeline/fastrender/workspace/adaptation/strategies/SeededNoiseStrategy.js';
import { PeriodicNoiseStrategy } from './src/services/pipeline/fastrender/workspace/adaptation/strategies/PeriodicNoiseStrategy.js';
import fs from 'fs';

console.log('=== TEST MF-1406A.5 PROCEDURAL UNIFICATION CERTIFICATION ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`[PASS] ${message}`);
    } else {
        console.error(`[FAIL] ${message}`);
    }
}

// 1. Verify FFTCacheStrategy produces deterministic _fftData array
const fftStrat = new FFTCacheStrategy();
const sampleContext = {
    object: { id: 'viz-1', type: 'visualizer', barCount: 256 },
    normalizedLoopTime: 0.5,
    masterLoopDuration: 10.0,
    seed: 1337
};

const result = fftStrat.adapt(sampleContext);
assert(result && result.adaptedObject, 'FFTCacheStrategy returns AdaptationResult');
assert(result.adaptedObject._fftData instanceof Uint8Array, 'AdaptationResult adaptedObject contains _fftData Uint8Array');
assert(result.adaptedObject._fftData.length === 256, '_fftData array length matches barCount (256)');

// 2. Verify Loop Continuity for _fftData (t=0 equals t=1.0)
const fftAt0 = generateDeterministicFFT(0.0, 256);
const fftAt1 = generateDeterministicFFT(1.0, 256);

let maxDelta = 0;
for (let i = 0; i < 256; i++) {
    const diff = Math.abs(fftAt0[i] - fftAt1[i]);
    if (diff > maxDelta) maxDelta = diff;
}
assert(maxDelta === 0, `Loop continuity preserved: maxDelta between t=0 and t=1.0 is ${maxDelta} (0 expected)`);

// 3. Verify RenderingContext adapts visualizer objects correctly
const renderingContext = new RenderingContext({
    workspaceMode: 'FAST',
    extensions: { proceduralProvider: activeFastProceduralProvider }
});

const adaptedViz = renderingContext.adaptObject({ id: 'viz-1', type: 'visualizer', barCount: 256 }, 5.0, 10.0, 1337);
assert(adaptedViz.adaptedObject._fftData instanceof Uint8Array, 'RenderingContext.adaptObject() passes through _fftData in adaptedObject');
assert(adaptedViz.adaptedObject._fastModeAdapted === true, 'adaptedObject marked with _fastModeAdapted: true');

// 4. Verify M3PreviewCanvas.jsx contains no generateProceduralFFT
const canvasCode = fs.readFileSync('./src/components/m3/M3PreviewCanvas.jsx', 'utf-8');
const hasInlineFFT = canvasCode.includes('const generateProceduralFFT');
assert(!hasInlineFFT, 'M3PreviewCanvas.jsx contains ZERO inline generateProceduralFFT definitions');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
if (passedTests === totalTests) {
    console.log('SUCCESS: MF-1406A.5 Procedural Unification Certified!');
    process.exit(0);
} else {
    console.error('FAILURE: Procedural Unification verification failed.');
    process.exit(1);
}
