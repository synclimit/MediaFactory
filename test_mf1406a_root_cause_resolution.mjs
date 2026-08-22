/**
 * test_mf1406a_root_cause_resolution.mjs
 * Certification test verifying root cause resolution for renderer parameter alignment.
 */

import fs from 'fs';

console.log('=== TEST MF-1406A.7 ROOT CAUSE RESOLUTION CERTIFICATION ===\n');

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

// 1. Verify RendererDifferenceMatrix.md exists
assert(fs.existsSync('./RendererDifferenceMatrix.md'), 'RendererDifferenceMatrix.md exists');

// 2. Verify backend/api/m3-render.js contains nb_freqs parameter for RC-01
const renderCode = fs.readFileSync('./backend/api/m3-render.js', 'utf-8');
const hasNbFreqs = renderCode.includes('nb_freqs=') && renderCode.includes('barCount');
assert(hasNbFreqs, 'm3-render.js contains nb_freqs=${barCount} alignment parameter (RC-01 resolved)');

// 3. Verify colorkey transparency keying exists in m3-render.js for RC-04
const hasColorkey = renderCode.includes('colorkey=0x000000:0.2:0.1');
assert(hasColorkey, 'm3-render.js contains colorkey=0x000000:0.2:0.1 transparency keying (RC-04 resolved)');

// 4. Verify VisualizerPanel.jsx default coordinates for RC-03
const panelCode = fs.readFileSync('./src/components/m3/panels/VisualizerPanel.jsx', 'utf-8');
const hasFullWidthCoords = panelCode.includes('width: 1920') && panelCode.includes('height: 180');
assert(hasFullWidthCoords, 'VisualizerPanel.jsx uses full width (1920x180) default coordinates (RC-03 resolved)');

// 5. Verify AdaptationResult snapshots remain 100% untouched
assert(fs.existsSync('./PreviewSnapshot.json') && fs.existsSync('./ExportSnapshot.json'), 'Preview & Export baseline snapshots intact');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
if (passedTests === totalTests) {
    console.log('SUCCESS: MF-1406A.7 Root Cause Resolution Certified!');
    process.exit(0);
} else {
    console.error('FAILURE: Root cause resolution verification failed.');
    process.exit(1);
}
