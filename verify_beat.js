import { beatEngine } from './src/services/audio/BeatEngine.js';
import { audioDrivenRuntime } from './src/services/audio/v2/AudioDrivenRuntime.js';

if (!global.performance) {
    const { performance } = await import('perf_hooks');
    global.performance = performance;
}

console.log('Initial kick state:', audioDrivenRuntime.channels.kick.getState());

const beatEvent = {
    time: performance.now(),
    type: 'beat',
    strength: 0.9,
    confidence: 1.0,
    bpm: 120,
    beatPhase: 0,
    kickScore: 0.8,
    snareScore: 0.1,
    hatScore: 0.1,
    energy: 0.7,
    brightness: 0.5
};

beatEngine._queue.push(beatEvent);
beatEngine._queue.flush(beatEngine.beatSubscribers);

console.log('State after push (before update):', audioDrivenRuntime.channels.kick.getState());

audioDrivenRuntime.update(0.016);

console.log('State after update (1 frame later):', audioDrivenRuntime.channels.kick.getState());
