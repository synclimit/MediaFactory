/**
 * BeatSourceResolver
 * 
 * Pengambil keputusan sumber BeatState.
 * Bertugas menentukan apakah sistem menggunakan RealtimeBeatProvider atau CachedBeatProvider.
 * Menangani fallback otomatis ke realtime apabila data cache belum siap.
 */
export class BeatSourceResolver {
    /**
     * @param {Object} realtimeProvider - Instance dari RealtimeBeatProvider
     * @param {Object} cachedProvider - Instance dari CachedBeatProvider
     */
    constructor(realtimeProvider = null, cachedProvider = null) {
        this.realtimeProvider = realtimeProvider;
        this.cachedProvider = cachedProvider;
        this.activeProvider = this.realtimeProvider; // Default fallback awal
    }

    /**
     * Melakukan pengecekan status kesiapan provider dan menetapkan provider aktif.
     * Prioritas: Cache (jika siap) -> Realtime (fallback) -> null.
     */
    resolve() {
        if (this.cachedProvider && this.cachedProvider.isReady()) {
            this.activeProvider = this.cachedProvider;
        } else if (this.realtimeProvider && this.realtimeProvider.isReady()) {
            this.activeProvider = this.realtimeProvider;
        } else {
            this.activeProvider = null;
        }
    }

    /**
     * Mengembalikan instance provider yang aktif berdasarkan hasil resolve() terakhir.
     * @returns {Object|null} Provider aktif
     */
    getProvider() {
        return this.activeProvider;
    }

    /**
     * Memungkinkan intervensi manual atau override provider secara paksa tanpa resolusi otomatis.
     * @param {Object} provider - Instance provider
     */
    setProvider(provider) {
        this.activeProvider = provider;
    }

    /**
     * Memaksa resolusi ulang untuk memperbarui pilihan provider aktif (misal ketika cache selesai di-load).
     */
    refresh() {
        this.resolve();
    }
}
