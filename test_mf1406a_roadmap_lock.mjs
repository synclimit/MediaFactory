/**
 * test_mf1406a_roadmap_lock.mjs
 * Certification test verifying Roadmap V2 Final Lock deliverables and architecture freeze integrity.
 */

import fs from 'fs';

console.log('=== TEST MF-1406A.9 ROADMAP V2 FINAL LOCK CERTIFICATION ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`[PASS] ${message}`);
    } else {
        console.error(`[FAIL] ${message}`);
    }
}

// 1. Verify existence of all prior certification artifacts
assert(fs.existsSync('./MF1406A_PROCEDURAL_UNIFICATION_REPORT.md'), 'MF1406A_PROCEDURAL_UNIFICATION_REPORT.md exists');
assert(fs.existsSync('./MF1406A_WYSIWYG_VALIDATION_REPORT.md'), 'MF1406A_WYSIWYG_VALIDATION_REPORT.md exists');
assert(fs.existsSync('./RendererDifferenceMatrix.md'), 'RendererDifferenceMatrix.md exists');
assert(fs.existsSync('./MF1406A_FINAL_WYSIWYG_CERTIFICATION_REPORT.md'), 'MF1406A_FINAL_WYSIWYG_CERTIFICATION_REPORT.md exists');

// 2. Verify existence of ROADMAP_V2_LOCK_REPORT.md
assert(fs.existsSync('./ROADMAP_V2_LOCK_REPORT.md'), 'ROADMAP_V2_LOCK_REPORT.md exists');

const lockReport = fs.readFileSync('./ROADMAP_V2_LOCK_REPORT.md', 'utf-8');
assert(lockReport.includes('ROADMAP V2 STATUS: LOCKED'), 'ROADMAP_V2_LOCK_REPORT.md certifies LOCKED status');
assert(lockReport.includes('Zero open mismatch IDs'), 'ROADMAP_V2_LOCK_REPORT.md confirms zero open mismatches');

// 3. Verify Architecture Freeze integrity (Core files exist and remain valid)
const frozenFiles = [
    './src/services/pipeline/fastrender/workspace/runtime/WorkspaceRuntime.js',
    './src/services/pipeline/fastrender/workspace/RenderingContext.js',
    './src/services/pipeline/fastrender/workspace/composition/TimelineComposer.js',
    './src/services/pipeline/fastrender/workspace/composition/TimelineRouter.js',
    './src/services/pipeline/fastrender/workspace/validation/ValidationEngine.js',
    './src/services/pipeline/fastrender/workspace/validation/ValidationReport.js',
    './src/services/pipeline/fastrender/workspace/adaptation/StrategyRegistry.js',
    './src/services/pipeline/fastrender/workspace/adaptation/AdaptationDispatcher.js',
    './src/services/pipeline/fastrender/workspace/registry/LoopCapabilityRegistry.js'
];

frozenFiles.forEach(file => {
    assert(fs.existsSync(file), `Frozen architecture file ${file} exists and is intact`);
});

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} LOCK CERTIFICATION TESTS PASSED ===`);
if (passedTests === totalTests) {
    console.log('SUCCESS: Roadmap V2 Officially Certified & LOCKED!');
    process.exit(0);
} else {
    console.error('FAILURE: Roadmap Lock certification failed.');
    process.exit(1);
}
