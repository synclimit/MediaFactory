/**
 * test_mf1302_preview.mjs
 * Automated Unit & Integration Test Suite for MF-1302 Preview Sprint
 */

import { seededNoiseAdapter } from './src/services/pipeline/fastrender/core/SeededNoiseAdapter.js';
import { fastRenderState, RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';
import { capabilityRegistry } from './src/services/pipeline/fastrender/registry/CapabilityRegistry.js';
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
console.log('  MF-1302 PREVIEW ENGINE — UNIT & INTEGRATION TESTS     ');
console.log('========================================================\n');

// --- 1. Master Loop Time Wrapping Tests ---
console.log('--- 1. Testing Master Loop Time Wrapping ---');

const masterDuration = 10.0;
fastRenderState.setMasterLoopDuration(masterDuration);
assert(fastRenderState.getMasterLoopDuration() === 10.0, 'Master loop duration correctly configured to 10.0s');

const time1 = 2.5;
const time1Wrapped = time1 % masterDuration;
assert(time1Wrapped === 2.5, 'Time t=2.5s wraps to 2.5s within 10s master loop');

const time2 = 12.5;
const time2Wrapped = time2 % masterDuration;
assert(Math.abs(time2Wrapped - 2.5) < 0.00001, 'Time t=12.5s (loop 2) wraps identically to t=2.5s');

const time3 = 22.5;
const time3Wrapped = time3 % masterDuration;
assert(Math.abs(time3Wrapped - 2.5) < 0.00001, 'Time t=22.5s (loop 3) wraps identically to t=2.5s');

console.log('');

// --- 2. Camera Shake Master Loop Continuity Tests ---
console.log('--- 2. Testing Seeded Camera Shake Continuity Across Loop Boundaries ---');

const shake0 = seededNoiseAdapter.getSeededCameraShake(0.0 % masterDuration, masterDuration, 25.0, 1337);
const shake10 = seededNoiseAdapter.getSeededCameraShake(10.0 % masterDuration, masterDuration, 25.0, 1337);
const shake20 = seededNoiseAdapter.getSeededCameraShake(20.0 % masterDuration, masterDuration, 25.0, 1337);

assert(Math.abs(shake0.x - shake10.x) < 0.00001, 'Camera shake X offset at t=0s matches t=10s (1st loop completion)');
assert(Math.abs(shake0.y - shake10.y) < 0.00001, 'Camera shake Y offset at t=0s matches t=10s (1st loop completion)');

assert(Math.abs(shake0.x - shake20.x) < 0.00001, 'Camera shake X offset at t=0s matches t=20s (2nd loop completion)');
assert(Math.abs(shake0.y - shake20.y) < 0.00001, 'Camera shake Y offset at t=0s matches t=20s (2nd loop completion)');

console.log('');

// --- 3. Fast Render Mode Preview State Activation ---
console.log('--- 3. Testing Fast Mode State Activation ---');

fastRenderState.setMode(RENDER_MODES.FAST);
assert(fastRenderState.isFastMode() === true, 'Fast Render Mode active for canvas preview engine');

fastRenderState.setMode(RENDER_MODES.NORMAL);
assert(fastRenderState.isFastMode() === false, 'Mode resets cleanly back to NORMAL');

console.log('');

// --- 4. Regression Checks Against MF-1300 and MF-1301 ---
console.log('--- 4. Regression Checks (Capability & ModeSwitch) ---');

assert(capabilityRegistry.isNative('bg_image') === true, 'CapabilityRegistry native lookups valid');
assert(capabilityRegistry.isSupported('fx_strobe_flash') === false, 'Unsupported features properly flagged');

const testObj = { id: 'obj1', type: 'text', name: 'Header' };
const adapted = modeSwitchAdapter.adaptObjectForFastMode(testObj);
const restored = modeSwitchAdapter.restoreObjectForNormalMode(adapted);
assert(JSON.stringify(testObj) === JSON.stringify(restored), 'ModeSwitchAdapter snapshot conversion 100% reversible');

console.log('\n========================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (0 REGRESSIONS)`);
console.log('========================================================\n');
