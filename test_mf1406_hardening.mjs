import assert from 'assert';
import { 
    fastWorkspaceManager, 
    ValidationReport,
    CompositionGraph,
    LOOP_CLASSIFICATIONS
} from './src/services/pipeline/fastrender/workspace/index.js';
import { RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';

function runTests() {
    console.log('--- Running MF-1406 Workspace Hardening & Live UI Integration Tests ---\n');

    const mockProject = {
        duration: 15.0,
        m3Objects: [
            { id: 'shake1', type: 'camera-shake', enabled: true },
            { id: 'zoom1', type: 'zoom-hentak', enabled: true },
            { id: 'text1', type: 'text', enabled: true },
            { id: 'strobe1', type: 'strobe-flash', enabled: true, fastModeSuspended: true }
        ]
    };

    // 1. Test Single Gateway Interface (RenderingContext)
    console.log('Test 1: Single UI Gateway Interface (RenderingContext)');
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.FAST, mockProject);
    const fastCtx = fastWorkspaceManager.getRenderingContext(mockProject, 2.5);

    assert.ok(fastCtx.isFastWorkspace, 'RenderingContext reflects FAST workspace');
    assert.ok(typeof fastCtx.getPreviewObjects === 'function', 'Exposes getPreviewObjects UI gateway');
    assert.ok(typeof fastCtx.getInspectorValidationSummary === 'function', 'Exposes getInspectorValidationSummary UI gateway');
    assert.ok(typeof fastCtx.getTimelineCompositionSummary === 'function', 'Exposes getTimelineCompositionSummary UI gateway');
    assert.ok(typeof fastCtx.getBoundaryValidationFeedback === 'function', 'Exposes getBoundaryValidationFeedback UI gateway');
    console.log('✓ RenderingContext provides unified single UI gateway interface\n');

    // 2. Test WYSIWYG Live Preview Objects Processing
    console.log('Test 2: WYSIWYG Live Preview Objects Processing');
    const previewObjects = fastCtx.getPreviewObjects(mockProject.m3Objects, 2.5);
    
    assert.strictEqual(previewObjects.length, 4, 'Preserves object count');
    const adaptedShake = previewObjects.find(o => o.id === 'shake1');
    assert.strictEqual(adaptedShake._fastModeAdapted, true, 'Camera shake visual object adapted procedurally for live preview');
    assert.ok(typeof adaptedShake.props?.shakeX === 'number', 'Shake X calculated procedurally at timecode 2.5s');

    const suspendedStrobe = previewObjects.find(o => o.id === 'strobe1');
    assert.strictEqual(suspendedStrobe._renderOpacity, 0.3, 'Suspended strobe badge/opacity formatted for live composer preview');
    console.log('✓ Live preview canvas receives procedurally adapted objects matching Fast Render output\n');

    // 3. Test Inspector Integration & ValidationReport Consumption
    console.log('Test 3: Inspector Integration via RenderingContext');
    const shakeSummary = fastCtx.getInspectorValidationSummary(mockProject.m3Objects[0]);
    assert.strictEqual(shakeSummary.isFastWorkspace, true);
    assert.strictEqual(shakeSummary.supported, true);
    assert.strictEqual(shakeSummary.classification.classification, LOOP_CLASSIFICATIONS.LOOP_ADAPTED);

    const strobeSummary = fastCtx.getInspectorValidationSummary(mockProject.m3Objects[3]);
    assert.strictEqual(strobeSummary.supported, false);
    assert.strictEqual(strobeSummary.isSuspended, true);
    assert.strictEqual(strobeSummary.badge, '⚡ SUSPENDED IN FAST MODE');
    console.log('✓ Inspector consumes ValidationReport & LoopCapabilityRegistry purely through RenderingContext\n');

    // 4. Test Timeline Composition Summary Integration
    console.log('Test 4: Timeline Composition Summary via RenderingContext');
    const timelineSummary = fastCtx.getTimelineCompositionSummary();
    assert.strictEqual(timelineSummary.isFastWorkspace, true);
    assert.strictEqual(timelineSummary.hasGraph, true);
    assert.ok(timelineSummary.segments.length >= 3, 'Timeline summary includes composition graph segments');
    assert.strictEqual(timelineSummary.accentColor, '#f97316', 'Timeline accent color set for Fast Workspace identity');
    console.log('✓ Timeline panel receives CompositionGraph summary via RenderingContext\n');

    // 5. Test Normal Workspace Isolation
    console.log('Test 5: Normal Workspace Complete Isolation');
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.NORMAL, mockProject);
    const normalCtx = fastWorkspaceManager.getRenderingContext(mockProject, 2.5);

    assert.strictEqual(normalCtx.isFastWorkspace, false);
    const normalPreviewObjs = normalCtx.getPreviewObjects(mockProject.m3Objects, 2.5);
    assert.strictEqual(normalPreviewObjs, mockProject.m3Objects, 'Normal Workspace passes through raw objects');
    
    const normalTimelineSummary = normalCtx.getTimelineCompositionSummary();
    assert.strictEqual(normalTimelineSummary.isFastWorkspace, false);
    assert.strictEqual(normalTimelineSummary.hasGraph, false);
    assert.strictEqual(normalTimelineSummary.accentColor, '#2563eb');
    console.log('✓ Normal Workspace remains completely isolated and unchanged\n');

    console.log('All MF-1406 Workspace Hardening & Integration tests passed successfully! 🚀');
}

runTests();
