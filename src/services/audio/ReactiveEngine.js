/**
 * MediaFactory Enterprise Reactive Engine
 * Generates normalized reactive channels exactly once per frame.
 * Does not contain object-specific parameters or DSP.
 */
/**
 * @deprecated Legacy Engine. Do not use for new visual effects. 
 * Kept for backward compatibility with Subtitles and Generic Objects.
 */
class ReactiveEngine {
    constructor() {
        this.channels = {
            master: 0,
            energy: 0,
            beat: 0,
            beatStrength: 0,
            kick: 0,
            bass: 0,
            lowMid: 0,
            mid: 0,
            highMid: 0,
            treble: 0,
            vocal: 0,
            bpm: 0,
            confidence: 0
        };
    }

    update(beatState, dt, isPlaying) {
        if (!beatState) return;

        // Normalize BPM assuming 60-180 range maps to 0-1 (can be clamped)
        const bpmRaw = beatState.bpm || 120;
        this.channels.bpm = Math.max(0, Math.min(1, (bpmRaw - 60) / 120));

        if (isPlaying === false && beatState.playFactor < 0.05) {
            this.channels.master = 0;
            this.channels.energy = 0;
            this.channels.beat = 0;
            this.channels.beatStrength = 0;
            this.channels.kick = 0;
            this.channels.bass = 0;
            this.channels.lowMid = 0;
            this.channels.mid = 0;
            this.channels.highMid = 0;
            this.channels.treble = 0;
            this.channels.vocal = 0;
            this.channels.confidence = 0;
            return;
        }

        // Ensure 0-1 normalization for all reactive channels
        const norm = (val) => Math.min(Math.max((val || 0), 0), 1);
        
        this.channels.master = norm(beatState.master);
        this.channels.energy = norm(beatState.energy);
        this.channels.beat = beatState.beat ? 1.0 : 0.0;
        this.channels.beatStrength = norm(beatState.beatStrength);
        
        this.channels.kick = norm(beatState.kick);
        this.channels.bass = norm(beatState.bass);
        this.channels.lowMid = norm(beatState.lowMid);
        this.channels.mid = norm(beatState.mid);
        this.channels.highMid = norm(beatState.highMid);
        this.channels.treble = norm(beatState.treble);
        this.channels.vocal = norm(beatState.vocal);
        this.channels.confidence = norm((beatState.confidence || 0) / 100);
    }

    getChannel(name) {
        return this.channels[name] || 0;
    }

    getChannels() {
        return this.channels;
    }
}

export const reactiveEngine = new ReactiveEngine();
