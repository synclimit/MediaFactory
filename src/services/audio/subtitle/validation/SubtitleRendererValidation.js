import assert from 'assert';
import { subtitleRuntime } from '../SubtitleRuntime.js';
import { SubtitleLayoutEngine } from '../rendering/SubtitleLayoutEngine.js';
import { SubtitleAnimationEngine } from '../rendering/SubtitleAnimationEngine.js';

async function validateRenderer() {
    console.log("--- Starting Subtitle Renderer Validation ---");

    const mockDoc = {
        language: "en",
        segments: [
            {
                start: 1.0,
                end: 3.0,
                text: "Welcome to the real subtitle engine.",
                words: [
                    { word: "Welcome", start: 1.0, end: 1.5, probability: 0.99 },
                    { word: "to", start: 1.5, end: 1.7, probability: 0.95 },
                    { word: "the", start: 1.7, end: 1.9, probability: 0.98 },
                    { word: "real", start: 1.9, end: 2.2, probability: 0.99 },
                    { word: "subtitle", start: 2.2, end: 2.6, probability: 0.99 },
                    { word: "engine.", start: 2.6, end: 3.0, probability: 0.99 }
                ],
                noSpeechProb: 0.01
            }
        ]
    };

    subtitleRuntime.setDocument(mockDoc);

    console.log("[1] Validating Sync & Highlight (Runtime)");
    subtitleRuntime.update(1.8); // Should highlight "the"
    const state = subtitleRuntime.getState();
    assert.strictEqual(state.activeSegment.text, "Welcome to the real subtitle engine.", "Segment text mismatch");
    assert.strictEqual(state.currentWord.word, "the", "Highlight currentWord mismatch");
    assert.strictEqual(state.previousWord.word, "to", "Highlight previousWord mismatch");
    assert.strictEqual(state.nextWord.word, "real", "Highlight nextWord mismatch");
    console.log("✅ Sync & Highlight passed.");

    console.log("[2] Validating Layout & Wrapping");
    const config = {
        align: 'Bottom Center',
        fontSize: 40,
        width: 300 // Constrain width to force wrapping
    };
    // Expected avgCharWidth = 40 * 0.6 = 24px.
    // "Welcome" = 7 * 24 = 168 + 24 = 192px.
    // "to" = 2 * 24 = 48 + 24 = 72. Total = 264px.
    // "the" = 3 * 24 = 72 + 24 = 96px. Total = 360 > 300. -> Wrap!
    SubtitleLayoutEngine.compute(state, config, 1920, 1080);
    
    assert(state.layoutState.lines.length > 1, "Layout should have wrapped into multiple lines");
    assert.strictEqual(state.layoutState.align, 'Bottom Center', "Alignment mismatch");
    assert(state.layoutState.x === 1920 / 2, "X should be centered");
    console.log("✅ Layout & Wrapping passed. Lines:", state.layoutState.lines.length);

    console.log("[3] Validating Animation (Fade + Slide)");
    state.style = 'Slide + Fade';
    // Test Enter phase (1.1s is 0.1s into the 0.2s transition) -> progress 0.5
    SubtitleAnimationEngine.compute(state, 1.1);
    assert.strictEqual(state.animationState.phase, 'enter', "Phase mismatch");
    assert(state.opacity > 0 && state.opacity < 1.0, "Opacity should be transitioning");
    assert(state.offsetY > 0, "Should have positive offsetY (sliding up)");
    
    // Test Active phase (2.0s)
    SubtitleAnimationEngine.compute(state, 2.0);
    assert.strictEqual(state.animationState.phase, 'active', "Phase mismatch");
    assert.strictEqual(state.opacity, 1.0, "Opacity should be 1");
    assert.strictEqual(state.offsetY, 0, "OffsetY should be 0");

    // Test Exit phase (2.9s is 0.1s into the 0.2s exit)
    SubtitleAnimationEngine.compute(state, 2.9);
    assert.strictEqual(state.animationState.phase, 'exit', "Phase mismatch");
    assert(state.opacity > 0 && state.opacity < 1.0, "Opacity should be transitioning");
    assert(state.offsetY < 0, "Should have negative offsetY (sliding up to leave)");
    console.log("✅ Animation (Fade + Slide) passed.");

    console.log("[4] Validating Zero Allocation (Referential Equality)");
    const prevLayoutRef = state.layoutState.lines;
    const prevLayoutLine0 = state.layoutState.lines[0];
    
    // Compute again with same state
    SubtitleLayoutEngine.compute(state, config, 1920, 1080);
    
    assert.strictEqual(state.layoutState.lines, prevLayoutRef, "Layout array reference should not change");
    assert.strictEqual(state.layoutState.lines[0], prevLayoutLine0, "Layout line reference should not change");
    console.log("✅ Zero Allocation checks passed.");

    console.log("--- Validation Complete: ALL PASSED ---");
}

validateRenderer().catch(err => {
    console.error("Validation failed:", err);
    process.exit(1);
});
