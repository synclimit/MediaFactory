/**
 * MusicalFeelEngine
 * 
 * Computes an adaptive "Musical Feel" score based on raw Beat Engine data.
 * Adheres to Analyze Once -> Read Many philosophy.
 */
export class MusicalFeelEngine {
    constructor() {
        this.bpm = 120;
        this.stability = 1.0;
        this.confidence = 1.0;
        this.energy = 0;
        
        this.kickStrength = 0;
        this.beatStrength = 0;
        this.isDownbeat = false;

        // Reusable output object to prevent per-frame garbage
        this._output = {
            punch: 0,
            sustain: 1.0,
            agility: 1.0,
            stability: 1.0,
            energy: 0,
            groove: 0,
            bpm: 120
        };
    }

    /**
     * @param {Object} beatEvent 
     */
    processEvent(beatEvent) {
        if (!beatEvent) return;
        
        this.bpm = beatEvent.bpm > 0 ? beatEvent.bpm : this.bpm;
        this.confidence = beatEvent.confidence !== undefined ? beatEvent.confidence : this.confidence;
        
        // Fallback to confidence if intervalConfidence (stability) isn't explicitly passed
        this.stability = beatEvent.intervalConfidence !== undefined ? beatEvent.intervalConfidence : this.confidence;
        this.energy = beatEvent.energy !== undefined ? beatEvent.energy : this.energy;

        this.kickStrength = beatEvent.kickScore > 0.5 ? (beatEvent.strength || 1.0) : 0;
        this.beatStrength = beatEvent.energy || 0;
        this.isDownbeat = !!beatEvent.downbeat;
    }

    /**
     * @param {number} dt 
     * @returns {Object} Immutable-like output (read-only consumer assumption)
     */
    update(dt) {
        const bpmRatio = this.bpm > 0 ? this.bpm / 120.0 : 1.0;
        
        // Agility: High BPM + High Stability = Can react faster
        const agility = Math.min(2.5, bpmRatio * (0.5 + 0.5 * this.stability));
        
        // Sustain: Slower BPM requires longer sustain (inverse of agility)
        const sustain = Math.max(0.2, Math.min(3.0, (1.0 / bpmRatio) * (0.5 + 0.5 * this.confidence)));
        
        // Punch: Strong kicks and downbeats create higher impact peaks
        let punchBase = (this.kickStrength * 0.7) + (this.beatStrength * 0.3);
        if (this.isDownbeat) {
            punchBase *= 1.5;
        }
        
        // Modulate punch by confidence to prevent jitter on weak detections
        const punch = Math.min(2.0, punchBase * this.confidence);
        
        // Groove: Composite metric of how well the beat is holding together
        const groove = this.stability * this.energy;

        // Populate output
        this._output.punch = punch;
        this._output.sustain = sustain;
        this._output.agility = agility;
        this._output.stability = this.stability;
        this._output.energy = this.energy;
        this._output.groove = groove;
        this._output.bpm = this.bpm;

        // Reset triggers so they only apply on the exact event frame
        this.isDownbeat = false;
        this.kickStrength = 0; 
        
        // Freeze to satisfy the immutability requirement for AudioDrivenState attachment
        return Object.freeze({ ...this._output });
    }
}
