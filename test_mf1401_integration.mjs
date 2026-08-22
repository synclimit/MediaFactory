/**
 * test_mf1401_integration.mjs
 * Automated Integration Test Suite for MF-1401 Loop Preview Engine.
 */

import { 
    fastWorkspaceManager, 
    loopPreviewController, 
    FastLoopProvider, 
    inactiveLoopProvider 
} from './src/services/pipeline/fastrender/workspace/index.js';

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
console.log('  MF-1401 LOOP PREVIEW ENGINE — INTEGRATION TEST SUITE  ');
console.log('========================================================\n');

async function runIntegrationSuite() {
    const dummyProject = {
        m3BgPool: [{ id: 'bg1', type: 'background', mediaType: 'video' }],
        m3AudioTracks: [{ id: 'a1', title: 'Track 1' }],
        m3Objects: [
            { id: 't1', type: 'text', name: 'Header' },
            { id: 'fx1', type: 'effect', presetId: 'camera-shake', props: { strength: 20 } }
        ]
    };

    // --- 1. Workspace Runtime Extension Point Activation ---
    console.log('--- 1. Testing Workspace Runtime Extension Point Activation ---');

    // Switch to NORMAL workspace
    fastWorkspaceManager.switchWorkspace('NORMAL', dummyProject);
    const normalCtx = fastWorkspaceManager.getRenderingContext(dummyProject, 5.0);
    const normalLoopProv = normalCtx.getExtension('loopProvider');

    assert(normalLoopProv.isActive === false, 'LoopProvider is INACTIVE in Normal Workspace');
    assert(normalLoopProv.getLoopDuration() === null, 'Normal Workspace LoopProvider returns null for duration');
    assert(normalCtx.getMappedTime(5.0).mappedPlaybackTime === 5.0, 'Normal Workspace timecode passed through unmapped');

    // Switch to FAST workspace
    fastWorkspaceManager.switchWorkspace('FAST', dummyProject);
    const fastCtx = fastWorkspaceManager.getRenderingContext(dummyProject, 0.5);
    const fastLoopProv = fastCtx.getExtension('loopProvider');

    assert(fastLoopProv instanceof FastLoopProvider, 'FastWorkspaceRuntime binds FastLoopProvider');
    assert(fastLoopProv.isActive === true, 'LoopProvider is ACTIVE in Fast Workspace');
    assert(fastLoopProv.getLoopDuration() === 10.0, 'Fast Workspace LoopProvider retrieves dynamic master loop duration');

    console.log('');

    // --- 2. Dependency Injection via RenderingContext ---
    console.log('--- 2. Testing Dependency Injection of Loop State & Timecode via RenderingContext ---');
    fastLoopProv.setLoopPreviewActive(true);

    const mappedData = fastCtx.getMappedTime(0.5);
    assert(mappedData.isInPreviewWindow === true, 'RenderingContext.getMappedTime identifies preview window');
    assert(mappedData.mappedPlaybackTime === 8.5, 'RenderingContext.getMappedTime calculates mapped time 8.5s');

    const overlayState = fastCtx.getLoopPreviewState();
    assert(overlayState.loopEnd === 10.0, 'RenderingContext.getLoopPreviewState retrieves loop end 10.0s');
    assert(overlayState.preBoundaryRegion.start === 8.0, 'RenderingContext.getLoopPreviewState preBoundaryRegion start is 8.0s');

    const stepControls = fastCtx.getBoundaryStepControls();
    assert(typeof stepControls.stepForward === 'function', 'RenderingContext.getBoundaryStepControls exposes stepForward control');

    console.log('');

    // --- 3. TimelineProvider Overlay Data Generation ---
    console.log('--- 3. Testing TimelineProvider Overlay Data Generation ---');
    const timelineProv = fastCtx.getProvider('timeline');
    const timelineOverlay = timelineProv.getLoopOverlayData(fastLoopProv);

    assert(timelineOverlay.showLoopOverlay === true, 'TimelineProvider enables showLoopOverlay in Fast Workspace');
    assert(timelineOverlay.loopStart === 0.0, 'TimelineProvider specifies loopStart 0.0s');
    assert(timelineOverlay.loopEnd === 10.0, 'TimelineProvider specifies loopEnd 10.0s');
    assert(timelineOverlay.preRegion.start === 8.0, 'TimelineProvider specifies preRegion start 8.0s');

    // Check Normal Workspace timeline provider isolation
    fastWorkspaceManager.switchWorkspace('NORMAL', dummyProject);
    const normalTimelineProv = fastWorkspaceManager.getRenderingContext().getProvider('timeline');
    const normalOverlay = normalTimelineProv.getLoopOverlayData(normalLoopProv);
    assert(normalOverlay.showLoopOverlay === false, 'TimelineProvider disables loop overlay in Normal Workspace');

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} INTEGRATION TESTS PASSED!`);
    console.log('========================================================\n');
}

runIntegrationSuite().catch(err => {
    console.error('Integration suite failure:', err);
    process.exit(1);
});
