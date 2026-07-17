/**
 * TimelineState
 * Immutable state snapshot representing the current status of the Timeline.
 */
export class TimelineState {
    constructor({
        currentTime = 0,
        deltaTime = 0,
        frameNumber = 0,
        playbackRate = 1.0,
        direction = 1, // 1 for forward, -1 for backward
        isPlaying = false,
        isPaused = false,
        isLooping = false,
        loopStart = 0,
        loopEnd = 0
    }) {
        this.currentTime = currentTime;
        this.deltaTime = deltaTime;
        this.frameNumber = frameNumber;
        this.playbackRate = playbackRate;
        this.direction = direction;
        this.isPlaying = isPlaying;
        this.isPaused = isPaused;
        this.isLooping = isLooping;
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;
        Object.freeze(this);
    }
}
