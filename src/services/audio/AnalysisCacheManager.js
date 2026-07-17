import { CacheState } from './BeatCacheModel';
import { storageAdapter } from './StorageAdapter';
import './MemoryDriver'; // Auto-inject MemoryDriver ke StorageAdapter
import { WhisperCacheRoot } from '../analysis/whisper/WhisperCacheModel';

/**
 * MF-204B: Analysis Cache Manager
 * 
 * Orchestrator resmi untuk seluruh sistem cache (Beat, Whisper, Waveform, dll).
 * Mengelola siklus hidup (lifecycle), validasi, registrasi, dan akses memori.
 * Berinteraksi dengan cache melalui kontrak model abstrak (CacheRoot).
 * Saat ini belum terhubung dengan Storage Adapter (akan ditambahkan di sprint selanjutnya).
 */
class AnalysisCacheManager {
    constructor() {
        // Registry in-memory memetakan 'type' (e.g. 'beat_cache') ke instance CacheRoot
        this.caches = new Map();
        
        // Mendaftarkan Whisper Cache sebagai domain resmi di dalam Analysis Cache Infrastructure (MF-206D)
        this.registerCache('whisper_cache', new WhisperCacheRoot());
    }

    // ── Cache Registry & Access ───────────────────────────────────────────────

    /**
     * Daftarkan cache ke dalam orchestrator.
     * @param {string} type Tipe skema (contoh: 'beat_cache')
     * @param {Object} cache Objek cache yang mewarisi kontrak CacheRoot
     * @returns {boolean}
     */
    registerCache(type, cache) {
        if (!type || !cache) {
            throw new Error("AnalysisCacheManager: Type or Cache instance cannot be null.");
        }
        this.caches.set(type, cache);
        return true;
    }

    /**
     * Lepaskan registrasi cache dari orchestrator.
     * @param {string} type 
     * @returns {boolean}
     */
    unregisterCache(type) {
        return this.caches.delete(type);
    }

    /**
     * Ambil referensi objek cache aktif berdasarkan tipe.
     * @param {string} type 
     * @returns {Object|null}
     */
    getCache(type) {
        return this.caches.get(type) || null;
    }

    /**
     * Periksa apakah suatu tipe cache sudah terdaftar.
     * @param {string} type 
     * @returns {boolean}
     */
    hasCache(type) {
        return this.caches.has(type);
    }

    // ── Cache Lifecycle & Status ──────────────────────────────────────────────

    /**
     * Ambil state status terkini dari tipe cache tertentu.
     * @param {string} type 
     * @returns {string|null}
     */
    getCacheState(type) {
        const cache = this.caches.get(type);
        if (!cache) return null;
        return cache.state;
    }

    /**
     * Memvalidasi keaslian hash audio. 
     * Jika cocok, state dinaikkan menjadi READY. Jika gagal, INVALID.
     * @param {string} type 
     * @param {string} currentAudioHash Hash dari audio buffer file yang sedang diputar
     * @returns {boolean} True jika valid
     */
    validateCache(type, currentAudioHash) {
        const cache = this.caches.get(type);
        if (!cache || !cache.header) return false;

        if (cache.header.audioHash === currentAudioHash) {
            if (typeof cache.setState === 'function') {
                cache.setState(CacheState.READY);
            }
            return true;
        } else {
            this.invalidate(type);
            return false;
        }
    }

    /**
     * Menurunkan (downgrade) status cache menjadi INVALID karena korup/stale.
     * @param {string} type 
     * @returns {boolean}
     */
    invalidate(type) {
        const cache = this.caches.get(type);
        if (cache && typeof cache.setState === 'function') {
            cache.setState(CacheState.INVALID);
            return true;
        }
        return false;
    }

    /**
     * Memberi tanda PURGED dan menghancurkan eksistensi cache dari registry.
     * @param {string} type 
     * @returns {boolean}
     */
    purge(type) {
        const cache = this.caches.get(type);
        if (cache) {
            if (typeof cache.setState === 'function') {
                cache.setState(CacheState.PURGED);
            }
            this.caches.delete(type);
            return true;
        }
        return false;
    }

    /**
     * Purge paksa seluruh cache (Semua tipe).
     */
    clear() {
        for (const [type, cache] of this.caches.entries()) {
            if (cache && typeof cache.setState === 'function') {
                cache.setState(CacheState.PURGED);
            }
        }
        this.caches.clear();
    }

    // ── Storage Operations (Mocks for Next Sprint) ────────────────────────────

    /**
     * Meminta Storage Adapter untuk memuat data permanen.
     * @param {string} type 
     * @param {string} key Key identitas unik (misal: audioHash)
     * @returns {Promise<Object|null>}
     */
    async loadCache(type, key) {
        if (!key) {
            console.warn(`AnalysisCacheManager: loadCache('${type}') memerlukan key identitas (contoh: audioHash).`);
            return null;
        }
        
        const cacheData = await storageAdapter.load(type, key);
        if (cacheData) {
            this.caches.set(type, cacheData);
        }
        return cacheData || null;
    }

    /**
     * Meminta Storage Adapter untuk menulis data ke persistent storage.
     * @param {string} type 
     * @returns {Promise<boolean>}
     */
    async saveCache(type) {
        const cache = this.caches.get(type);
        if (!cache) {
            console.warn(`AnalysisCacheManager: Tidak ada instance di memori untuk saveCache('${type}').`);
            return false;
        }
        
        return await storageAdapter.save(type, cache);
    }
}

export const analysisCacheManager = new AnalysisCacheManager();
export default AnalysisCacheManager;
