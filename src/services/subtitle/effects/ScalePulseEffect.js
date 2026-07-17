class ScalePulseEffect {
    constructor() {
        this.id = 'scale'; // key matches preset dictionary
        this.enabled = true;
        this.state = {
            scale: 1.0
        };
        this.config = {
            maxScale: 1.15,
            attack: 0.02,
            decay: 10
        };
        this._currentScale = 1.0;
    }

    configure(config) {
        if (!config) return;
        this.enabled = config.enabled !== false;
        this.config = { ...this.config, ...config };
    }

    update(reactiveState, dt) {
        if (!this.enabled || !reactiveState) return;

        if (reactiveState.beat > 0) {
            const jumpAmount = (this.config.maxScale - 1.0) * (reactiveState.beatStrength || 0.5);
            this._currentScale = 1.0 + jumpAmount;
        }

        const decayFactor = this.config.decay;
        this._currentScale += (1.0 - this._currentScale) * Math.min(1.0, dt * decayFactor);

        this.state.scale = this._currentScale;
    }

    reset() {
        this._currentScale = 1.0;
        this.state.scale = 1.0;
    }

    getState() {
        return this.state;
    }
}

export default ScalePulseEffect;
