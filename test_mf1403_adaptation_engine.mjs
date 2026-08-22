/**
 * test_mf1403_adaptation_engine.mjs
 * Automated Unit Test Suite for MF-1403 Procedural Adaptation Framework.
 */

import { 
    AdaptationContext, 
    AdaptationResult, 
    ProceduralAdapter, 
    StrategyRegistry, 
    strategyRegistry, 
    AdaptationDispatcher, 
    adaptationDispatcher,
    PassThroughStrategy,
    SeededNoiseStrategy,
    PeriodicNoiseStrategy,
    FFTCacheStrategy,
    ParticleCacheStrategy,
    PeriodicEnvelopeStrategy
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
console.log('  MF-1403 ADAPTATION ENGINE — UNIT TEST SUITE          ');
console.log('========================================================\n');

async function runAdaptationEngineUnitSuite() {
    // --- 1. AdaptationContext & Normalized Loop Domain ---
    console.log('--- 1. Testing AdaptationContext & Normalized Domain [0.0, 1.0) ---');
    
    // Case A: 5.0s on 10.0s loop -> normalizedLoopTime 0.5
    const ctx1 = new AdaptationContext({ timeSec: 5.0, masterLoopDuration: 10.0, fps: 60 });
    assert(ctx1.normalizedLoopTime === 0.5, '5.0s / 10.0s loop maps to normalizedLoopTime 0.5');
    assert(ctx1.frameIndex === 300, '5.0s at 60 FPS maps to frameIndex 300');

    // Case B: Multi-period wrapping (25.0s on 10.0s loop) -> normalizedLoopTime 0.5
    const ctx2 = new AdaptationContext({ timeSec: 25.0, masterLoopDuration: 10.0, fps: 30 });
    assert(ctx2.normalizedLoopTime === 0.5, '25.0s elapsed wraps to normalizedLoopTime 0.5');
    assert(ctx2.frameIndex === 750, '25.0s at 30 FPS maps to frameIndex 750');

    console.log('');

    // --- 2. StrategyRegistry Dynamic Lookup & Registration ---
    console.log('--- 2. Testing StrategyRegistry Dynamic Lookup & Registration ---');
    assert(strategyRegistry.hasStrategy('SeededNoise') === true, 'SeededNoise strategy registered');
    assert(strategyRegistry.hasStrategy('PeriodicNoise') === true, 'PeriodicNoise strategy registered');
    assert(strategyRegistry.hasStrategy('FFTCache') === true, 'FFTCache strategy registered');
    assert(strategyRegistry.hasStrategy('ParticleCache') === true, 'ParticleCache strategy registered');
    assert(strategyRegistry.hasStrategy('PeriodicEnvelope') === true, 'PeriodicEnvelope strategy registered');

    // Dynamic registration test
    class CustomAiStrategy extends ProceduralAdapter {
        constructor() { super('CustomAi'); }
        adapt(ctx) {
            return new AdaptationResult({ adaptedObject: ctx.object, strategyUsed: this.name, isAdapted: true });
        }
    }
    const customReg = new StrategyRegistry();
    customReg.register('CustomAi', new CustomAiStrategy());
    assert(customReg.hasStrategy('CustomAi') === true, 'CustomAi strategy registered dynamically');
    assert(customReg.getStrategy('CustomAi') instanceof CustomAiStrategy, 'getStrategy retrieves CustomAi instance');

    console.log('');

    // --- 3. Reference Implementation 1: Camera Shake → SeededNoise ---
    console.log('--- 3. Testing Reference Implementation 1: Camera Shake (SeededNoise) ---');
    const shakeObj = { id: 'fx1', type: 'effect', presetId: 'camera-shake', props: { strength: 30 } };
    const shakeRes = adaptationDispatcher.dispatch(shakeObj, 2.5, 10.0, 1337);

    assert(shakeRes.isAdapted === true, 'Camera Shake marked adapted');
    assert(shakeRes.strategyUsed === 'SeededNoise', 'Strategy used is SeededNoise');
    assert(typeof shakeRes.adaptedObject.props.shakeX === 'number', 'adaptedObject contains computed shakeX');
    assert(typeof shakeRes.adaptedObject.props.shakeY === 'number', 'adaptedObject contains computed shakeY');
    assert(shakeRes.validationHints.continuityOk === true, 'validationHints continuityOk is true');
    assert(shakeRes.validationHints.loopContinuity === 'Good', 'validationHints loopContinuity is Good');

    // Deterministic repeatability test
    const shakeResRepeat = adaptationDispatcher.dispatch(shakeObj, 2.5, 10.0, 1337);
    assert(shakeRes.adaptedObject.props.shakeX === shakeResRepeat.adaptedObject.props.shakeX, 'Camera Shake output is 100% deterministic');

    console.log('');

    // --- 4. Reference Implementation 2: Zoom Pulse → PeriodicNoise ---
    console.log('--- 4. Testing Reference Implementation 2: Zoom Pulse (PeriodicNoise) ---');
    const zoomObj = { id: 'fx2', type: 'effect', presetId: 'zoom-hentak', props: { depth: 50, speed: 1.0 } };
    const zoomRes = adaptationDispatcher.dispatch(zoomObj, 5.0, 10.0);

    assert(zoomRes.isAdapted === true, 'Zoom Pulse marked adapted');
    assert(zoomRes.strategyUsed === 'PeriodicNoise', 'Strategy used is PeriodicNoise');
    assert(typeof zoomRes.adaptedObject.props.pulseScale === 'number', 'adaptedObject contains computed pulseScale');
    assert(zoomRes.validationHints.recommendedCheck === 'PulseCosineContinuity', 'validationHints specifies recommendedCheck');

    console.log('');

    // --- 5. PassThrough & Strategy Interface Contracts ---
    console.log('--- 5. Testing PassThrough & Interface Contracts ---');
    const textObj = { id: 't1', type: 'text', name: 'Header' };
    const textRes = adaptationDispatcher.dispatch(textObj, 5.0);

    assert(textRes.isAdapted === false, 'Text object isNotAdapted (PassThrough)');
    assert(textRes.strategyUsed === 'PassThrough', 'Strategy used is PassThrough');
    assert(textRes.adaptedObject === textObj, 'Original text object reference returned untouched');

    console.log('\n========================================================');
    console.log(`  ALL ${passedTests}/${totalTests} ADAPTATION ENGINE UNIT TESTS PASSED!`);
    console.log('========================================================\n');
}

runAdaptationEngineUnitSuite().catch(err => {
    console.error('Adaptation engine unit suite failure:', err);
    process.exit(1);
});
