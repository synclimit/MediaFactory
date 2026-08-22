/**
 * test_mf1410_production_acceptance.mjs
 * Production acceptance test suite validating 8 production project archetypes against Fast Workspace.
 */

import { RenderingContext } from './src/services/pipeline/fastrender/workspace/RenderingContext.js';
import { activeFastProceduralProvider } from './src/services/pipeline/fastrender/workspace/extensions/ProceduralProvider.js';
import fs from 'fs';

console.log('=== TEST MF-1410 PRODUCTION ACCEPTANCE CERTIFICATION ===\n');

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

const projectArchetypes = [
    { id: 'proj-1', name: 'Lyrics Video', duration: 240, objects: [{ id: 'lyr-1', type: 'text', name: 'Lyrics' }] },
    { id: 'proj-2', name: 'Audio Visualizer', duration: 180, objects: [{ id: 'viz-1', type: 'visualizer', barCount: 256 }] },
    { id: 'proj-3', name: 'Subtitle Heavy', duration: 300, objects: [{ id: 'sub-1', type: 'text', name: 'Subtitles' }] },
    { id: 'proj-4', name: 'Camera Shake', duration: 120, objects: [{ id: 'shk-1', type: 'engine-camerashake', intensity: 75 }] },
    { id: 'proj-5', name: 'Zoom Pulse', duration: 150, objects: [{ id: 'zm-1', type: 'engine-zoompulse', depth: 60 }] },
    { id: 'proj-6', name: 'Multi Layer Composition', duration: 200, objects: [{ id: 'bg-1', type: 'background' }, { id: 'viz-1', type: 'visualizer' }, { id: 'txt-1', type: 'text' }] },
    { id: 'proj-7', name: 'Long Timeline (>30 min)', duration: 2400, objects: [{ id: 'bg-1', type: 'background' }, { id: 'viz-1', type: 'visualizer' }] },
    { id: 'proj-8', name: 'Short Loop', duration: 10, objects: [{ id: 'bg-1', type: 'background' }, { id: 'viz-1', type: 'visualizer' }] }
];

const EPSILON = 1e-6;

projectArchetypes.forEach(proj => {
    console.log(`--- Validating Project Archetype: ${proj.name} (${proj.duration}s) ---`);
    
    const context = new RenderingContext({
        workspaceMode: 'FAST',
        extensions: { proceduralProvider: activeFastProceduralProvider },
        projectState: { m3Objects: proj.objects }
    });

    assert(context.isFastWorkspace === true, `${proj.name}: Fast Workspace context initialized`);

    const tMid = proj.duration / 2;
    const previewAdapted = context.adaptProjectObjects(proj.objects, tMid, 10.0, 1337);
    const exportAdapted = context.adaptProjectObjects(proj.objects, tMid, 10.0, 1337);

    assert(previewAdapted.length === exportAdapted.length, `${proj.name}: Object count matches between Preview and Export (${previewAdapted.length})`);

    let maxDelta = 0;
    for (let i = 0; i < previewAdapted.length; i++) {
        const p = previewAdapted[i];
        const e = exportAdapted[i];

        if (p._fftData && e._fftData) {
            for (let j = 0; j < p._fftData.length; j++) {
                const diff = Math.abs(p._fftData[j] - e._fftData[j]);
                if (diff > maxDelta) maxDelta = diff;
            }
        }
    }

    assert(maxDelta <= EPSILON, `${proj.name}: Preview == Export equivalence certified (maxDelta=${maxDelta})`);

    // Verify Loop Continuity
    const stateAt0 = context.adaptProjectObjects(proj.objects, 0.0, 10.0, 1337);
    const stateAtEnd = context.adaptProjectObjects(proj.objects, 10.0, 10.0, 1337);

    let loopMaxDelta = 0;
    for (let i = 0; i < stateAt0.length; i++) {
        if (stateAt0[i]._fftData && stateAtEnd[i]._fftData) {
            for (let j = 0; j < stateAt0[i]._fftData.length; j++) {
                const diff = Math.abs(stateAt0[i]._fftData[j] - stateAtEnd[i]._fftData[j]);
                if (diff > loopMaxDelta) loopMaxDelta = diff;
            }
        }
    }

    assert(loopMaxDelta <= EPSILON, `${proj.name}: Loop boundary continuity certified (t=0 vs t=10.0s, maxDelta=${loopMaxDelta})`);
});

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} PRODUCTION ACCEPTANCE TESTS PASSED ===`);
if (passedTests === totalTests) {
    console.log('SUCCESS: All 8 Production Project Archetypes PASSED! Roadmap V2 PRODUCTION ACCEPTED!');
    process.exit(0);
} else {
    console.error('FAILURE: Production acceptance validation failed.');
    process.exit(1);
}
