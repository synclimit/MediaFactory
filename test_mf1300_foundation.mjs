/**
 * test_mf1300_foundation.mjs
 * Automated Unit & Integration Test Suite for MF-1300 Foundation Sprint
 */

import { capabilityRegistry, FAST_RENDER_CATEGORIES } from './src/services/pipeline/fastrender/registry/CapabilityRegistry.js';
import { fastRenderState, RENDER_MODES } from './src/services/pipeline/fastrender/core/FastRenderState.js';
import { modeSwitchAdapter } from './src/services/pipeline/fastrender/core/ModeSwitchAdapter.js';

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
console.log('  MF-1300 FOUNDATION SPRINT — UNIT & INTEGRATION TESTS  ');
console.log('========================================================\n');

// --- 1. CapabilityRegistry Unit Tests ---
console.log('--- 1. Testing CapabilityRegistry ---');

assert(capabilityRegistry.isNative('bg_image') === true, 'bg_image classified as Category A (Native)');
assert(capabilityRegistry.isNative('fx_color_grade') === true, 'fx_color_grade classified as Category A (Native)');

assert(capabilityRegistry.isCompatible('bg_video') === true, 'bg_video classified as Category B (Compatible)');
assert(capabilityRegistry.isCompatible('vis_bars') === true, 'vis_bars classified as Category B (Compatible)');
assert(capabilityRegistry.isCompatible('cam_shake') === true, 'cam_shake classified as Category B (Compatible)');

assert(capabilityRegistry.isUnsafe('vis_3d_webgl') === true, 'vis_3d_webgl classified as Category C (Unsafe)');
assert(capabilityRegistry.isSupported('vis_3d_webgl') === true, 'Category C features remain supported with review');

assert(capabilityRegistry.isSupported('fx_strobe_flash') === false, 'fx_strobe_flash is Category D (Unsupported)');
assert(capabilityRegistry.isSupported('fx_block_glitch') === false, 'fx_block_glitch is Category D (Unsupported)');

const strobeRule = capabilityRegistry.getInspectorRule('strobe-flash');
assert(strobeRule.supported === false, 'strobe-flash inspector rule marked unsupported');
const shakeRule = capabilityRegistry.getInspectorRule('camera-shake');
assert(shakeRule.adapted === true, 'camera-shake inspector rule marked adapted');

console.log('');

// --- 2. FastRenderState Unit Tests ---
console.log('--- 2. Testing FastRenderState ---');

assert(fastRenderState.getMode() === RENDER_MODES.NORMAL, 'Initial default mode is NORMAL');
assert(fastRenderState.isFastMode() === false, 'isFastMode() returns false initially');

let notificationReceived = false;
let eventReceived = null;

const unsubscribe = fastRenderState.subscribe((event) => {
    notificationReceived = true;
    eventReceived = event;
});

fastRenderState.setMode(RENDER_MODES.FAST);
assert(fastRenderState.getMode() === RENDER_MODES.FAST, 'Mode successfully updated to FAST');
assert(fastRenderState.isFastMode() === true, 'isFastMode() returns true in FAST mode');
assert(notificationReceived === true, 'Reactive listener notified on mode change');
assert(eventReceived.type === 'MODE_CHANGE' && eventReceived.mode === RENDER_MODES.FAST, 'Event payload contains correct mode data');

unsubscribe();

fastRenderState.setMode(RENDER_MODES.NORMAL);
assert(fastRenderState.getMode() === RENDER_MODES.NORMAL, 'Mode reset back to NORMAL');

console.log('');

// --- 3. ModeSwitchAdapter Integration Tests ---
console.log('--- 3. Testing ModeSwitchAdapter & Non-Destructive Switching ---');

const mockProjectState = {
    m3BgPool: [
        { id: 'bg1', type: 'background', mediaType: 'image', source: 'test.jpg' }
    ],
    m3AudioTracks: [
        { id: 'audio1', title: 'Test Track', duration: 180 }
    ],
    m3Objects: [
        { id: 'text1', type: 'text', name: 'My Subtitle', color: '#ffffff', fontSize: 36 },
        { id: 'shake1', type: 'effect', presetId: 'camera-shake', props: { strength: 25, mode: 'Handheld' } },
        { id: 'strobe1', type: 'effect', presetId: 'strobe-flash', enabled: true, props: { brightness: 50 } }
    ],
    m3RenderSettings: { resolution: '1080p', fps: '60' }
};

// Create initial snapshot
const snapshotId = modeSwitchAdapter.createSnapshot(mockProjectState);
assert(typeof snapshotId === 'string' && snapshotId.startsWith('snap_'), 'Snapshot created successfully');

// Convert project to FAST mode
const fastProjectState = modeSwitchAdapter.convertProjectState(mockProjectState, RENDER_MODES.FAST);

assert(fastProjectState.m3Objects[0].name === 'My Subtitle', 'Category A text object properties untouched in FAST mode');
assert(fastProjectState.m3Objects[1].props.mode === 'Seeded Periodic Shake (Fast Mode)', 'Category B camera shake adapted for FAST mode');
assert(fastProjectState.m3Objects[2].enabled === false, 'Category D strobe flash disabled in FAST mode');
assert(fastProjectState.m3Objects[2].fastModeSuspended === true, 'Category D strobe flash marked fastModeSuspended');

// Convert project BACK to NORMAL mode
const restoredProjectState = modeSwitchAdapter.convertProjectState(fastProjectState, RENDER_MODES.NORMAL);

assert(restoredProjectState.m3Objects[0].name === 'My Subtitle', 'Text object untouched upon return to NORMAL mode');
assert(restoredProjectState.m3Objects[1].props.mode === 'Handheld', 'Camera shake original properties 100% restored');
assert(restoredProjectState.m3Objects[2].enabled === true, 'Strobe flash original enabled status 100% restored');
assert(restoredProjectState.m3Objects[2].fastModeSuspended === undefined, 'fastModeSuspended flag removed upon return to NORMAL mode');

// Verify JSON snapshot equivalence
const originalStr = JSON.stringify(mockProjectState.m3Objects);
const restoredStr = JSON.stringify(restoredProjectState.m3Objects);
assert(originalStr === restoredStr, 'NORMAL -> FAST -> NORMAL cycle produces 100% identical project state');

console.log('\n========================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (0 REGRESSIONS)`);
console.log('========================================================\n');
