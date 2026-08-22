/**
 * test_mf1401_loop_controller.mjs
 * Automated Unit Test Suite for MF-1401 Loop Preview Controller.
 * Tests configurable master duration, configurable window range, time mapping math, and boundary step debugger mode.
 */

import { LoopPreviewController, loopPreviewController } from './src/services/pipeline/fastrender/workspace/index.js';

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
console.log('  MF-1401 LOOP PREVIEW CONTROLLER — UNIT TEST SUITE    ');
console.log('========================================================\n');

async function runControllerSuite() {
    // --- 1. Master Loop Duration Configuration ---
    console.log('--- 1. Testing Configurable Master Loop Duration ---');
    const controller = new LoopPreviewController({ masterLoopDuration: 10.0 });
    assert(controller.getMasterLoopDuration() === 10.0, 'Default master loop duration is 10.0s');

    controller.setMasterLoopDuration(15.0);
    assert(controller.getMasterLoopDuration() === 15.0, 'Master loop duration updated dynamically to 15.0s');

    controller.setMasterLoopDuration(8.5);
    assert(controller.getMasterLoopDuration() === 8.5, 'Master loop duration updated dynamically to 8.5s');

    controller.setMasterLoopDuration(10.0); // Reset for next tests

    console.log('');

    // --- 2. Configurable Preview Window ---
    console.log('--- 2. Testing Configurable Preview Window (previewBeforeBoundary & previewAfterBoundary) ---');
    assert(controller.getPreviewWindow().previewBeforeBoundary === 2.0, 'Default previewBeforeBoundary is 2.0s');
    assert(controller.getPreviewWindow().previewAfterBoundary === 2.0, 'Default previewAfterBoundary is 2.0s');
    assert(controller.getPreviewWindow().totalWindowDuration === 4.0, 'Default total window duration is 4.0s');

    // Test 3s + 3s configuration
    controller.setPreviewWindow(3.0, 3.0);
    assert(controller.getPreviewWindow().previewBeforeBoundary === 3.0, 'previewBeforeBoundary updated to 3.0s');
    assert(controller.getPreviewWindow().previewAfterBoundary === 3.0, 'previewAfterBoundary updated to 3.0s');
    assert(controller.getPreviewWindow().totalWindowDuration === 6.0, 'Total window duration updated to 6.0s');

    // Test 5s + 2s asymmetric configuration
    controller.setPreviewWindow(5.0, 2.0);
    assert(controller.getPreviewWindow().previewBeforeBoundary === 5.0, 'Asymmetric previewBeforeBoundary set to 5.0s');
    assert(controller.getPreviewWindow().previewAfterBoundary === 2.0, 'Asymmetric previewAfterBoundary set to 2.0s');

    // Reset window to 2.0s + 2.0s for time mapping tests
    controller.setPreviewWindow(2.0, 2.0);

    console.log('');

    // --- 3. Seamless Loop Boundary Time Mapping Math ---
    console.log('--- 3. Testing Seamless Loop Boundary Time Mapping Math ---');
    controller.setLoopPreviewActive(true);

    // Case A: 0.5s in window (2s before / 2s after on 10s loop) -> Pre-boundary at 8.50s
    const map1 = controller.mapPreviewTime(0.5);
    assert(map1.mappedPlaybackTime === 8.5, '0.5s elapsed in window maps to 8.5s pre-boundary');
    assert(map1.isPreBoundary === true, 'Flagged as isPreBoundary');
    assert(map1.isPostBoundary === false, 'Not flagged as isPostBoundary');
    assert(map1.formattedTime === '08.50', 'Formatted time string is 08.50');

    // Case B: Exactly at boundary transition point (2.0s in window) -> Maps to 0.00s post-boundary start
    const map2 = controller.mapPreviewTime(2.0);
    assert(map2.mappedPlaybackTime === 0.0, '2.0s elapsed in window maps to 0.0s post-boundary start');
    assert(map2.isPostBoundary === true, 'Flagged as isPostBoundary');

    // Case C: 2.5s in window -> Post-boundary at 0.50s
    const map3 = controller.mapPreviewTime(2.5);
    assert(map3.mappedPlaybackTime === 0.5, '2.5s elapsed in window maps to 0.5s post-boundary');
    assert(map3.formattedTime === '00.50', 'Formatted time string is 00.50');

    // Case D: Continuous Window Wrapping (4.5s elapsed -> wraps to 0.5s in window -> 8.50s)
    const map4 = controller.mapPreviewTime(4.5);
    assert(map4.mappedPlaybackTime === 8.5, '4.5s elapsed wraps back to 8.5s in preview loop');

    console.log('');

    // --- 4. Boundary Step Debugger Mode ---
    console.log('--- 4. Testing Boundary Step Debugger Mode (Pause, Step Forward/Backward) ---');
    controller.pauseAtBoundary();
    assert(controller.boundaryStepMode.isStepModeActive === true, 'Boundary step mode activated');
    assert(controller.boundaryStepMode.isPausedAtBoundary === true, 'Paused at boundary');

    const step0 = controller.mapPreviewTime(0);
    assert(step0.isStepMode === true, 'mapPreviewTime identifies step mode');

    // Step forward 5 frames
    controller.stepForward(5);
    const stepFwd = controller.mapPreviewTime(0);
    assert(stepFwd.stepFrameIndex === (120 + 5), 'Stepped forward 5 frames');

    // Step backward 10 frames
    controller.stepBackward(10);
    const stepBwd = controller.mapPreviewTime(0);
    assert(stepBwd.stepFrameIndex === (120 - 5), 'Stepped backward 10 frames');

    // Disable step mode
    controller.toggleBoundaryStepMode(false);
    assert(controller.boundaryStepMode.isStepModeActive === false, 'Boundary step mode deactivated');

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} LOOP CONTROLLER TESTS PASSED!`);
    console.log('========================================================\n');
}

runControllerSuite().catch(err => {
    console.error('Loop controller suite failure:', err);
    process.exit(1);
});
