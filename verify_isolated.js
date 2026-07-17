// Mock global objects for Node.js
if (!global.performance) {
    global.performance = require('perf_hooks').performance;
}
global.indexedDB = { open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }) };
global.window = { __m3_analyser: null };

// We import AudioDrivenRuntime, but mock the BeatEngine dependency before it resolves
import { audioDrivenRuntime } from './src/services/audio/v2/AudioDrivenRuntime.js';

console.log('--- Initial Kick State ---');
console.log(audioDrivenRuntime.channels.kick.getState());

// Create the flat BeatEvent structure that BeatEngine generates in V2
const beatEvent = {
    time: performance.now(),
    type: 'beat',
    strength: 0.9,
    confidence: 1.0,
    bpm: 120,
    beatPhase: 0,
    kickScore: 0.8, // this should trigger the kick!
    snareScore: 0.1,
    hatScore: 0.1,
    energy: 0.7,
    brightness: 0.5
};

console.log('\n--- Firing processEvent(beatEvent) ---');
audioDrivenRuntime.processEvent(beatEvent);

console.log('\n--- State after processEvent (before frame update) ---');
console.log(audioDrivenRuntime.channels.kick.getState());

console.log('\n--- Simulating Frame Update (dt = 0.016) ---');
audioDrivenRuntime.update(0.016);

console.log('\n--- State after frame update ---');
console.log(audioDrivenRuntime.channels.kick.getState());

// Output JSON for the evidence
const fs = require('fs');
fs.writeFileSync('runtime_evidence.json', JSON.stringify({
    success: true,
    kickStateAfterUpdate: audioDrivenRuntime.channels.kick.getState()
}, null, 2));

console.log('\nProof saved to runtime_evidence.json');
