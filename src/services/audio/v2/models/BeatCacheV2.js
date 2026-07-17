export class BeatCacheV2 {
    constructor(data = {}) {
        // Header
        this.schemaVersion = data.schemaVersion || "2.0.0";
        this.schemaType = data.schemaType || "beat_cache";
        this.analyzerVersion = data.analyzerVersion || "Unknown";
        this.createdAt = data.createdAt || new Date().toISOString();
        this.audioHash = data.audioHash || "";

        // Analysis Parameters
        this.analysisParameters = Object.freeze({
            fftSize: data.analysisParameters?.fftSize || 2048,
            hopSize: data.analysisParameters?.hopSize || 512,
            windowFunction: data.analysisParameters?.windowFunction || "hann",
            onsetAlgorithm: data.analysisParameters?.onsetAlgorithm || "spectral_flux",
            peakThreshold: data.analysisParameters?.peakThreshold || 0.15
        });

        // Summary
        this.summary = Object.freeze({
            dominantBpm: data.summary?.dominantBpm || 0,
            totalBeats: data.summary?.totalBeats || 0
        });

        // Timeline Model
        this.timeline = data.timeline || null;

        Object.freeze(this);
    }
}
