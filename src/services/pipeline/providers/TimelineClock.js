/**
 * TimelineClock
 * Internal ticker for the Timeline. Handles the actual time progression logic.
 */
export class TimelineClock {
    constructor() {
        this.currentTime = 0;
        this.frameNumber = 0;
        this.playbackRate = 1.0;
        this.direction = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.isLooping = false;
        this.loopStart = 0;
        this.loopEnd = 0;
        
        this._lastRealTime = 0;
        this._fixedDelta = 1 / 60; // Defaults to 60fps
    }

    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this._lastRealTime = performance.now();
    }

    pause() {
        this.isPlaying = false;
        this.isPaused = true;
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.frameNumber = 0;
    }

    seek(time) {
        this.currentTime = Math.max(0, time);
        // Do not reset frame number on seek so we don't break monotonic frame sequences
    }

    tick(mode) {
        let delta = 0;

        if (!this.isPlaying) {
            return 0; // Delta is 0 when paused/stopped
        }

        if (mode === 'RealtimePreview') {
            // Realtime mode uses actual elapsed time
            const now = performance.now();
            delta = (now - this._lastRealTime) / 1000.0;
            this._lastRealTime = now;
        } else {
            // Export, Offline, Benchmark, UnitTest force a fixed timestep
            delta = this._fixedDelta;
        }

        const effectiveDelta = delta * this.playbackRate * this.direction;
        this.currentTime += effectiveDelta;
        this.frameNumber++;

        // Handle Looping
        if (this.isLooping && this.loopEnd > this.loopStart) {
            if (this.currentTime >= this.loopEnd) {
                this.currentTime = this.loopStart + (this.currentTime - this.loopEnd);
            } else if (this.currentTime < this.loopStart) {
                this.currentTime = this.loopEnd - (this.loopStart - this.currentTime);
            }
        }

        // Clamp to zero just in case
        if (this.currentTime < 0) {
            this.currentTime = 0;
        }

        return effectiveDelta;
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
    }

    setLoop(start, end) {
        this.loopStart = start;
        this.loopEnd = end;
        this.isLooping = (end > start);
    }
}
