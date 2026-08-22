/**
 * test_mf1305_export.mjs
 * Automated Unit, Integration & E2E Test Suite for MF-1305 Export Sprint
 */

import { fastRenderExportEngine } from './src/services/pipeline/fastrender/export/FastRenderExportEngine.js';
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
console.log('  MF-1305 EXPORT ENGINE — UNIT, INTEGRATION & E2E TESTS ');
console.log('========================================================\n');

// Mock Valid Project
const mockValidProject = {
    m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'image' }],
    m3AudioTracks: [{ id: 'audio1', title: 'Music Track' }],
    m3Objects: [
        { id: 'text1', type: 'text', name: 'Header Subtitle' },
        { id: 'shake1', type: 'effect', presetId: 'camera-shake', name: 'Guncang Kamera' }
    ],
    m3TotalDurationSec: 180.0,
    m3OutputFilename: 'MyFastVideo.mp4',
    m3RenderSettings: { format: 'mp4', resolution: '1080p' }
};

// Mock Invalid Project
const mockInvalidProject = {
    ...mockValidProject,
    m3Objects: [
        ...mockValidProject.m3Objects,
        { id: 'strobe1', type: 'effect', presetId: 'strobe-flash', name: 'Strobe Flash' }
    ]
};

async function runTests() {
    // --- 1. FastRenderExportEngine E2E Pipeline Execution Tests ---
    console.log('--- 1. Testing End-to-End Export Pipeline Execution ---');

    const progressLogs = [];
    const result = await fastRenderExportEngine.executeExport(mockValidProject, { fps: 60, seed: 1337 }, (progress) => {
        progressLogs.push(progress);
    });

    assert(result.success === true, 'End-to-End Export completed successfully');
    assert(typeof result.exportId === 'string' && result.exportId.startsWith('export_'), 'Export ID generated');
    assert(result.renderMode === RENDER_MODES.FAST, 'Export executed in FAST render mode');
    assert(result.masterFramesRendered === 600, '600 master loop frames rendered for 10s loop at 60 FPS');
    assert(result.estimatedSpeedup === '18x', 'Estimated speedup reported as 18x');
    assert(progressLogs.length >= 5, 'Progress callbacks received for all 5 pipeline steps');

    console.log('');

    // --- 2. Determinism Verification Tests ---
    console.log('--- 2. Testing Export Determinism across Identical Seeds ---');

    const resultA = await fastRenderExportEngine.executeExport(mockValidProject, { fps: 60, seed: 1337 });
    const resultB = await fastRenderExportEngine.executeExport(mockValidProject, { fps: 60, seed: 1337 });

    assert(resultA.masterFramesRendered === resultB.masterFramesRendered, 'Master frames count identical');
    assert(resultA.totalVideoFrames === resultB.totalVideoFrames, 'Total video frames count identical');
    assert(resultA.estimatedSpeedup === resultB.estimatedSpeedup, 'Estimated speedup ratio identical');

    console.log('');

    // --- 3. Preflight Blocking & Failure Handling Tests ---
    console.log('--- 3. Testing Preflight Blocking on Invalid Projects ---');

    let exportError = null;
    try {
        await fastRenderExportEngine.executeExport(mockInvalidProject);
    } catch (err) {
        exportError = err;
    }

    assert(exportError !== null, 'Export engine throws exception on invalid project with Strobe Flash');
    assert(exportError.message.includes('Strobe causes frame repetition'), 'Exception contains human-readable preflight recommendation');

    console.log('');

    // --- 4. Multi-Sprint Comprehensive Regression Suite (Sprints 1 - 6) ---
    console.log('--- 4. Regression Checks across Sprints 1, 2, 3, 4, 5, 6 ---');

    assert(capabilityRegistry.isNative('bg_image') === true, 'CapabilityRegistry operational');
    assert(fastRenderState.getMode() === RENDER_MODES.NORMAL, 'FastRenderState operational');
    const restored = modeSwitchAdapter.restoreObjectForNormalMode({ id: 't1' });
    assert(restored.id === 't1', 'ModeSwitchAdapter operational');
    const noise = seededNoiseAdapter.getPeriodicNoise(0.0, 10.0, 1.0, 1337);
    assert(typeof noise === 'number', 'SeededNoiseAdapter operational');
    const plan = fastRenderPlanner.createPlan(mockValidProject);
    assert(plan.isFastRenderReady === true, 'FastRenderPlanner operational');
    const val = preflightValidator.validate(mockValidProject);
    assert(val.isValid === true, 'PreflightValidator operational');

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (0 REGRESSIONS)`);
    console.log('========================================================\n');
}

runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
