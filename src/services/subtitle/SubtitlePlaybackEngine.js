class SubtitlePlaybackEngine {
    constructor() {
        this.cues = [];
        this.currentTime = 0;
        this.playbackRate = 1;
        this.isPlaying = false;

        this.currentCue = null;
        this.currentIndex = -1;
        this.progress = 0;
        this.isActive = false;
        this.hasEnded = false;
    }

    load(documentOrCues) {
        // Handling MF-206E SubtitleDocument
        if (documentOrCues && Array.isArray(documentOrCues.segments)) {
            this.cues = documentOrCues.segments;
        } else {
            // Legacy fallback
            this.cues = Array.isArray(documentOrCues) ? documentOrCues : [];
        }
        this.reset();
    }

    update(currentTime) {
        this.currentTime = currentTime;
        this._evaluate();
    }

    tick(deltaTime) {
        if (!this.isPlaying) return;
        this.currentTime += deltaTime * this.playbackRate;
        this._evaluate();
    }

    seek(time) {
        this.currentTime = time;
        this._evaluate();
    }

    pause() {
        this.isPlaying = false;
    }

    resume() {
        this.isPlaying = true;
    }

    reset() {
        this.currentTime = 0;
        this.isPlaying = false;
        this._evaluate();
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
    }

    _evaluate() {
        if (this.cues.length === 0) {
            this.currentCue = null;
            this.currentIndex = -1;
            this.isActive = false;
            this.progress = 0;
            this.hasEnded = false;
            return;
        }

        let foundCue = null;
        let foundIndex = -1;

        for (let i = 0; i < this.cues.length; i++) {
            const cue = this.cues[i];
            if (this.currentTime >= cue.start && this.currentTime <= cue.end) {
                foundCue = cue;
                foundIndex = i;
                break;
            }
        }

        if (foundCue) {
            this.currentCue = foundCue;
            this.currentIndex = foundIndex;
            this.isActive = true;
            this.progress = foundCue.duration > 0 
                ? Math.max(0, Math.min(1, (this.currentTime - foundCue.start) / foundCue.duration))
                : 1;
        } else {
            this.currentCue = null;
            this.currentIndex = -1;
            this.isActive = false;
            this.progress = 0;
        }

        const lastCue = this.cues[this.cues.length - 1];
        this.hasEnded = this.currentTime > (lastCue ? lastCue.end : 0);
    }

    getState() {
        return {
            currentCue: this.currentCue,
            currentIndex: this.currentIndex,
            progress: this.progress,
            isActive: this.isActive,
            hasEnded: this.hasEnded
        };
    }
}

export const subtitlePlaybackEngine = new SubtitlePlaybackEngine();
export default SubtitlePlaybackEngine;
