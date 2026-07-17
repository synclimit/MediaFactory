import { BeatProvider } from './BeatProvider';

/**
 * RealtimeBeatProvider
 * 
 * Mengambil data secara langsung dari BeatEngine (realtime).
 * Menyembunyikan sumber engine dari consumer.
 */
export class RealtimeBeatProvider extends BeatProvider {
    /**
     * @param {Object} beatEngine - Instance dari BeatEngine (diinjeksi via Dependency Injection)
     */
    constructor(beatEngine) {
        super();
        this.engine = beatEngine;
    }

    /**
     * Mengambil state dari realtime engine.
     * @param {number} currentTime - Tidak terlalu relevan untuk realtime, namun sesuai signature.
     * @returns {Object|null} BeatState
     */
    getState(currentTime) {
        if (!this.engine) return null;
        
        // Memastikan tidak ada DSP atau proses kompleks di Provider.
        // Hanya memanggil state yang sudah dihitung oleh engine.
        return this.engine.getState();
    }

    /**
     * Reset jika diperlukan, biasanya realtime reset di-manage secara internal.
     */
    reset() {
        if (this.engine && typeof this.engine.reset === 'function') {
            this.engine.reset();
        }
    }

    /**
     * Memeriksa kesiapan realtime engine.
     */
    isReady() {
        return !!this.engine;
    }
}
