import { reactiveEngine } from '../audio/ReactiveEngine';

class SubtitleReactiveAdapter {
    constructor() {
        this.isConnected = false;
        this.state = {
            beat: 0,
            beatStrength: 0,
            kick: 0,
            bass: 0,
            energy: 0,
            master: 0
        };
    }

    connect() {
        this.isConnected = true;
    }

    disconnect() {
        this.isConnected = false;
        this._clearState();
    }

    update() {
        if (!this.isConnected) return;
        
        const channels = reactiveEngine.getChannels();
        this.state.beat = channels.beat || 0;
        this.state.beatStrength = channels.beatStrength || 0;
        this.state.kick = channels.kick || 0;
        this.state.bass = channels.bass || 0;
        this.state.energy = channels.energy || 0;
        this.state.master = channels.master || 0;
    }

    _clearState() {
        this.state = {
            beat: 0,
            beatStrength: 0,
            kick: 0,
            bass: 0,
            energy: 0,
            master: 0
        };
    }

    getState() {
        return this.state;
    }
}

export const subtitleReactiveAdapter = new SubtitleReactiveAdapter();
export default SubtitleReactiveAdapter;
