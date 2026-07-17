class FadeInAnimation {
    constructor() {
        this.id = 'fade_in';
        this.enabled = true;
        this.config = {
            durationMs: 300,
            startScale: 0.95,
            easing: 'easeOutQuad'
        };
        this.state = {
            opacity: 1.0,
            scale: 1.0
        };
    }

    configure(config) {
        if (!config) return;
        this.enabled = config.enabled !== false;
        this.config = { ...this.config, ...config };
    }

    _applyEasing(progress, type) {
        switch (type) {
            case 'linear':
                return progress;
            case 'easeInOutQuad':
                return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            case 'easeOutBounce':
                return this._easeOutBounce(progress);
            case 'easeOutQuad':
            default:
                return progress * (2 - progress);
        }
    }

    _easeOutBounce(x) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    }

    update(playbackState, dt) {
        if (!this.enabled || !playbackState || !playbackState.currentCue) {
            this.state.opacity = 1.0;
            this.state.scale = 1.0;
            return;
        }

        const cue = playbackState.currentCue;
        const elapsedMs = playbackState.currentTime - cue.start;

        if (elapsedMs < this.config.durationMs && elapsedMs >= 0) {
            const progress = Math.max(0, elapsedMs / this.config.durationMs);
            const ease = this._applyEasing(progress, this.config.easing);
            
            this.state.opacity = ease;
            const startScale = this.config.startScale;
            this.state.scale = startScale + ((1.0 - startScale) * ease);
        } else {
            this.state.opacity = 1.0;
            this.state.scale = 1.0;
        }
    }

    reset() {
        this.state.opacity = 1.0;
        this.state.scale = 1.0;
    }

    getState() {
        return this.state;
    }
}

export default FadeInAnimation;
