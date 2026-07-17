/**
 * MF-204A: Beat Cache Model
 * 
 * Data contract definition for the Beat Cache system according to the SDD.
 * This module purely defines the object shapes and lifecycle states.
 * It contains NO storage adapters, NO analysis logic, and NO dependencies on Beat Engine.
 */

export const CacheState = {
    INVALID: 'INVALID',
    ANALYZING: 'ANALYZING',
    READY: 'READY',
    STALE: 'STALE',
    PURGED: 'PURGED'
};

export class CacheHeader {
    constructor(audioHash = "", duration = 0, frameRate = 60, engineVersion = "2.0.0") {
        this.schemaVersion = "1.0.0";
        this.schemaType = "beat_cache";
        this.engineVersion = engineVersion;
        this.audioHash = audioHash;
        this.duration = duration;
        this.frameRate = frameRate;
        this.createdAt = new Date().toISOString();
    }
}

export class CacheSummary {
    constructor() {
        this.duration = 0;
        this.averageBpm = 0;
        this.beatCount = 0;
        this.averageEnergy = 0;
        this.averageConfidence = 0;
        this.silenceRatio = 0;
    }
}

export class CacheFrames {
    constructor() {
        // Sporadic occurrences
        // Schema: { time: number, type: string, strength: number, bpm: number }
        this.events = [];    

        // Continuous stream of frames
        // Schema: { energy: number, peak: number, rms: number, brightness: number }
        this.features = [];  
    }
}

export class CacheRoot {
    constructor(audioHash, duration, frameRate, engineVersion) {
        this.header = new CacheHeader(audioHash, duration, frameRate, engineVersion);
        this.summary = new CacheSummary();
        this.frames = new CacheFrames();
        this.state = CacheState.INVALID;
    }

    /**
     * Update the lifecycle state of the cache.
     * @param {string} newState Must be one of the CacheState constants
     */
    setState(newState) {
        if (Object.values(CacheState).includes(newState)) {
            this.state = newState;
        } else {
            console.warn(`[BeatCacheModel] Invalid CacheState assigned: ${newState}`);
        }
    }

    /**
     * Validate if the model is ready for zero-compute playback.
     * @returns {boolean}
     */
    isReady() {
        return this.state === CacheState.READY;
    }
}

export default {
    CacheState,
    CacheHeader,
    CacheSummary,
    CacheFrames,
    CacheRoot
};
