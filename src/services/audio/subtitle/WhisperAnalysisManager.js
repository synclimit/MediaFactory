import { WhisperAnalysisEngine } from '../../analysis/whisper/WhisperAnalysisEngine.js';
import { subtitleCacheManager } from './SubtitleCacheManager.js';

/**
 * MF-500A: Whisper Analysis Manager
 * Orchestrates subtitle analysis. Only executes Whisper if cache is missing or invalid.
 */
class WhisperAnalysisManager {
    constructor() {
        this.engine = new WhisperAnalysisEngine();
    }

    /**
     * Obtains a SubtitleDocument, either from cache or by executing Whisper.
     * @param {string} audioHash Unique identifier for the audio file
     * @param {ArrayBuffer|Blob|File} audioData Audio data for analysis
     * @returns {Promise<import('./SubtitleModels').SubtitleDocument>}
     */
    async analyze(audioHash, audioData) {
        // 1. Check Cache
        const cachedDoc = subtitleCacheManager.getSubtitleDocument(audioHash);
        if (cachedDoc) {
            return cachedDoc; // Cache Hit
        }

        // 2. Cache Miss - Execute Whisper Once
        const whisperJson = await this.engine.analyze(audioData);

        // 3. Save to Cache
        subtitleCacheManager.setSubtitleDocument(audioHash, whisperJson);

        // 4. Return new document
        return subtitleCacheManager.getSubtitleDocument(audioHash);
    }
}

export const whisperAnalysisManager = new WhisperAnalysisManager();
export default WhisperAnalysisManager;
