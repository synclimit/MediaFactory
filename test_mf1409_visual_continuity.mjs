/**
 * test_mf1409_visual_continuity.mjs
 * End-to-End Visual Continuity Certification Test Suite (MF-1409).
 * Verifies Frame @ t = 0 matches Frame @ t = loopEnd within tolerance across all supported strategies and scene types.
 */

import assert from 'assert';
import { 
    certifyProject, 
    visualContinuityCertification 
} from './tests/certification/VisualContinuityCertification.js';
import { goldenFrameSuite } from './tests/certification/GoldenFrameSuite.js';
import { FrameComparator } from './tests/certification/FrameComparator.js';
import { fastWorkspaceManager } from './src/services/pipeline/fastrender/workspace/index.js';
import { RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';

function runVisualContinuityCertificationSuite() {
    console.log('========================================================');
    console.log('  MF-1409 — END-TO-END VISUAL CONTINUITY CERTIFICATION  ');
    console.log('========================================================\n');

    const MASTER_LOOP_DURATION = 10.0;
    const TOLERANCE = 1e-4;

    // --- 1. FrameComparator Generic Unit Test ---
    console.log('--- 1. Testing FrameComparator Utility (Renderer Agnostic) ---');
    const bufA = { width: 2, height: 2, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]) };
    const bufB = { width: 2, height: 2, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]) };
    const compBuffers = FrameComparator.compareFrame(bufA, bufB);
    assert.strictEqual(compBuffers.identical, true);
    assert.strictEqual(compBuffers.maxDifference, 0);
    assert.strictEqual(compBuffers.comparedPixels, 4);

    const structA = { id: 'obj1', props: { scale: 1.05, opacity: 1.0, position: { x: 10, y: 20 } } };
    const structB = { id: 'obj1', props: { scale: 1.050000001, opacity: 1.0, position: { x: 10, y: 20 } } };
    const compStruct = FrameComparator.compareFrame(structA, structB, { tolerance: TOLERANCE });
    assert.strictEqual(compStruct.identical, true);
    assert.ok(compStruct.maxDifference <= TOLERANCE);
    console.log('✓ FrameComparator: Generic buffer and structure comparison verified\n');

    // --- 2. GoldenFrameSuite Production Test ---
    console.log('--- 2. Testing GoldenFrameSuite Production ---');
    const mockProj = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [
            { id: 'bg1', type: 'background' },
            { id: 'shake1', type: 'camera-shake' }
        ]
    };
    fastWorkspaceManager.switchWorkspace(RENDER_MODES.FAST, mockProj);
    const mockCtx = fastWorkspaceManager.getRenderingContext(mockProj, 0.0);

    const gfEval = goldenFrameSuite.evaluateLoopContinuity(mockCtx, mockProj.m3Objects, MASTER_LOOP_DURATION, { tolerance: TOLERANCE });
    assert.ok(gfEval.goldenFrame.length > 0);
    assert.ok(gfEval.loopEndFrame.length > 0);
    assert.strictEqual(gfEval.comparison.identical, true);
    console.log('✓ GoldenFrameSuite: Golden Frame (t=0) and Loop End Frame (t=10.0s) produced and matched\n');

    // --- 3. Certifying Procedural Strategies ---
    console.log('--- 3. Certifying Individual Procedural Strategies ---');

    // Case 3.1: PeriodicNoise (Zoom Hentak)
    console.log('✓ Certifying PeriodicNoise Strategy...');
    const projPeriodic = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [{ id: 'zoom1', type: 'zoom-hentak', enabled: true }]
    };
    const resPeriodic = certifyProject(projPeriodic, { tolerance: TOLERANCE });
    assert.strictEqual(resPeriodic.passed, true, 'PeriodicNoise must pass certification');
    assert.strictEqual(resPeriodic.failedObjects.length, 0);
    assert.ok(resPeriodic.maxDifference <= TOLERANCE);
    console.log('  -> PeriodicNoise (Zoom Hentak & Wave Pulse): t=0 vs t=10.0s 100% visually continuous');

    // Case 3.2: SeededNoise (Camera Shake & Drift)
    console.log('✓ Certifying SeededNoise Strategy...');
    const projSeeded = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [{ id: 'shake1', type: 'camera-shake', enabled: true, props: { strength: 25 } }]
    };
    const resSeeded = certifyProject(projSeeded, { tolerance: TOLERANCE });
    assert.strictEqual(resSeeded.passed, true, 'SeededNoise must pass certification');
    assert.strictEqual(resSeeded.failedObjects.length, 0);
    assert.ok(resSeeded.maxDifference <= TOLERANCE);
    console.log('  -> SeededNoise (Camera Shake): t=0 vs t=10.0s 100% visually continuous');

    // Case 3.3: FFTCache (Visualizer Spectrum)
    console.log('✓ Certifying FFTCache Strategy...');
    const projFFT = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [{ id: 'vis1', type: 'vis_bars', enabled: true }]
    };
    const resFFT = certifyProject(projFFT, { tolerance: TOLERANCE });
    assert.strictEqual(resFFT.passed, true, 'FFTCache must pass certification');
    assert.strictEqual(resFFT.failedObjects.length, 0);
    console.log('  -> FFTCache (Visualizer Spectrum): t=0 vs t=10.0s 100% visually continuous');

    // Case 3.4: Camera Shake Object
    console.log('✓ Certifying Camera Shake Feature Object...');
    const projCamShake = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [{ id: 'cam_shake_1', type: 'cam_shake', enabled: true }]
    };
    const resCamShake = certifyProject(projCamShake, { tolerance: TOLERANCE });
    assert.strictEqual(resCamShake.passed, true);
    console.log('  -> Camera Shake Object: 100% certified');

    // Case 3.5: Visualizer Object
    console.log('✓ Certifying Visualizer Feature Object...');
    const projVis = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [{ id: 'vis_spectrum_1', type: 'vis_spectrum', enabled: true }]
    };
    const resVis = certifyProject(projVis, { tolerance: TOLERANCE });
    assert.strictEqual(resVis.passed, true);
    console.log('  -> Visualizer Object: 100% certified');

    // Case 3.6: Particle Object
    console.log('✓ Certifying Particle Feature Object...');
    const projParticle = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [{ id: 'part1', type: 'particle', enabled: true }]
    };
    const resParticle = certifyProject(projParticle, { tolerance: TOLERANCE });
    assert.strictEqual(resParticle.passed, true);
    console.log('  -> Particle Object: 100% certified\n');

    // --- 4. Certifying Complex Scenes ---
    console.log('--- 4. Certifying Complex & Mixed Scenes ---');

    // Case 4.1: Mixed Scene
    console.log('✓ Certifying Mixed Scene...');
    const projMixed = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [
            { id: 'bg1', type: 'background', enabled: true },
            { id: 'title1', type: 'title', enabled: true, text: 'MY LOOPS' },
            { id: 'shake1', type: 'camera-shake', enabled: true },
            { id: 'zoom1', type: 'zoom-hentak', enabled: true },
            { id: 'vis1', type: 'vis_bars', enabled: true },
            { id: 'part1', type: 'particle', enabled: true }
        ]
    };
    const resMixed = certifyProject(projMixed, { tolerance: TOLERANCE });
    assert.strictEqual(resMixed.passed, true, 'Mixed scene must pass certification');
    assert.strictEqual(resMixed.failedObjects.length, 0);
    assert.ok(resMixed.maxDifference <= TOLERANCE);
    console.log('  -> Mixed Scene (BG + Title + Shake + Zoom + Vis + Particle): 100% visually continuous');

    // Case 4.2: Complete Project
    console.log('✓ Certifying Complete Project Scene...');
    const projComplete = {
        duration: MASTER_LOOP_DURATION,
        m3Objects: [
            { id: 'bg1', type: 'background', enabled: true },
            { id: 'txt1', type: 'text', enabled: true, text: 'Seamless Loop' },
            { id: 'img1', type: 'image', enabled: true },
            { id: 'shake1', type: 'camera-shake', enabled: true },
            { id: 'zoom1', type: 'zoom-hentak', enabled: true },
            { id: 'vis1', type: 'vis_bars', enabled: true },
            { id: 'vis2', type: 'vis_spectrum', enabled: true },
            { id: 'part1', type: 'particle', enabled: true },
            { id: 'fx1', type: 'disco-light', enabled: true }
        ]
    };
    const resComplete = certifyProject(projComplete, { tolerance: TOLERANCE });
    assert.strictEqual(resComplete.passed, true, 'Complete Project must pass certification');
    assert.strictEqual(resComplete.failedObjects.length, 0);
    assert.ok(resComplete.maxDifference <= TOLERANCE);
    console.log('  -> Complete Project Scene (9 multi-track objects): 100% visually continuous\n');

    console.log('========================================================');
    console.log('  MF-1409 VISUAL CONTINUITY CERTIFIED 100%! 🚀          ');
    console.log('========================================================\n');
}

runVisualContinuityCertificationSuite();
