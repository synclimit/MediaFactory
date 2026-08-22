/**
 * test_mf1402_loop_classification.mjs
 * Automated Unit Test Suite for MF-1402 Loop Classification Engine.
 * Tests LoopCapabilityRegistry, rich metadata schema, data-driven feature classifications, and extensibility.
 */

import { LoopCapabilityRegistry, loopCapabilityRegistry, LOOP_CLASSIFICATIONS } from './src/services/pipeline/fastrender/workspace/index.js';

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
console.log('  MF-1402 LOOP CLASSIFICATION — UNIT TEST SUITE        ');
console.log('========================================================\n');

async function runClassificationUnitSuite() {
    // --- 1. LoopNative Feature Classifications & Metadata ---
    console.log('--- 1. Testing LoopNative Feature Classifications ---');
    const textMeta = loopCapabilityRegistry.getClassification('text');
    assert(textMeta.classification === LOOP_CLASSIFICATIONS.LOOP_NATIVE, 'Text layer classified as LoopNative');
    assert(textMeta.supportsLoop === true, 'Text layer supportsLoop is true');
    assert(textMeta.requiresAdaptation === false, 'Text layer requiresAdaptation is false');
    assert(textMeta.timelineOnly === false, 'Text layer timelineOnly is false');
    assert(textMeta.adaptationStrategy === 'PassThrough', 'Text layer adaptationStrategy is PassThrough');
    assert(textMeta.loopContinuity === 'Perfect', 'Text layer loopContinuity is Perfect');
    assert(textMeta.validationRequired === false, 'Text layer validationRequired is false');

    const imageMeta = loopCapabilityRegistry.getClassification('image');
    assert(imageMeta.classification === LOOP_CLASSIFICATIONS.LOOP_NATIVE, 'Image classified as LoopNative');

    console.log('');

    // --- 2. LoopAdapted Feature Classifications & Metadata ---
    console.log('--- 2. Testing LoopAdapted Feature Rich Metadata ---');
    
    // Camera Shake
    const shakeMeta = loopCapabilityRegistry.getClassification('camera-shake');
    assert(shakeMeta.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'camera-shake classified as LoopAdapted');
    assert(shakeMeta.requiresAdaptation === true, 'camera-shake requiresAdaptation is true');
    assert(shakeMeta.adaptationStrategy === 'SeededNoise', 'camera-shake strategy is SeededNoise');
    assert(shakeMeta.loopContinuity === 'Good', 'camera-shake continuity is Good');
    assert(shakeMeta.validationRequired === true, 'camera-shake validationRequired is true');

    // Zoom Pulse
    const zoomMeta = loopCapabilityRegistry.getClassification('zoom-hentak');
    assert(zoomMeta.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'zoom-hentak classified as LoopAdapted');
    assert(zoomMeta.adaptationStrategy === 'PeriodicNoise', 'zoom-hentak strategy is PeriodicNoise');
    assert(zoomMeta.loopContinuity === 'Good', 'zoom-hentak continuity is Good');

    // Visualizer
    const visMeta = loopCapabilityRegistry.getClassification('vis_bars');
    assert(visMeta.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'vis_bars classified as LoopAdapted');
    assert(visMeta.adaptationStrategy === 'FFTCache', 'vis_bars strategy is FFTCache');

    // Particles
    const particleMeta = loopCapabilityRegistry.getClassification('particle');
    assert(particleMeta.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'particle classified as LoopAdapted');
    assert(particleMeta.adaptationStrategy === 'ParticleCache', 'particle strategy is ParticleCache');
    assert(particleMeta.loopContinuity === 'Risky', 'particle continuity is Risky');

    console.log('');

    // --- 3. TimelineOnly & Unsupported Feature Classifications ---
    console.log('--- 3. Testing TimelineOnly & Unsupported Feature Metadata ---');

    // Subtitle
    const subMeta = loopCapabilityRegistry.getClassification('subtitle');
    assert(subMeta.classification === LOOP_CLASSIFICATIONS.TIMELINE_ONLY, 'subtitle classified as TimelineOnly');
    assert(subMeta.timelineOnly === true, 'subtitle timelineOnly is true');
    assert(subMeta.supportsLoop === false, 'subtitle supportsLoop is false');
    assert(subMeta.unsupportedReason !== null, 'subtitle contains descriptive reason');

    // Strobe Flash
    const strobeMeta = loopCapabilityRegistry.getClassification('strobe-flash');
    assert(strobeMeta.classification === LOOP_CLASSIFICATIONS.UNSUPPORTED, 'strobe-flash classified as Unsupported');
    assert(strobeMeta.supportsLoop === false, 'strobe-flash supportsLoop is false');
    assert(strobeMeta.loopContinuity === 'Discontinuous', 'strobe-flash continuity is Discontinuous');
    assert(strobeMeta.unsupportedReason.includes('Strobe'), 'strobe-flash reason describes high frequency strobe');

    // Block Glitch
    const glitchMeta = loopCapabilityRegistry.getClassification('block-glitch');
    assert(glitchMeta.classification === LOOP_CLASSIFICATIONS.UNSUPPORTED, 'block-glitch classified as Unsupported');

    console.log('');

    // --- 4. Custom Extensibility & Fallbacks ---
    console.log('--- 4. Testing Custom Registration & Default Fallbacks ---');
    
    // Custom registration
    const customReg = new LoopCapabilityRegistry();
    customReg.registerClassification('custom-ai-fx', {
        classification: LOOP_CLASSIFICATIONS.LOOP_ADAPTED,
        supportsLoop: true,
        requiresAdaptation: true,
        adaptationStrategy: 'AICache',
        loopContinuity: 'Good',
        validationRequired: true
    });
    const customMeta = customReg.getClassification('custom-ai-fx');
    assert(customMeta.classification === LOOP_CLASSIFICATIONS.LOOP_ADAPTED, 'custom-ai-fx registered successfully');
    assert(customMeta.adaptationStrategy === 'AICache', 'custom-ai-fx strategy is AICache');

    // Fallback for unknown symbol
    const unknownMeta = loopCapabilityRegistry.getClassification('unknown-custom-widget-123');
    assert(unknownMeta.classification === LOOP_CLASSIFICATIONS.LOOP_NATIVE, 'Unknown widget falls back to LoopNative default');
    assert(unknownMeta.adaptationStrategy === 'PassThrough', 'Unknown widget fallback strategy is PassThrough');

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} CLASSIFICATION UNIT TESTS PASSED!`);
    console.log('========================================================\n');
}

runClassificationUnitSuite().catch(err => {
    console.error('Classification unit suite failure:', err);
    process.exit(1);
});
