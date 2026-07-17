export class BeatDebuggerSession {
    constructor(data = {}) {
        this.audioHash = data.audioHash || "UNKNOWN";
        this.analyzerVersion = data.analyzerVersion || "UNKNOWN";
        this.analysisParameters = data.analysisParameters || {};
        this.timelineSummary = data.timelineSummary || {};
        this.validationResults = data.validationResults || {};
        
        // The synchronized frame-by-frame master record
        this.debugFrames = data.debugFrames || [];
        
        // Strict immutability for the session container properties
        Object.freeze(this.timelineSummary);
        Object.freeze(this.validationResults);
        Object.freeze(this.analysisParameters);
    }
}
