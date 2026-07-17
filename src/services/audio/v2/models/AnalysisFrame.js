export class AnalysisFrame {
    constructor(data = {}) {
        this.timestamp = data.timestamp || 0;
        this.rms = data.rms || 0;
        this.peak = data.peak || 0;
        this.spectralFlux = data.spectralFlux || 0;
        this.transient = data.transient || 0;
        this.lowEnergy = data.lowEnergy || 0;
        this.midEnergy = data.midEnergy || 0;
        this.highEnergy = data.highEnergy || 0;
        this.onsetStrength = data.onsetStrength || 0;
        
        // Deep clone the optional array if provided
        this.fftSummary = data.fftSummary ? Object.freeze([...data.fftSummary]) : undefined;

        Object.freeze(this);
    }
}
