/**
 * Audio Driven Adapter Core
 * 
 * Lapisan translasi antara Beat Engine dan seluruh visual consumer.
 * Mengonsumsi BeatState dan menghasilkan AudioDrivenState yang seragam.
 */

class AudioDrivenAdapter {
    constructor() {
        this.state = this._createInitialState();
    }

    _createInitialState() {
        return {
            time: 0,
            beat: false,
            kick: 0,
            bass: 0,
            mid: 0,
            high: 0,
            energy: 0,
            confidence: 0,
            impulse: 0,
            accent: 0,
            transient: 0
        };
    }

    /**
     * Mengonsumsi BeatState dan mengonversinya menjadi AudioDrivenState.
     * Tidak menyimpan cache, preset, atau melakukan rendering.
     * @param {Object} beatState State dari BeatEngine
     */
    update(beatState) {
        if (!beatState) return;

        // Base properties
        this.state.time = beatState.timestamp || 0;
        this.state.beat = !!beatState.beat;
        
        // Direct frequency band mappings
        this.state.kick = beatState.kick || 0;
        this.state.bass = beatState.bass || 0;
        this.state.mid = beatState.mid || 0;
        this.state.high = beatState.treble || 0;
        
        // Context properties
        this.state.energy = beatState.energy || 0;
        this.state.confidence = beatState.confidence || 0;

        // Derived generic musical signals (Neutral, no visual bias)
        // impulse: sudden energy spike, typically during a beat
        this.state.impulse = beatState.beat ? (beatState.beatStrength || 1) : 0;
        
        // accent: sustained or significant musical emphasis
        this.state.accent = Math.max(beatState.kick || 0, beatState.peak || 0);
        
        // transient: sharp, quick attack, often high-frequency or drum hits
        this.state.transient = (beatState.features && beatState.features.crestFactor) ? 
                               (beatState.features.crestFactor * 0.1) : 
                               (beatState.beatStrength || 0);
    }

    /**
     * Mengambil AudioDrivenState terkini.
     * @returns {Object} AudioDrivenState
     */
    getState() {
        return this.state;
    }

    /**
     * Mereset state ke nilai awal.
     */
    reset() {
        this.state = this._createInitialState();
    }
}

export const audioDrivenAdapter = new AudioDrivenAdapter();
export default AudioDrivenAdapter;
