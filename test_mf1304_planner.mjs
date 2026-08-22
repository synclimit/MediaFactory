/**
 * test_mf1304_planner.mjs
 * Automated Unit & Integration Test Suite for MF-1304 Planner Sprint
 */

import { fastRenderPlanner } from './src/services/pipeline/fastrender/planner/FastRenderPlanner.js';
import { preflightValidator } from './src/services/pipeline/fastrender/planner/PreflightValidator.js';
import { fastRenderState, RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';
import { capabilityRegistry } from './src/services/pipeline/fastrender/registry/CapabilityRegistry.js';
import { modeSwitchAdapter } from './src/services/pipeline/fastrender/core/ModeSwitchAdapter.js';
import { seededNoiseAdapter } from './src/services/pipeline/fastrender/core/SeededNoiseAdapter.js';

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
console.log('  MF-1304 PLANNER ENGINE — UNIT & INTEGRATION TESTS     ');
console.log('========================================================\n');

// Mock Project State
const mockValidProject = {
    m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'image' }],
    m3AudioTracks: [{ id: 'audio1', title: 'Music Track' }],
    m3Objects: [
        { id: 'text1', type: 'text', name: 'Header Subtitle' },
        { id: 'shake1', type: 'effect', presetId: 'camera-shake', name: 'Guncang Kamera' }
    ],
    m3TotalDurationSec: 180.0,
    m3RenderSettings: { format: 'mp4', resolution: '1080p' }
};

// --- 1. FastRenderPlanner Determinism & Categorization Tests ---
console.log('--- 1. Testing FastRenderPlanner Determinism & Workload ---');

const plan1 = fastRenderPlanner.createPlan(mockValidProject);
const plan2 = fastRenderPlanner.createPlan(mockValidProject);

assert(JSON.stringify(plan1) === JSON.stringify(plan2), 'Same project state generates 100% identical execution plan');
assert(plan1.summary.totalObjects === 3, 'Total objects correctly counted (1 BG + 2 Objects)');
assert(plan1.summary.nativeCount === 2, '2 Native objects identified (BG image & text)');
assert(plan1.summary.adaptedCount === 1, '1 Adapted object identified (camera shake)');
assert(plan1.summary.unsupportedCount === 0, '0 Unsupported objects in valid project');
assert(plan1.workload.masterLoopDurationSec === 10.0, 'Master loop duration correctly set to 10.0s');
assert(plan1.workload.masterFrames === 600, 'Master loop frames correctly set to 600 (10s * 60 FPS)');
assert(plan1.workload.totalFrames === 10800, 'Total frames correctly calculated for 180s video');
assert(plan1.workload.estimatedSpeedupRatio === 18.0, 'Estimated speedup correctly calculated as 18.0x');

console.log('');

// --- 2. PreflightValidator Error & Warning Tests ---
console.log('--- 2. Testing PreflightValidator ---');

const valValid = preflightValidator.validate(mockValidProject);
assert(valValid.isValid === true, 'Valid project passes preflight validation');
assert(valValid.canUseFastRender === true, 'Valid project marked ready for Fast Render');
assert(valValid.errors.length === 0, 'No errors in valid project');

// Test project with Category D unsupported strobe effect
const mockInvalidProject = {
    ...mockValidProject,
    m3Objects: [
        ...mockValidProject.m3Objects,
        { id: 'strobe1', type: 'effect', presetId: 'strobe-flash', name: 'Strobe Flash' }
    ]
};

const valInvalid = preflightValidator.validate(mockInvalidProject);
assert(valInvalid.isValid === false, 'Project with Strobe Flash fails preflight validation');
assert(valInvalid.canUseFastRender === false, 'Project with Strobe Flash blocked from Fast Render export');
assert(valInvalid.errors.length === 1, '1 Error detected for unsupported Strobe Flash');
assert(valInvalid.errors[0].id.includes('strobe-flash'), 'Error ID correctly identifies strobe-flash');
assert(typeof valInvalid.errors[0].recommendation === 'string', 'Error provides actionable recommendation');

console.log('');

// --- 3. Multi-Sprint Regression Checks (Sprints 1 to 5) ---
console.log('--- 3. Regression Checks across Sprints 1, 2, 3, 4, 5 ---');

assert(capabilityRegistry.isNative('bg_image') === true, 'CapabilityRegistry active');
assert(fastRenderState.getMode() === RENDER_MODES.NORMAL, 'FastRenderState default mode NORMAL');
const restoredObj = modeSwitchAdapter.restoreObjectForNormalMode({ id: 'test1' });
assert(restoredObj.id === 'test1', 'ModeSwitchAdapter operational');
const shakeVector = seededNoiseAdapter.getSeededCameraShake(0.0, 10.0, 10.0, 1337);
assert(typeof shakeVector.x === 'number', 'SeededNoiseAdapter operational');

console.log('\n========================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (0 REGRESSIONS)`);
console.log('========================================================\n');
