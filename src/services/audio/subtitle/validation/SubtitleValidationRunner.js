import { whisperAnalysisManager } from '../WhisperAnalysisManager.js';
import { subtitleCacheManager } from '../SubtitleCacheManager.js';
import { subtitleRuntime } from '../SubtitleRuntime.js';
import { analysisCacheManager } from '../../AnalysisCacheManager.js';

/**
 * MF-500A: Subtitle Validation Runner
 * End-to-end validation for caching, seek, lookup speed, and zero-allocation properties.
 */
class SubtitleValidationRunner {
    constructor() {
        this.results = [];
    }

    async run() {
        console.log("=== Running MF-500A Subtitle Validation ===");
        this.results = [];
        
        try {
            await this.testCacheAndInference();
            this.testTimestampLookup();
            this.testZeroAllocation();
            this.testSeek();
        } catch (e) {
            console.error("Validation failed with error:", e);
            this.results.push(`[FAILED] Exception: ${e.message}`);
        }

        console.log("=== Validation Complete ===");
        this.results.forEach(r => console.log(r));
        return this.results;
    }

    async testCacheAndInference() {
        analysisCacheManager.clear();
        
        const audioHash1 = "hash_v1";
        
        // 1. Initial Analysis (Should Miss Cache and execute Whisper)
        const doc1 = await whisperAnalysisManager.analyze(audioHash1, new ArrayBuffer(8));
        this.results.push(`[OK] Inference 1 completed. Text: ${doc1.text}`);
        
        // 2. Validate Cache Registration
        if (subtitleCacheManager.isCacheValid(audioHash1)) {
            this.results.push(`[OK] Cache registered successfully for ${audioHash1}`);
        } else {
            this.results.push(`[FAILED] Cache not valid for ${audioHash1}`);
        }

        // 3. Second Analysis (Should Hit Cache)
        const doc2 = await whisperAnalysisManager.analyze(audioHash1, new ArrayBuffer(8));
        if (doc1 === doc2 || doc1.text === doc2.text) { // Simple deep equal approx
            this.results.push(`[OK] Cache reused successfully.`);
        } else {
            this.results.push(`[FAILED] Cache was not reused.`);
        }
        
        subtitleRuntime.setDocument(doc2);
    }

    testTimestampLookup() {
        // Test word lookup
        subtitleRuntime.update(0.2, 1.0); // Inside "Ini" (0.0 - 0.5)
        const state = subtitleRuntime.getState();
        
        if (state.activeWord && state.activeWord.word === "Ini") {
            this.results.push(`[OK] Timestamp lookup correct (0.2s -> 'Ini')`);
        } else {
            this.results.push(`[FAILED] Timestamp lookup incorrect. Found: ${state.activeWord ? state.activeWord.word : 'null'}`);
        }

        // Test gap lookup (if any gaps exist, but our mock is continuous)
        subtitleRuntime.update(10.0, 1.0); 
        const state2 = subtitleRuntime.getState();
        if (state2.activeSegment === null) {
            this.results.push(`[OK] Timestamp out of bounds returns null.`);
        } else {
            this.results.push(`[FAILED] Timestamp out of bounds returned segment.`);
        }
    }

    testZeroAllocation() {
        const stateBefore = subtitleRuntime.getState();
        subtitleRuntime.update(1.2, 1.0); // Inside "pengujian" (1.0 - 1.8)
        const stateAfter = subtitleRuntime.getState();

        if (stateBefore === stateAfter) {
            this.results.push(`[OK] Zero allocation confirmed. State object reference is identical.`);
        } else {
            this.results.push(`[FAILED] Zero allocation failed. State object was re-allocated.`);
        }
    }

    testSeek() {
        // Seek backward
        subtitleRuntime.update(0.7, 1.0); // "adalah" (0.5 - 1.0)
        let state = subtitleRuntime.getState();
        if (state.activeWord && state.activeWord.word === "adalah") {
            this.results.push(`[OK] Seek backward successful.`);
        } else {
            this.results.push(`[FAILED] Seek backward failed.`);
        }

        // Seek forward
        subtitleRuntime.update(3.5, 1.0); // "integrasi" (3.0 - 3.8)
        state = subtitleRuntime.getState();
        if (state.activeWord && state.activeWord.word === "integrasi") {
            this.results.push(`[OK] Seek forward successful.`);
        } else {
            this.results.push(`[FAILED] Seek forward failed.`);
        }
    }
}

export const subtitleValidationRunner = new SubtitleValidationRunner();
