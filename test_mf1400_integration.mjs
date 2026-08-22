/**
 * test_mf1400_integration.mjs
 * Automated Integration & State Restoration Test Suite for MF-1400 Fast Workspace Foundation.
 */

import { fastWorkspaceManager } from './src/services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { modeSwitchAdapter } from './src/services/pipeline/fastrender/core/ModeSwitchAdapter.js';
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
console.log('  MF-1400 FAST WORKSPACE — INTEGRATION TEST SUITE      ');
console.log('========================================================\n');

async function runIntegrationSuite() {
    // --- 1. Project State Roundtrip Parity (NORMAL -> FAST -> NORMAL) ---
    console.log('--- 1. Testing Project State Roundtrip Parity (NORMAL -> FAST -> NORMAL) ---');

    const complexProject = {
        m3BgPool: [
            { id: 'bg1', type: 'background', mediaType: 'video', source: 'neon.mp4', settings: { backgroundZoom: 10 } }
        ],
        m3AudioTracks: [
            { id: 'audio1', title: 'Cyberpunk Synthwave Track 1', duration: 240 }
        ],
        m3Objects: [
            { id: 't1', type: 'text', name: 'Main Title', color: '#ffffff', fontSize: 64 },
            { id: 'sub1', type: 'subtitle', name: 'Synced Subtitles' },
            { id: 'vis1', type: 'visualizer', presetId: 'vis_bars' },
            { id: 'fx1', type: 'effect', presetId: 'camera-shake', props: { strength: 40 } },
            { id: 'fx2', type: 'effect', presetId: 'strobe-flash', enabled: true, props: { brightness: 100 } },
            { id: 'p1', type: 'particle', shape: 'star', count: 120 }
        ],
        m3TotalDurationSec: 240.0,
        m3RenderSettings: { format: 'mp4', resolution: '1080p', fps: 60 }
    };

    const initialProjectJSON = JSON.stringify(complexProject);

    // Switch to FAST workspace
    const fastResult = fastWorkspaceManager.switchWorkspace('FAST', complexProject);
    assert(fastWorkspaceManager.getActiveWorkspace() === 'FAST', 'Fast Workspace is active');
    assert(fastResult.adaptedState.m3Objects.length === complexProject.m3Objects.length, 'Object count preserved in FAST workspace');
    assert(fastResult.adaptedState.m3Objects[4].enabled === false, 'Category D effect (strobe-flash) suspended in FAST workspace');
    assert(fastResult.adaptedState.m3Objects[4].fastModeSuspended === true, 'fastModeSuspended marker attached');

    // RenderingContext verification
    const ctx = fastResult.renderingContext;
    assert(ctx.workspaceMode === 'FAST', 'RenderingContext workspaceMode is FAST');
    
    const composerProv = ctx.getProvider('composer');
    const processedObjects = composerProv.processComposition(fastResult.adaptedState.m3Objects);
    assert(processedObjects[4]._renderBadge === 'SUSPENDED_FAST_MODE', 'ComposerProvider applies SUSPENDED_FAST_MODE badge');

    const inspectorProv = ctx.getProvider('inspector');
    const strobeInsp = inspectorProv.processInspectorProps(fastResult.adaptedState.m3Objects[4]);
    assert(strobeInsp.supported === false, 'InspectorProvider marks suspended strobe control unsupported');
    assert(strobeInsp.badge === '⚡ SUSPENDED IN FAST MODE', 'InspectorProvider displays fast mode badge');

    // Switch back to NORMAL workspace
    const normalResult = fastWorkspaceManager.switchWorkspace('NORMAL', fastResult.adaptedState);
    assert(fastWorkspaceManager.getActiveWorkspace() === 'NORMAL', 'Restored to NORMAL workspace');
    assert(normalResult.adaptedState.m3Objects[4].enabled === true, 'Strobe flash re-enabled upon return to NORMAL workspace');
    assert(normalResult.adaptedState.m3Objects[4].fastModeSuspended === undefined, 'fastModeSuspended marker removed');

    const restoredProjectJSON = JSON.stringify(normalResult.adaptedState);
    assert(initialProjectJSON === restoredProjectJSON, 'Project state 100% identical post NORMAL -> FAST -> NORMAL roundtrip');

    console.log('');

    // --- 2. Multiple Workspace Toggles Stress Test ---
    console.log('--- 2. Testing 50 Sequential Workspace Toggles ---');
    let stateTracker = JSON.parse(initialProjectJSON);

    for (let i = 0; i < 50; i++) {
        const targetMode = i % 2 === 0 ? 'FAST' : 'NORMAL';
        const res = fastWorkspaceManager.switchWorkspace(targetMode, stateTracker);
        stateTracker = res.adaptedState;
    }

    // Force back to NORMAL if needed
    if (fastWorkspaceManager.getActiveWorkspace() !== 'NORMAL') {
        stateTracker = fastWorkspaceManager.switchWorkspace('NORMAL', stateTracker).adaptedState;
    }

    assert(JSON.stringify(complexProject) === JSON.stringify(stateTracker), 'Zero project data corruption after 50 rapid workspace toggles');

    console.log('');

    // --- 3. Rendering Context Dependency Injection Verification ---
    console.log('--- 3. Testing Rendering Context Dependency Injection ---');
    const activeCtx = fastWorkspaceManager.getRenderingContext(stateTracker, 12.5);
    assert(activeCtx.currentTimeSec === 12.5, 'RenderingContext captures active project timecode');
    assert(activeCtx.getProvider('preview').evaluatePreviewFrame(12.5, stateTracker).timeSec === 12.5, 'PreviewProvider evaluates frame with timecode');
    assert(activeCtx.getProvider('timeline').getTimelineIndicators().statusLabel === 'Normal Timeline', 'TimelineProvider status label for NORMAL workspace');

    console.log('');

    // --- 4. Validation against Frozen Engine Modules ---
    console.log('--- 4. Verifying Compatibility with Frozen Fast Render Engine ---');
    const e2eProject = {
        m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'video', source: 'loop.mp4' }],
        m3AudioTracks: [{ id: 'audio1', title: 'EDM Playlist Track 1', duration: 300 }],
        m3Objects: [
            { id: 't1', type: 'text', name: 'Song Title Header', fontSize: 48 },
            { id: 'vis1', type: 'visualizer', presetId: 'vis_bars', name: 'Spectrum Bars' },
            { id: 'fx1', type: 'effect', presetId: 'camera-shake', name: 'Handheld Shake', props: { strength: 30 } }
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
    console.log(`  ALL ${passedTests}/${totalTests} INTEGRATION TESTS PASSED!`);
    console.log('========================================================\n');
}

runIntegrationSuite().catch(err => {
    console.error('Integration suite failure:', err);
    process.exit(1);
});
