/**
 * PipelineDiagnostic
 * Minimal diagnostic schema for profiling or error capturing.
 */
export class PipelineDiagnostic {
    constructor({ adapterName, frameNumber, severity, executionTime, warnings = [], errors = [], beatEngineVersion, cacheHit, timelineSource }) {
        this.adapterName = adapterName;
        this.frameNumber = frameNumber;
        this.severity = severity; // 'info', 'warning', 'error', 'fatal'
        this.executionTime = executionTime; // Time in milliseconds
        this.warnings = warnings;
        this.errors = errors;
        
        // Extended Diagnostics for Engine Introspection
        this.beatEngineVersion = beatEngineVersion;
        this.cacheHit = cacheHit;
        this.timelineSource = timelineSource; // 'LIVE' | 'CACHE'
        
        Object.freeze(this);
    }
}
