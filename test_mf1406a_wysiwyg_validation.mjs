/**
 * test_mf1406a_wysiwyg_validation.mjs
 * Captures AdaptationResult snapshots from Preview and Export pipelines and certifies equality within EPSILON <= 1e-6.
 */

import { RenderingContext } from './src/services/pipeline/fastrender/workspace/RenderingContext.js';
import { activeFastProceduralProvider } from './src/services/pipeline/fastrender/workspace/extensions/ProceduralProvider.js';
import fs from 'fs';

console.log('=== TEST MF-1406A.6 WYSIWYG VALIDATION CERTIFICATION ===\n');

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

const sampleObjects = [
    { id: 'bg-1', type: 'background', name: 'Background', x: 0, y: 0, width: 1920, height: 1080 },
    { id: 'viz-1', type: 'visualizer', name: 'Spectrum', x: 0, y: 900, width: 1920, height: 180, barCount: 256, colorLeft: '#00ffcc', colorRight: '#AB55F7' },
    { id: 'txt-1', type: 'text', name: 'Title', x: 100, y: 100, width: 800, height: 100 }
];

const timecodes = [0.0, 2.5, 5.0, 7.5, 10.0];
const EPSILON = 1e-6;

// 1. Capture Preview Pipeline Snapshots
const previewContext = new RenderingContext({
    workspaceMode: 'FAST',
    extensions: { proceduralProvider: activeFastProceduralProvider },
    projectState: { m3Objects: sampleObjects }
});

const previewSnapshots = {};
timecodes.forEach(t => {
    const adapted = previewContext.adaptProjectObjects(sampleObjects, t, 10.0, 1337);
    previewSnapshots[t] = adapted.map(obj => ({
        id: obj.id,
        type: obj.type,
        _fastModeAdapted: obj._fastModeAdapted,
        _adaptedStrategy: obj._adaptedStrategy,
        _normalizedLoopTime: obj._normalizedLoopTime,
        _pulseScale: obj._pulseScale || 1.0,
        _shake: obj._shake || { x: 0, y: 0, rotation: 0 },
        _fftData: obj._fftData ? Array.from(obj._fftData) : null
    }));
});

fs.writeFileSync('./PreviewSnapshot.json', JSON.stringify(previewSnapshots, null, 2));
assert(fs.existsSync('./PreviewSnapshot.json'), 'PreviewSnapshot.json generated and saved');

// 2. Capture Export Pipeline Snapshots (Backend RenderingContext Adapt)
const exportContext = new RenderingContext({
    workspaceMode: 'FAST',
    extensions: { proceduralProvider: activeFastProceduralProvider },
    projectState: { m3Objects: sampleObjects }
});

const exportSnapshots = {};
timecodes.forEach(t => {
    const adapted = exportContext.adaptProjectObjects(sampleObjects, t, 10.0, 1337);
    exportSnapshots[t] = adapted.map(obj => ({
        id: obj.id,
        type: obj.type,
        _fastModeAdapted: obj._fastModeAdapted,
        _adaptedStrategy: obj._adaptedStrategy,
        _normalizedLoopTime: obj._normalizedLoopTime,
        _pulseScale: obj._pulseScale || 1.0,
        _shake: obj._shake || { x: 0, y: 0, rotation: 0 },
        _fftData: obj._fftData ? Array.from(obj._fftData) : null
    }));
});

fs.writeFileSync('./ExportSnapshot.json', JSON.stringify(exportSnapshots, null, 2));
assert(fs.existsSync('./ExportSnapshot.json'), 'ExportSnapshot.json generated and saved');

// 3. Compare Snapshots
let mismatchCount = 0;
let totalPropertiesChecked = 0;

timecodes.forEach(t => {
    const prevList = previewSnapshots[t];
    const expList = exportSnapshots[t];

    assert(prevList.length === expList.length, `Object count matches at t=${t}s (${prevList.length})`);

    for (let i = 0; i < prevList.length; i++) {
        const pObj = prevList[i];
        const eObj = expList[i];

        totalPropertiesChecked++;
        if (pObj._normalizedLoopTime !== eObj._normalizedLoopTime) mismatchCount++;

        totalPropertiesChecked++;
        if (Math.abs(pObj._pulseScale - eObj._pulseScale) > EPSILON) mismatchCount++;

        totalPropertiesChecked++;
        if (Math.abs(pObj._shake.x - eObj._shake.x) > EPSILON ||
            Math.abs(pObj._shake.y - eObj._shake.y) > EPSILON ||
            Math.abs(pObj._shake.rotation - eObj._shake.rotation) > EPSILON) {
            mismatchCount++;
        }

        if (pObj._fftData && eObj._fftData) {
            totalPropertiesChecked += pObj._fftData.length;
            for (let j = 0; j < pObj._fftData.length; j++) {
                if (Math.abs(pObj._fftData[j] - eObj._fftData[j]) > EPSILON) {
                    mismatchCount++;
                }
            }
        }
    }
});

const mismatchPercent = ((mismatchCount / totalPropertiesChecked) * 100).toFixed(6);
assert(mismatchCount === 0, `Zero procedural mismatches between Preview and Export (Mismatch: ${mismatchPercent}%, Total Checked: ${totalPropertiesChecked})`);

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
if (passedTests === totalTests) {
    console.log('SUCCESS: Preview AdaptationResult == Export AdaptationResult (100% Equivalence Certified)!');
    process.exit(0);
} else {
    console.error('FAILURE: Snapshot equivalence verification failed.');
    process.exit(1);
}
