/**
 * test_mf1301_inspector.mjs
 * Automated Unit & Integration Test Suite for MF-1301 Adaptive Inspector Sprint
 */

import { seededNoiseAdapter } from './src/services/pipeline/fastrender/core/SeededNoiseAdapter.js';
import { capabilityRegistry, FAST_RENDER_CATEGORIES } from './src/services/pipeline/fastrender/registry/CapabilityRegistry.js';
import { fastRenderState, RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';
import { modeSwitchAdapter } from './src/services/pipeline/fastrender/core/ModeSwitchAdapter.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`❌ TEST FAILED: ${message}`);
        process.exit(1);
    } else {
        passedTests++;
        console.log(`✓ [PASS] ${message}`);
    }
}

console.log('========================================================');
console.log('  MF-1301 ADAPTIVE INSPECTOR — UNIT & INTEGRATION TESTS ');
console.log('========================================================\n');

// --- 1. SeededNoiseAdapter PRNG & Determinism Tests ---
console.log('--- 1. Testing SeededNoiseAdapter PRNG Determinism ---');

const float1 = seededNoiseAdapter.getRandomFloat(1337, 0);
const float2 = seededNoiseAdapter.getRandomFloat(1337, 0);
assert(float1 === float2, 'Same seed & index produces 100% identical float value');

const floatDiffSeed = seededNoiseAdapter.getRandomFloat(9999, 0);
assert(float1 !== floatDiffSeed, 'Different seed produces different float value');

const floatDiffIdx = seededNoiseAdapter.getRandomFloat(1337, 1);
assert(float1 !== floatDiffIdx, 'Different index produces different float value');

const rangeVal = seededNoiseAdapter.getRandomRange(1337, 0, 10, 20);
assert(rangeVal >= 10 && rangeVal <= 20, 'getRandomRange stays strictly within [10, 20]');

const intVal = seededNoiseAdapter.getRandomInt(1337, 0, 1, 10);
assert(Number.isInteger(intVal) && intVal >= 1 && intVal <= 10, 'getRandomInt returns integer in [1, 10]');

console.log('');

// --- 2. Periodic Noise & Loop Continuity Tests ---
console.log('--- 2. Testing Periodic Noise & Camera Shake ---');

const noiseStart = seededNoiseAdapter.getPeriodicNoise(0.0, 10.0, 1.0, 1337);
const noiseEnd = seededNoiseAdapter.getPeriodicNoise(10.0, 10.0, 1.0, 1337);
assert(Math.abs(noiseStart - noiseEnd) < 0.00001, 'Periodic noise is 100% seamless at loop boundary (t=0.0s vs t=10.0s)');

const noiseMid = seededNoiseAdapter.getPeriodicNoise(5.0, 10.0, 1.0, 1337);
assert(noiseStart !== noiseMid, 'Noise fluctuates dynamically mid-loop');
assert(noiseMid >= -1.0 && noiseMid <= 1.0, 'Periodic noise bounded within [-1.0, 1.0]');

const shake0 = seededNoiseAdapter.getSeededCameraShake(0.0, 10.0, 20.0, 1337);
const shake10 = seededNoiseAdapter.getSeededCameraShake(10.0, 10.0, 20.0, 1337);
assert(Math.abs(shake0.x - shake10.x) < 0.00001, 'Camera shake X offset is continuous at loop boundary');
assert(Math.abs(shake0.y - shake10.y) < 0.00001, 'Camera shake Y offset is continuous at loop boundary');

console.log('');

// --- 3. Inspector Capability & Guidance Rules Tests ---
console.log('--- 3. Testing Capability Rules for Inspector Widgets ---');

const shakeRule = capabilityRegistry.getInspectorRule('camera-shake');
assert(shakeRule.supported === true && shakeRule.adapted === true, 'Camera shake registered as supported & adapted');

const strobeRule = capabilityRegistry.getInspectorRule('strobe-flash');
assert(strobeRule.supported === false, 'Strobe flash marked unsupported in inspector rules');
assert(typeof strobeRule.reason === 'string', 'Strobe flash contains human-readable explanation');

const glitchRule = capabilityRegistry.getInspectorRule('glitch-digital');
assert(glitchRule.supported === false, 'Digital glitch marked unsupported in inspector rules');

console.log('');

// --- 4. Mode Switch Integration & Guidance Tests ---
console.log('--- 4. Testing Mode Switch Guidance & Object Adaptation ---');

const mockObjectWithStrobe = {
    id: 'fx_strobe_1',
    type: 'effect',
    presetId: 'strobe-flash',
    name: 'Kilat Strobe',
    enabled: true,
    props: { brightness: 80 }
};

const adaptedStrobe = modeSwitchAdapter.adaptObjectForFastMode(mockObjectWithStrobe);
assert(adaptedStrobe.enabled === false, 'Unsupported strobe effect automatically disabled in Fast Mode');
assert(adaptedStrobe.fastModeSuspended === true, 'fastModeSuspended flag attached');
assert(typeof adaptedStrobe.fastModeReason === 'string', 'fastModeReason message attached');

const restoredStrobe = modeSwitchAdapter.restoreObjectForNormalMode(adaptedStrobe);
assert(restoredStrobe.enabled === true, 'Strobe effect original enabled state restored in Normal Mode');
assert(restoredStrobe.fastModeSuspended === undefined, 'fastModeSuspended flag removed in Normal Mode');

console.log('\n========================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (0 REGRESSIONS)`);
console.log('========================================================\n');
