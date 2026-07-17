import { BeatProvider } from './BeatProvider';

/**
 * CachedBeatProvider
 * 
 * Mengambil data beat dari storage atau cache (pre-analyzed).
 * Implementasi stub untuk Sprint ini: tidak mengimplementasikan cache penuh.
 */
export class CachedBeatProvider extends BeatProvider {
    /**
     * @param {Object} cacheManager - Instance dari BeatCacheManager (diinjeksi via Dependency Injection)
     */
    constructor(cacheManager) {
        super();
        this.cacheManager = cacheManager;
        this.simulatedState = null;
    }

    /**
     * Mengambil state dari cache berdasarkan waktu saat ini.
     * @param {number} currentTime - Waktu pemutaran audio
     * @returns {Object|null} BeatState
     */
    getState(currentTime) {
        if (!this.cacheManager) return null;
        
        // Sesuai rules: "Jangan mengimplementasikan Cached Playback penuh"
        // Provider ini merupakan stub yang menyembunyikan sumber data.
        return this.simulatedState;
    }

    /**
     * Mereset provider.
     */
    reset() {
        this.simulatedState = null;
        if (this.cacheManager && typeof this.cacheManager.reset === 'function') {
            this.cacheManager.reset();
        }
    }

    /**
     * Memeriksa kesiapan cache provider.
     */
    isReady() {
        return !!this.cacheManager;
    }
}
