export class BeatEvent {
    constructor(data = {}) {
        // Core Timing
        this.timestamp = data.timestamp || 0;
        this.bpm = data.bpm || 0;
        this.beatIndex = data.beatIndex || 0;
        this.barIndex = data.barIndex || 0;

        // Confidence
        this.confidence = data.confidence || 0;
        this.onset = !!data.onset;
        this.downbeat = !!data.downbeat;

        // Classification
        this.kick = Object.freeze({
            probability: data.kick?.probability || 0,
            strength: data.kick?.strength || 0
        });
        
        this.snare = Object.freeze({
            probability: data.snare?.probability || 0,
            strength: data.snare?.strength || 0
        });
        
        this.hihat = Object.freeze({
            probability: data.hihat?.probability || 0,
            strength: data.hihat?.strength || 0
        });

        // Energy
        this.energy = data.energy || 0;

        // Offline Spectrum
        this.spectrum = data.spectrum ? new Float32Array(data.spectrum) : null;

        Object.freeze(this);
    }
}
