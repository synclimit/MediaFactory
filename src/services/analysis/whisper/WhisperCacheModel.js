/**
 * MF-206C: Whisper Cache Model
 * 
 * Data contract definition for the Whisper Cache system according to the SDD.
 * This module purely defines the object shapes and lifecycle states.
 * It contains NO storage adapters, NO analysis logic, and NO dependencies on Subtitle Engine.
 */

import { TranscriptContract } from '../TranscriptContract.js';

export const CacheState = {
    INVALID: 'INVALID',
    ANALYZING: 'ANALYZING',
    READY: 'READY',
    STALE: 'STALE',
    PURGED: 'PURGED'
};

export class CacheHeader {
    constructor(audioHash = "", engineVersion = "1.0.0", modelVersion = "large-v3", language = "auto") {
        this.schemaVersion = "1.0.0";
        this.schemaType = "whisper_cache";
        this.engineVersion = engineVersion;
        this.modelVersion = modelVersion;
        this.audioHash = audioHash;
        this.language = language;
        this.createdAt = new Date().toISOString();
    }
}

export class CacheSummary {
    constructor() {
        this.duration = 0;
        this.segmentCount = 0;
        this.wordCount = 0;
        this.detectedLanguage = "unknown";
        this.averageConfidence = 0;
    }
}

export class CacheValidation {
    constructor(audioHash = "", modelVersion = "", engineVersion = "", language = "", transcriptionParameters = {}) {
        this.audioHash = audioHash;
        this.modelVersion = modelVersion;
        this.engineVersion = engineVersion;
        this.language = language;
        this.transcriptionParameters = transcriptionParameters;
    }
    
    /**
     * Evaluates if the cache is still valid based on current execution parameters
     * @param {Object} currentParams - The parameters of the current analysis request
     * @returns {boolean} true if cache is valid, false if STALE
     */
    isValid(currentParams) {
        if (!currentParams) return false;
        if (this.audioHash !== currentParams.audioHash) return false;
        if (this.modelVersion !== currentParams.modelVersion) return false;
        if (this.engineVersion !== currentParams.engineVersion) return false;
        if (this.language !== currentParams.language) return false;
        
        // Deep compare transcriptionParameters
        const currentTxParams = currentParams.transcriptionParameters || {};
        const savedTxParams = this.transcriptionParameters || {};
        
        const savedKeys = Object.keys(savedTxParams);
        const currentKeys = Object.keys(currentTxParams);
        
        if (savedKeys.length !== currentKeys.length) return false;
        
        for (const key of savedKeys) {
            if (savedTxParams[key] !== currentTxParams[key]) {
                return false;
            }
        }
        
        return true;
    }
}

export class WhisperCacheRoot {
    constructor(audioHash = "", engineVersion = "1.0.0", modelVersion = "large-v3", language = "auto", transcriptionParameters = {}) {
        this.header = new CacheHeader(audioHash, engineVersion, modelVersion, language);
        this.summary = new CacheSummary();
        
        // Use the universal TranscriptContract
        this.transcript = new TranscriptContract("Whisper", modelVersion, audioHash);
        
        this.validation = new CacheValidation(audioHash, modelVersion, engineVersion, language, transcriptionParameters);
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
            console.warn(`[WhisperCacheModel] Invalid CacheState assigned: ${newState}`);
        }
    }

    /**
     * Validate if the model is ready for zero-compute usage.
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
    CacheValidation,
    WhisperCacheRoot
};
