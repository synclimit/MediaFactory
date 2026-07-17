import { TimelineClock } from './TimelineClock';
import { TimelineState } from './TimelineState';
import { PlaybackMode } from './PlaybackMode';

/**
 * TimelineProvider
 * The single authoritative time source for the entire MediaFactory application.
 * All pipeline adapters read time exclusively from this provider.
 */
export class TimelineProvider {
    constructor() {
        this.clock = new TimelineClock();
        this.mode = PlaybackMode.REALTIME_PREVIEW;
        this._lastDeltaTime = 0;
    }

    initialize(mode = PlaybackMode.REALTIME_PREVIEW) {
        this.mode = mode;
        this.clock.stop();
        this._lastDeltaTime = 0;
    }

    play() {
        this.clock.start();
    }

    pause() {
        this.clock.pause();
    }

    stop() {
        this.clock.stop();
        this._lastDeltaTime = 0;
    }

    seek(time) {
        this.clock.seek(time);
        this._lastDeltaTime = 0; // Delta becomes zero immediately after a seek
    }

    stepForward() {
        // Force a single tick forward as if it was Export mode
        const delta = this.clock._fixedDelta;
        this.clock.currentTime += delta;
        this.clock.frameNumber++;
        this._lastDeltaTime = delta;
    }

    stepBackward() {
        const delta = this.clock._fixedDelta;
        this.clock.currentTime = Math.max(0, this.clock.currentTime - delta);
        this.clock.frameNumber++;
        this._lastDeltaTime = -delta;
    }

    setPlaybackRate(rate) {
        this.clock.setPlaybackRate(rate);
    }

    setLoop(start, end) {
        this.clock.setLoop(start, end);
    }

    /**
     * Should be called exactly once per pipeline update tick.
     */
    tick() {
        this._lastDeltaTime = this.clock.tick(this.mode);
    }

    getCurrentTime() {
        return this.clock.currentTime;
    }

    getDeltaTime() {
        return this._lastDeltaTime;
    }

    /**
     * Returns an immutable state snapshot of the timeline.
     * @returns {TimelineState}
     */
    getState() {
        return new TimelineState({
            currentTime: this.clock.currentTime,
            deltaTime: this._lastDeltaTime,
            frameNumber: this.clock.frameNumber,
            playbackRate: this.clock.playbackRate,
            direction: this.clock.direction,
            isPlaying: this.clock.isPlaying,
            isPaused: this.clock.isPaused,
            isLooping: this.clock.isLooping,
            loopStart: this.clock.loopStart,
            loopEnd: this.clock.loopEnd
        });
    }

    shutdown() {
        this.clock.stop();
    }
}
