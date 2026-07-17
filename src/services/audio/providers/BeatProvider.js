/**
 * MediaFactory Enterprise Beat Provider Interface
 * 
 * Abstraksi sumber BeatState.
 * Bertugas memilih sumber data tanpa diketahui oleh consumer.
 * Consumer hanya membaca BeatProvider.
 * 
 * Public API Minimal:
 * - getState(currentTime)
 * - reset()
 * - isReady()
 */
export class BeatProvider {
    /**
     * Mengembalikan state beat terkini.
     * @param {number} currentTime - Waktu pemutaran saat ini
     * @returns {Object|null} BeatState
     */
    getState(currentTime) {
        throw new Error('BeatProvider.getState() must be implemented by subclass.');
    }

    /**
     * Mereset provider.
     */
    reset() {
        throw new Error('BeatProvider.reset() must be implemented by subclass.');
    }

    /**
     * Memeriksa apakah provider siap untuk dikonsumsi.
     * @returns {boolean}
     */
    isReady() {
        throw new Error('BeatProvider.isReady() must be implemented by subclass.');
    }
}
