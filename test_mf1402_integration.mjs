/**
 * test_mf1402_integration.mjs
 * Automated Integration Test Suite for MF-1402 Loop Classification Engine.
 */

import { fastWorkspaceManager, LOOP_CLASSIFICATIONS } from './src/services/pipeline/fastrender/workspace/index.js';
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
console.log('  MF-1402 LOOP CLASSIFICATION — INTEGRATION TEST SUITE ');
console.log('========================================================\n');

async function runClassificationIntegrationSuite() {
    const projectState = {
        m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'video' }],
        m3AudioTracks: [{ id: 'a1', title: 'Track 1' }],
        m3Objects: [
            { id: 't1', type: 'text', name: 'Header Title' },
            { id: 'sub1', type: 'subtitle', name: 'Lyrics' },
            { id: 'vis1', type: 'visualizer', presetId: 'vis_bars' },
            { id: 'fx_shake', type: 'effect', presetId: 'camera-shake', props: { strength: 30 } },
            { id: 'fx_zoom', type: 'effect', presetId: 'zoom-hentak', props: { depth: 50 } },
            { id: 'fx_strobe', type: 'effect', presetId: 'strobe-flash', enabled: true, props: { brightness: 100 } },
            { id: 'p1', type: 'particle', shape: 'star', count: 100 }
        ]
    };

    // --- 1. RenderingContext Classification Metadata Queries ---
    console.log('--- 1. Testing RenderingContext Classification Queries ---');
    fastWorkspaceManager.switchWorkspace('FAST', projectState);
    const fastCtx = fastWorkspaceManager.getRenderingContext(projectState, 0.0);

    const textClass = fastCtx.getFeatureClassification('text');
    assert(textClass.classification === LOOP_CLASSIFICATIONS.LOOP_NATIVE, 'RenderingContext classifies text as LoopNative');
    assert(textClass.adaptationStrategy === 'PassThrough', 'Text strategy is PassThrough');

    const shakeClass = fastCtx.getFeatureClassification('camera-shake');
    assert(shakeClass.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'RenderingContext classifies camera-shake as LoopAdapted');
    assert(shakeClass.adaptationStrategy === 'SeededNoise', 'camera-shake strategy is SeededNoise');

    const zoomClass = fastCtx.getFeatureClassification('zoom-hentak');
    assert(zoomClass.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'RenderingContext classifies zoom-hentak as LoopAdapted');
    assert(zoomClass.adaptationStrategy === 'PeriodicNoise', 'zoom-hentak strategy is PeriodicNoise');

    const subClass = fastCtx.getFeatureClassification('subtitle');
    assert(subClass.classification === LOOP_CLASSIFICATIONS.TIMELINE_ONLY, 'RenderingContext classifies subtitle as TimelineOnly');

    const strobeClass = fastCtx.getFeatureClassification('strobe-flash');
    assert(strobeClass.classification === LOOP_CLASSIFICATIONS.UNSUPPORTED, 'RenderingContext classifies strobe-flash as Unsupported');

    console.log('');

    // --- 2. InspectorProvider Rich Metadata Output ---
    console.log('--- 2. Testing InspectorProvider Metadata Output ---');
    const inspectorProv = fastCtx.getProvider('inspector');

    const zoomInsp = inspectorProv.processInspectorProps(projectState.m3Objects[4]);
    assert(zoomInsp.supported === true, 'zoom-hentak is supported in Fast Workspace');
    assert(zoomInsp.classificationData.classification === 'LoopAdapted', 'zoom-hentak classification is LoopAdapted');
    assert(zoomInsp.classificationData.adaptationStrategy === 'PeriodicNoise', 'zoom-hentak strategy is PeriodicNoise');
    assert(zoomInsp.badge.includes('LOOPADAPTED'), 'zoom-hentak badge reflects LoopAdapted classification');

    const strobeInsp = inspectorProv.processInspectorProps(projectState.m3Objects[5]);
    assert(strobeInsp.supported === false, 'strobe-flash is marked unsupported in Fast Workspace');
    assert(strobeInsp.classificationData.classification === 'Unsupported', 'strobe-flash classification is Unsupported');
    assert(strobeInsp.badge === '⚡ SUSPENDED IN FAST MODE', 'strobe-flash displays suspended badge');

    console.log('');

    // --- 3. Normal Workspace Query Parity & Isolation ---
    console.log('--- 3. Testing Normal Workspace Isolation & Capability Parity ---');
    fastWorkspaceManager.switchWorkspace('NORMAL', projectState);
    const normalCtx = fastWorkspaceManager.getRenderingContext(projectState, 0.0);
    const normalInsp = normalCtx.getProvider('inspector');

    const normalStrobeInsp = normalInsp.processInspectorProps(projectState.m3Objects[5]);
    assert(normalStrobeInsp.supported === true, 'strobe-flash is supported in Normal Workspace');
    assert(normalStrobeInsp.classificationData.classification === 'Unsupported', 'Classification metadata query still available in Normal Workspace');

    console.log('');

    // --- 4. Verifying Frozen Fast Render Engine Modules ---
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
    console.log(`  ALL ${passedTests}/${totalTests} CLASSIFICATION INTEGRATION TESTS PASSED!`);
    console.log('========================================================\n');
}

runClassificationIntegrationSuite().catch(err => {
    console.error('Classification integration suite failure:', err);
    process.exit(1);
});
