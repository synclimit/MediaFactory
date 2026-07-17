/**
 * BeatPlaybackDispatcher
 * 
 * Pengatur distribusi BeatState berdasarkan waktu (timeline).
 * Menjadi satu-satunya entry point runtime bagi seluruh consumer.
 * Mendistribusikan BeatState dari BeatProvider kepada consumer tanpa melakukan DSP.
 */
export class BeatPlaybackDispatcher {
    /**
     * @param {Object} provider - Instance dari BeatProvider
     */
    constructor(provider = null) {
        this.provider = provider;
        this.currentState = null;
        this.currentTime = 0;
    }

    /**
     * Mengatur atau mengganti provider saat runtime.
     * @param {Object} provider - Instance dari BeatProvider
     */
    setProvider(provider) {
        this.provider = provider;
        this.reset();
    }

    /**
     * Mengambil BeatState berdasarkan currentTime dan mengatur sinkronisasi.
     * Dipanggil pada loop utama (seperti requestAnimationFrame).
     * @param {number} currentTime - Waktu pemutaran audio saat ini
     */
    update(currentTime) {
        this.currentTime = currentTime;
        
        if (this.provider && this.provider.isReady()) {
            this.currentState = this.provider.getState(currentTime);
        } else {
            this.currentState = null;
        }
    }

    /**
     * Mengembalikan state beat terkini yang telah didistribusikan.
     * API ini identik untuk Preview maupun Render.
     * @returns {Object|null} BeatState
     */
    getState() {
        return this.currentState;
    }

    /**
     * Melakukan sinkronisasi timeline ke titik waktu tertentu.
     * @param {number} time - Titik waktu tujuan
     */
    seek(time) {
        this.currentTime = time;
        // Jika provider mendukung operasi seek spesifik (misal cache), teruskan ke provider
        if (this.provider && typeof this.provider.seek === 'function') {
            this.provider.seek(time);
        }
        // Pastikan state segera ter-update setelah seek
        this.update(time);
    }

    /**
     * Mereset status internal dispatcher dan mendelegasikan reset ke provider.
     */
    reset() {
        this.currentState = null;
        this.currentTime = 0;
        if (this.provider) {
            this.provider.reset();
        }
    }

    /**
     * Memeriksa kesiapan dispatcher (jika provider tersedia dan siap).
     * @returns {boolean}
     */
    isReady() {
        return !!this.provider && this.provider.isReady();
    }
}
