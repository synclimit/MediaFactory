/**
 * test_mf1403_integration.mjs
 * Automated Integration Test Suite for MF-1403 Procedural Adaptation Framework.
 */

import { fastWorkspaceManager } from './src/services/pipeline/fastrender/workspace/index.js';
import { fastRenderPlanner } from './src/services/pipeline/fastrender/planner/FastRenderPlanner.js';
import { preflightValidator } from './src/services/pipeline/fastrender/planner/PreflightValidator.js';
import { fastRenderExportEngine } from './src/services/pipeline/fastrender/export/FastRenderExportEngine.js';

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
console.log('  MF-1403 ADAPTATION FRAMEWORK — INTEGRATION TEST SUITE ');
console.log('========================================================\n');

async function runAdaptationIntegrationSuite() {
    const projectState = {
        m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'video' }],
        m3AudioTracks: [{ id: 'a1', title: 'Track 1' }],
        m3Objects: [
            { id: 't1', type: 'text', name: 'Header Title' },
            { id: 'fx_shake', type: 'effect', presetId: 'camera-shake', props: { strength: 30 } },
            { id: 'fx_zoom', type: 'effect', presetId: 'zoom-hentak', props: { depth: 50, speed: 1.0 } },
            { id: 'p1', type: 'particle', shape: 'star', count: 100 }
        ]
    };

    // --- 1. Fast Workspace RenderingContext Adaptation Integration ---
    console.log('--- 1. Testing Fast Workspace RenderingContext Adaptation Integration ---');
    fastWorkspaceManager.switchWorkspace('FAST', projectState);
    const fastCtx = fastWorkspaceManager.getRenderingContext(projectState, 2.5);

    const procProv = fastCtx.getExtension('proceduralProvider');
    assert(procProv.isActive === true, 'ProceduralProvider is ACTIVE in Fast Workspace');

    // Adapt single Camera Shake object via RenderingContext
    const shakeAdaptRes = fastCtx.adaptObject(projectState.m3Objects[1], 2.5);
    assert(shakeAdaptRes.isAdapted === true, 'RenderingContext adaptObject adapts Camera Shake');
    assert(shakeAdaptRes.strategyUsed === 'SeededNoise', 'Strategy used is SeededNoise');
    assert(typeof shakeAdaptRes.adaptedObject.props.shakeX === 'number', 'adaptedObject contains computed shakeX');

    // Adapt entire array of objects via RenderingContext
    const adaptedObjects = fastCtx.adaptProjectObjects(projectState.m3Objects, 2.5);
    assert(adaptedObjects.length === 4, 'adaptProjectObjects returns array of same length');
    assert(adaptedObjects[0] === projectState.m3Objects[0], 'Text object passed through untouched');
    assert(adaptedObjects[1]._fastModeAdapted === true, 'Camera Shake adapted in array');
    assert(adaptedObjects[2]._fastModeAdapted === true, 'Zoom Pulse adapted in array');

    console.log('');

    // --- 2. Normal Workspace Pass-Through & Isolation ---
    console.log('--- 2. Testing Normal Workspace Pass-Through & Isolation ---');
    fastWorkspaceManager.switchWorkspace('NORMAL', projectState);
    const normalCtx = fastWorkspaceManager.getRenderingContext(projectState, 2.5);

    const normalProcProv = normalCtx.getExtension('proceduralProvider');
    assert(normalProcProv.isActive === false, 'ProceduralProvider is INACTIVE in Normal Workspace');

    const normalAdaptRes = normalCtx.adaptObject(projectState.m3Objects[1], 2.5);
    assert(normalAdaptRes.isAdapted === false, 'Normal Workspace adaptObject passes through without adaptation');
    assert(normalAdaptRes.adaptedObject === projectState.m3Objects[1], 'Original object instance returned in Normal Workspace');

    console.log('');

    // --- 3. Non-Destructive State Preservation ---
    console.log('--- 3. Testing Non-Destructive Original Object Preservation ---');
    assert(projectState.m3Objects[1].props.shakeX === undefined, 'Original Camera Shake object props untouched by adaptation');
    assert(projectState.m3Objects[2].props.pulseScale === undefined, 'Original Zoom Pulse object props untouched by adaptation');

    console.log('');

    // --- 4. Verifying Frozen Fast Render Engine Compatibility ---
    console.log('--- 4. Verifying Compatibility with Frozen Fast Render Engine ---');
    const e2eProject = {
        m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'video', source: 'loop.mp4' }],
        m3AudioTracks: [{ id: 'audio1', title: 'EDM Track', duration: 300 }],
        m3Objects: [
            { id: 't1', type: 'text', name: 'Song Title' },
            { id: 'vis1', type: 'visualizer', presetId: 'vis_bars' },
            { id: 'fx1', type: 'effect', presetId: 'camera-shake', props: { strength: 30 } }
        ],
        m3TotalDurationSec: 300.0,
        m3RenderSettings: { format: 'mp4', resolution: '1080p', fps: 60 }
    };

    const plan = fastRenderPlanner.createPlan(e2eProject);
    assert(plan.isFastRenderReady === true, 'Frozen FastRenderPlanner creates valid plan');

    const val = preflightValidator.validate(e2eProject);
    assert(val.isValid === true, 'Frozen PreflightValidator validates project');

    const exp = await fastRenderExportEngine.executeExport(e2eProject);
    assert(exp.success === true, 'Frozen FastRenderExportEngine executes export');

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} ADAPTATION INTEGRATION TESTS PASSED!`);
    console.log('========================================================\n');
}

runAdaptationIntegrationSuite().catch(err => {
    console.error('Adaptation integration suite failure:', err);
    process.exit(1);
});
