import { analysisCacheManager } from '../AnalysisCacheManager.js';
import { SubtitleDocument } from './SubtitleModels.js';
import { CacheState } from '../BeatCacheModel.js';

/**
 * MF-500A: Subtitle Cache Manager
 * Provides domain-specific logic to access the whisper_cache inside AnalysisCacheManager.
 * Responsible for cache validation and serialization of SubtitleDocument.
 */
class SubtitleCacheManager {
    /**
     * Attempts to retrieve a SubtitleDocument from the active whisper cache.
     * @param {string} currentAudioHash 
     * @returns {SubtitleDocument|null} Null if cache is invalid or missing
     */
    getSubtitleDocument(currentAudioHash) {
        if (!analysisCacheManager.hasCache('whisper_cache')) {
            return null;
        }

        const isValid = analysisCacheManager.validateCache('whisper_cache', currentAudioHash);
        if (!isValid) {
            return null;
        }

        const cache = analysisCacheManager.getCache('whisper_cache');
        if (cache && cache.state === CacheState.READY && cache.transcript) {
            return new SubtitleDocument(cache.transcript);
        }

        return null;
    }

    /**
     * Caches the raw Whisper JSON output into AnalysisCacheManager.
     * @param {string} audioHash 
     * @param {Object} whisperJson 
     */
    setSubtitleDocument(audioHash, whisperJson) {
        const cache = analysisCacheManager.getCache('whisper_cache');
        if (cache) {
            cache.header.audioHash = audioHash;
            cache.header.version = "1.0.0"; // Placeholder versioning
            cache.transcript = whisperJson; // Store raw JSON string or object
            if (typeof cache.setState === 'function') {
                cache.setState(CacheState.READY);
            }
        }
    }

    /**
     * Checks if the cache for the current audio is valid and ready.
     * @param {string} audioHash 
     * @returns {boolean}
     */
    isCacheValid(audioHash) {
        return analysisCacheManager.validateCache('whisper_cache', audioHash);
    }
}

export const subtitleCacheManager = new SubtitleCacheManager();
export default SubtitleCacheManager;
