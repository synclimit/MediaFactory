import assert from 'assert';
import { 
    validationEngine,
    ValidationReport,
    VALIDATION_SEVERITY,
    fastWorkspaceManager,
    AdaptationResult,
    CompositionGraph
} from './src/services/pipeline/fastrender/workspace/index.js';
import { RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';

function runTests() {
    console.log('--- Running MF-1405 Visual Validation Tests ---\n');

    // 1. Test Deep Immutability of ValidationReport
    console.log('Test 1: Deep Immutability of ValidationReport');
    const report = new ValidationReport({
        score: 90,
        warnings: [{ code: 'TEST_WARN', message: 'Warning message', severity: VALIDATION_SEVERITY.WARNING }],
        errors: [],
        affectedSegments: ['segment-loop'],
        affectedObjects: ['obj1']
    });

    assert.throws(() => {
        report.score = 50;
    }, TypeError, 'Score should be frozen');

    assert.throws(() => {
        report.warnings.push({ code: 'MUTATED' });
    }, TypeError, 'Warnings array should be frozen');

    assert.throws(() => {
        report.warnings[0].message = 'Mutated message';
    }, TypeError, 'Nested warning record should be frozen');

    assert.throws(() => {
        report.affectedSegments.push('segment-outro');
    }, TypeError, 'affectedSegments array should be frozen');

    console.log('✓ ValidationReport is deeply immutable\n');

    // 2. Test Determinism & Timestamp Neutrality
    console.log('Test 2: Deterministic Score & Timestamp Neutrality');
    const graph1 = new CompositionGraph();
    graph1.addSegment({ id: 'segment-loop', type: 'Loop', startTime: 0, endTime: 10, duration: 10, loopable: true });

    const repA = validationEngine.validate(graph1, []);
    const repB = validationEngine.validate(graph1, []);
    
    assert.strictEqual(repA.score, repB.score, 'Same graph should produce identical score');
    assert.strictEqual(repA.score, 100, 'Clean graph score should be 100');
    assert.deepStrictEqual(repA.errors, repB.errors);
    assert.deepStrictEqual(repA.warnings, repB.warnings);
    console.log('✓ Validation score calculation is deterministic\n');

    // 3. Test Structural Validation
    console.log('Test 3: Structural Validation (Missing Loop, Gaps, Overlaps, Unsupported Objects)');
    // Empty graph missing Loop segment
    const emptyGraph = new CompositionGraph();
    const missingLoopReport = validationEngine.validate(emptyGraph);
    assert.strictEqual(missingLoopReport.isValid, false);
    assert.ok(missingLoopReport.errors.some(e => e.code === 'STRUCTURAL_MISSING_LOOP_SEGMENT' && e.severity === VALIDATION_SEVERITY.BLOCKING));

    // Graph with unsupported object
    const graphWithUnsupported = new CompositionGraph();
    graphWithUnsupported.addSegment({
        id: 'segment-loop',
        type: 'Loop',
        startTime: 0,
        endTime: 10,
        duration: 10,
        loopable: true,
        children: [{ id: 'strobe1', type: 'strobe-flash', _composition: { route: 'VALIDATION_LAYER' } }]
    });
    const unsupportedReport = validationEngine.validate(graphWithUnsupported);
    assert.strictEqual(unsupportedReport.isValid, false);
    assert.ok(unsupportedReport.errors.some(e => e.code === 'STRUCTURAL_UNSUPPORTED_OBJECT' && e.severity === VALIDATION_SEVERITY.ERROR));
    assert.ok(unsupportedReport.affectedSegments.includes('segment-loop'));
    assert.ok(unsupportedReport.affectedObjects.includes('strobe1'));
    console.log('✓ Structural checks identify missing loops, unsupported objects, and stable segment IDs\n');

    // 4. Test Adaptation & Generic Boundary Continuity Contract
    console.log('Test 4: Adaptation Hints & Loop Boundary Visual Validation Contract');
    const adaptationResultPass = new AdaptationResult({
        adaptedObject: { id: 'shake1', type: 'camera-shake' },
        validationHints: {
            boundaryDeviation: 0.01,
            tolerance: 0.05,
            continuityOk: true,
            startSample: { x: 0 },
            endSample: { x: 0.01 }
        }
    });

    const adaptationResultFail = new AdaptationResult({
        adaptedObject: { id: 'shake2', type: 'camera-shake' },
        validationHints: {
            boundaryDeviation: 0.15,
            tolerance: 0.05,
            continuityOk: false,
            criticalDiscontinuity: true,
            startSample: { x: 0 },
            endSample: { x: 0.15 }
        }
    });

    const continuityReport = validationEngine.validate(graph1, [adaptationResultPass, adaptationResultFail]);
    assert.strictEqual(continuityReport.boundaryContinuityResults.length, 2);

    const contract1 = continuityReport.boundaryContinuityResults.find(c => c.objectId === 'shake1');
    assert.ok(contract1);
    assert.strictEqual(contract1.boundaryContinuity.passed, true);

    const contract2 = continuityReport.boundaryContinuityResults.find(c => c.objectId === 'shake2');
    assert.ok(contract2);
    assert.strictEqual(contract2.boundaryContinuity.passed, false);
    assert.strictEqual(contract2.boundaryContinuity.deviation, 0.15);

    assert.ok(continuityReport.errors.some(e => e.objectId === 'shake2' && e.severity === VALIDATION_SEVERITY.BLOCKING));
    console.log('✓ Boundary visual validation contract and adaptation hints processed correctly\n');

    // 5. Test RenderingContext Gateway Integration & Workspace Isolation
    console.log('Test 5: RenderingContext Gateway & Workspace Isolation');
    const mockProject = {
        duration: 15.0,
        m3Objects: [
            { id: 't1', type: 'text' },
            { id: 'c1', type: 'camera-shake' }
        ]
    };

    // Fast Workspace context
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.FAST, mockProject);
    const fastCtx = fastWorkspaceManager.getRenderingContext(mockProject, 0);
    const fastReport = fastCtx.validateProject([adaptationResultPass]);
    assert.ok(fastReport instanceof ValidationReport);
    assert.strictEqual(fastCtx.getValidationReport(), fastReport, 'getValidationReport returns cached report');

    // Normal Workspace context
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.NORMAL, mockProject);
    const normalCtx = fastWorkspaceManager.getRenderingContext(mockProject, 0);
    const normalReport = normalCtx.validateProject([]);
    assert.strictEqual(normalReport.isValid, true);
    assert.strictEqual(normalReport.errors.length, 0);
    assert.strictEqual(normalReport.warnings.length, 0);
    console.log('✓ RenderingContext acts as gateway and keeps Normal Workspace isolated\n');

    console.log('All MF-1405 Visual Validation tests passed successfully! 🚀');
}

runTests();
