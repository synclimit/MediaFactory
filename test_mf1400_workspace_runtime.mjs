/**
 * test_mf1400_workspace_runtime.mjs
 * Automated Unit Test Suite for MF-1400 Fast Workspace Foundation.
 * Tests WorkspaceRuntime, RenderingContext, Providers, and Inactive Extension Point Placeholders.
 */

import { 
    FastWorkspaceManager, 
    fastWorkspaceManager, 
    RenderingContext, 
    WorkspaceRuntime, 
    NormalWorkspaceRuntime, 
    FastWorkspaceRuntime,
    ComposerProvider,
    PreviewProvider,
    TimelineProvider,
    InspectorProvider,
    LoopProvider,
    ProceduralProvider,
    ValidationProvider
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
console.log('  MF-1400 FAST WORKSPACE RUNTIME — UNIT TEST SUITE      ');
console.log('========================================================\n');

async function runRuntimeSuite() {
    // --- 1. Workspace Runtime Abstractions ---
    console.log('--- 1. Testing WorkspaceRuntime Abstractions ---');
    const normalRuntime = new NormalWorkspaceRuntime();
    assert(normalRuntime.getMode() === 'NORMAL', 'NormalWorkspaceRuntime mode is NORMAL');
    assert(normalRuntime.getProviders().composer instanceof ComposerProvider, 'Normal runtime includes ComposerProvider');
    assert(normalRuntime.getProviders().preview instanceof PreviewProvider, 'Normal runtime includes PreviewProvider');
    assert(normalRuntime.getProviders().timeline instanceof TimelineProvider, 'Normal runtime includes TimelineProvider');
    assert(normalRuntime.getProviders().inspector instanceof InspectorProvider, 'Normal runtime includes InspectorProvider');

    const fastRuntime = new FastWorkspaceRuntime();
    assert(fastRuntime.getMode() === 'FAST', 'FastWorkspaceRuntime mode is FAST');
    assert(fastRuntime.getProviders().composer.getMode() === 'FAST', 'Fast runtime ComposerProvider mode is FAST');
    assert(fastRuntime.getProviders().preview.getMode() === 'FAST', 'Fast runtime PreviewProvider mode is FAST');
    assert(fastRuntime.getProviders().timeline.getMode() === 'FAST', 'Fast runtime TimelineProvider mode is FAST');
    assert(fastRuntime.getProviders().inspector.getMode() === 'FAST', 'Fast runtime InspectorProvider mode is FAST');

    console.log('');

    // --- 2. Inactive Extension Points ---
    console.log('--- 2. Testing Extension Point Activation ---');
    const normalExt = normalRuntime.getExtensions();
    assert(normalExt.loopProvider.isActive === false, 'LoopProvider remains strictly inactive in Normal Workspace');
    assert(normalExt.proceduralProvider.isActive === false, 'ProceduralProvider remains strictly inactive in Normal Workspace');

    const fastExt = fastRuntime.getExtensions();
    assert(fastExt.loopProvider.isActive === true, 'FastWorkspaceRuntime activates FastLoopProvider for MF-1401');
    assert(fastExt.proceduralProvider.isActive === true, 'FastWorkspaceRuntime activates FastProceduralProvider for MF-1403');

    assert(fastExt.validationProvider.isActive === true, 'FastWorkspaceRuntime activates FastValidationProvider for MF-1405');

    console.log('');

    // --- 3. Unified Rendering Context ---
    console.log('--- 3. Testing Unified RenderingContext & Dependency Injection ---');
    const dummyState = { m3Objects: [{ id: 't1', type: 'text' }] };
    const ctx = fastRuntime.createRenderingContext(dummyState, 5.0);
    assert(ctx instanceof RenderingContext, 'createRenderingContext returns RenderingContext instance');
    assert(ctx.workspaceMode === 'FAST', 'RenderingContext reflects FAST workspace mode');
    assert(ctx.isFastWorkspace === true, 'isFastWorkspace is true in FAST context');
    assert(ctx.getProvider('composer') instanceof ComposerProvider, 'ctx.getProvider("composer") returns ComposerProvider');
    assert(ctx.getProvider('preview') instanceof PreviewProvider, 'ctx.getProvider("preview") returns PreviewProvider');
    assert(ctx.getExtension('loopProvider') instanceof LoopProvider, 'ctx.getExtension("loopProvider") returns LoopProvider');
    assert(ctx.currentTimeSec === 5.0, 'RenderingContext preserves timecode 5.0s');

    const updatedCtx = ctx.withTime(10.0);
    assert(updatedCtx.currentTimeSec === 10.0, 'withTime returns updated context instance with timecode 10.0s');
    assert(ctx.currentTimeSec === 5.0, 'Original context immutable');

    console.log('');

    // --- 4. FastWorkspaceManager State & Switching ---
    console.log('--- 4. Testing FastWorkspaceManager Lifecycle & Events ---');
    assert(fastWorkspaceManager.getActiveWorkspace() === 'NORMAL', 'Default workspace is NORMAL');
    assert(fastWorkspaceManager.isFastWorkspaceActive() === false, 'isFastWorkspaceActive() returns false initially');

    let eventFired = false;
    let eventMode = null;
    const unsub = fastWorkspaceManager.subscribe((event) => {
        eventFired = true;
        eventMode = event.mode;
    });

    const switchResult = fastWorkspaceManager.switchWorkspace('FAST', dummyState);
    assert(switchResult.mode === 'FAST', 'switchWorkspace switches active mode to FAST');
    assert(fastWorkspaceManager.getActiveWorkspace() === 'FAST', 'getActiveWorkspace() returns FAST after switch');
    assert(fastWorkspaceManager.isFastWorkspaceActive() === true, 'isFastWorkspaceActive() returns true');
    assert(eventFired === true && eventMode === 'FAST', 'Subscriber notified of WORKSPACE_SWITCH event');

    // Switch back to NORMAL
    fastWorkspaceManager.restoreNormalWorkspace(dummyState);
    assert(fastWorkspaceManager.getActiveWorkspace() === 'NORMAL', 'Restored to NORMAL workspace');
    assert(fastWorkspaceManager.isFastWorkspaceActive() === false, 'isFastWorkspaceActive() returns false after restore');

    unsub();

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} WORKSPACE RUNTIME TESTS PASSED!`);
    console.log('========================================================\n');
}

runRuntimeSuite().catch(err => {
    console.error('Workspace runtime suite failure:', err);
    process.exit(1);
});
