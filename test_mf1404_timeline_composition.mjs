import assert from 'assert';
import { 
    timelineComposer, 
    timelineRouter, 
    fastWorkspaceManager,
    LOOP_CLASSIFICATIONS 
} from './src/services/pipeline/fastrender/workspace/index.js';
import { RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';

function runTests() {
    console.log('--- Running MF-1404 Timeline Composition Tests ---\n');

    const mockProjectState = {
        duration: 15.0,
        m3Objects: [
            { id: '1', type: 'text', startTime: 0 },         // LOOP_NATIVE -> Loop
            { id: '2', type: 'camera-shake', startTime: 0 }, // LOOP_ADAPTED -> Loop Preview
            { id: '3', type: 'intro', startTime: 0 },        // TIMELINE_ONLY -> Intro
            { id: '4', type: 'outro', startTime: 12 },       // TIMELINE_ONLY -> Outro
            { id: '5', type: 'strobe-flash', startTime: 5 }  // UNSUPPORTED -> Ignored in graph
        ]
    };

    const mockLoopOverlayData = {
        showLoopOverlay: true,
        loopStart: 2.0,
        loopEnd: 12.0
    };

    // Test 1: TimelineRouter Routing
    console.log('Test 1: TimelineRouter Routing');
    const nativeRoute = timelineRouter.routeObject({ type: 'text' });
    assert.strictEqual(nativeRoute.route, 'LOOP_REGION');
    assert.strictEqual(nativeRoute.targetSegment, 'Loop');
    assert.strictEqual(nativeRoute.classification, LOOP_CLASSIFICATIONS.LOOP_NATIVE);

    const adaptedRoute = timelineRouter.routeObject({ type: 'camera-shake' });
    assert.strictEqual(adaptedRoute.route, 'ADAPTATION_ENGINE');
    assert.strictEqual(adaptedRoute.targetSegment, 'Loop');
    assert.strictEqual(adaptedRoute.classification, LOOP_CLASSIFICATIONS.LOOP_ADAPTED);

    const timelineRoute = timelineRouter.routeObject({ type: 'intro' });
    assert.strictEqual(timelineRoute.route, 'TIMELINE');
    assert.strictEqual(timelineRoute.targetSegment, 'Timeline');

    const unsupportedRoute = timelineRouter.routeObject({ type: 'strobe-flash' });
    assert.strictEqual(unsupportedRoute.route, 'VALIDATION_LAYER');
    console.log('✓ TimelineRouter routes objects purely by metadata\n');

    // Test 2: TimelineComposer CompositionGraph Generation
    console.log('Test 2: TimelineComposer Graph Generation');
    const graph = timelineComposer.compose(mockProjectState, mockLoopOverlayData);
    const segments = graph.getSegments();
    
    // Should have Intro, Loop, Loop Preview, Outro
    assert.strictEqual(segments.length, 4, 'Graph should contain exactly 4 segments');
    assert.strictEqual(segments[0].type, 'Intro');
    assert.strictEqual(segments[1].type, 'Loop');
    assert.strictEqual(segments[2].type, 'Loop Preview');
    assert.strictEqual(segments[3].type, 'Outro');

    const intro = graph.getSegmentById('segment-intro');
    const loop = graph.getSegmentById('segment-loop');
    const loopPreview = graph.getSegmentById('segment-loop-preview');
    const outro = graph.getSegmentById('segment-outro');

    assert.strictEqual(intro.duration, 2.0);
    assert.strictEqual(loop.duration, 10.0);
    assert.strictEqual(outro.duration, 3.0);
    
    // Check object routing into segments
    assert.strictEqual(loop.children.length, 1, 'Loop should contain native objects');
    assert.strictEqual(loop.children[0].type, 'text');
    
    assert.strictEqual(loopPreview.children.length, 1, 'Loop Preview should contain adapted objects');
    assert.strictEqual(loopPreview.children[0].type, 'camera-shake');

    assert.strictEqual(intro.children.length, 1, 'Intro should contain timeline objects before loop');
    assert.strictEqual(intro.children[0].type, 'intro');

    assert.strictEqual(outro.children.length, 1, 'Outro should contain timeline objects after loop');
    assert.strictEqual(outro.children[0].type, 'outro');

    console.log('✓ CompositionGraph models playback and retains rich metadata\n');

    // Test 3: RenderingContext Integration
    console.log('Test 3: RenderingContext Integration');
    // Simulate Fast Workspace
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.FAST, mockProjectState);
    // Note: getRenderingContext generates a NEW context
    const fastContext = fastWorkspaceManager.getRenderingContext(mockProjectState, 5.0);
    
    const contextGraph = fastContext.getCompositionGraph();
    assert.ok(contextGraph, 'Fast Workspace context should contain CompositionGraph');
    
    const currentSegment = fastContext.getCurrentSegment(5.0);
    assert.ok(currentSegment.type === 'Loop' || currentSegment.type === 'Loop Preview', 'Time 5.0 should resolve to Loop region segment');

    // Default loop provider has loopStart = 0, loopEnd = 10
    // So time 1.0 is in Loop, and time 13.0 is in Outro (since project duration is 15.0)
    const earlySegment = fastContext.getCurrentSegment(1.0);
    assert.strictEqual(earlySegment.type, 'Loop', 'Time 1.0 should resolve to Loop segment (default start is 0)');

    const outroSegment = fastContext.getCurrentSegment(13.0);
    assert.strictEqual(outroSegment.type, 'Outro', 'Time 13.0 should resolve to Outro segment');
    console.log('✓ RenderingContext correctly routes temporal segment queries\n');

    // Test 4: Normal Workspace Isolation
    console.log('Test 4: Normal Workspace Isolation');
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.NORMAL, mockProjectState);
    const normalContext = fastWorkspaceManager.getRenderingContext(mockProjectState, 5.0);
    assert.strictEqual(normalContext.getCompositionGraph(), null, 'Normal Workspace context should NOT have a CompositionGraph');
    console.log('✓ Normal Workspace remains functionally isolated\n');

    console.log('All tests passed successfully! 🚀');
}

runTests();
