class BeatCacheManager {
    constructor() {
        this._cache = null;
        this._playbackIdx = 0;
        this._key = null;
        this._db = null;
        this._initDB();
    }

    _initDB() {
        return new Promise((resolve, reject) => {
            if (this._db) return resolve(this._db);
            if (typeof indexedDB === 'undefined') return resolve(null);
            const req = indexedDB.open('m3_analysis_cache', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('caches')) {
                    db.createObjectStore('caches', { keyPath: 'key' });
                }
            };
            req.onsuccess = (e) => {
                this._db = e.target.result;
                resolve(this._db);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────────

    /**
     * Load an AnalysisCache for the given key.
     * Verifies hash before returning. Returns null if cache is missing or stale.
     * @param {string} key      typically the audio file path or ID
     * @param {string} hash     SHA-256 of the audio file
     * @returns {Promise<object|null>} AnalysisCache
     */
    async load(key, hash) {
        await this._initDB();
        return new Promise((resolve, reject) => {
            const tx = this._db.transaction('caches', 'readonly');
            const store = tx.objectStore('caches');
            const req = store.get(key);
            req.onsuccess = () => {
                const entry = req.result;
                if (!entry) {
                    resolve(null);
                    return;
                }
                
                // Update last accessed
                entry.lastAccessedAt = Date.now();
                const txUpdate = this._db.transaction('caches', 'readwrite');
                txUpdate.objectStore('caches').put(entry);

                if (entry.cache.audioHash !== hash) {
                    this.invalidate(key);
                    resolve(null);
                } else {
                    this._cache = entry.cache;
                    this._key = key;
                    this.reset();
                    resolve(entry.cache);
                }
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Persist an AnalysisCache.
     * @param {string}        key
     * @param {object} cache
     * @returns {Promise<void>}
     */
    async save(key, cache) {
        await this._initDB();
        return new Promise((resolve, reject) => {
            const tx = this._db.transaction('caches', 'readwrite');
            const store = tx.objectStore('caches');
            const req = store.put({
                key,
                cache,
                lastAccessedAt: Date.now()
            });
            req.onsuccess = () => {
                this._cache = cache;
                this._key = key;
                this.reset();
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Mark a cache as invalid and remove it from storage.
     * @param {string} key
     * @returns {Promise<void>}
     */
    async invalidate(key) {
        await this._initDB();
        if (this._key === key) {
            this._cache = null;
            this._key = null;
        }
        return new Promise((resolve, reject) => {
            const tx = this._db.transaction('caches', 'readwrite');
            const store = tx.objectStore('caches');
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Verify that the stored cache hash matches the provided hash.
     * @param {string} key
     * @param {string} hash
     * @returns {Promise<boolean>}
     */
    async verifyHash(key, hash) {
        await this._initDB();
        return new Promise((resolve) => {
            const tx = this._db.transaction('caches', 'readonly');
            const store = tx.objectStore('caches');
            const req = store.get(key);
            req.onsuccess = () => {
                const entry = req.result;
                resolve(entry ? entry.cache.audioHash === hash : false);
            };
            req.onerror = () => resolve(false);
        });
    }

    // ── Playback Reads (synchronous — only valid after load()) ────────────────────

    /**
     * Get the beat event at exact index position.
     * @param {number} index
     * @returns {object|null} BeatEvent
     */
    getBeat(index) {
        if (!this._cache || !this._cache.events) return null;
        if (index < 0 || index >= this._cache.events.length) return null;
        return this._cache.events[index];
    }

    /**
     * Get the beat event nearest to a given playback time.
     * Search is O(log N) via binary search on sorted events array.
     * @param {number} timeSeconds
     * @param {number} [toleranceSeconds=0.05]
     * @returns {object|null} BeatEvent
     */
    getNearestBeat(timeSeconds, toleranceSeconds = 0.05) {
        if (!this._cache || !this._cache.events || this._cache.events.length === 0) return null;
        
        const evs = this._cache.events;
        let left = 0;
        let right = evs.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (evs[mid].time === timeSeconds) return evs[mid];
            if (evs[mid].time < timeSeconds) left = mid + 1;
            else right = mid - 1;
        }
        
        let nearestIdx = left;
        if (left >= evs.length) nearestIdx = evs.length - 1;
        else if (right >= 0 && (timeSeconds - evs[right].time < evs[left].time - timeSeconds)) {
            nearestIdx = right;
        }

        const nearest = evs[nearestIdx];
        if (Math.abs(nearest.time - timeSeconds) <= toleranceSeconds) {
            return nearest;
        }
        return null;
    }

    /**
     * Get all beat events in a time range [startSeconds, endSeconds].
     * @param {number} startSeconds
     * @param {number} endSeconds
     * @returns {object[]} BeatEvents
     */
    getRange(startSeconds, endSeconds) {
        if (!this._cache || !this._cache.events) return [];
        const evs = this._cache.events;
        
        let startIdx = 0;
        let left = 0;
        let right = evs.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (evs[mid].time < startSeconds) left = mid + 1;
            else right = mid - 1;
        }
        startIdx = left;

        let endIdx = evs.length - 1;
        left = 0;
        right = evs.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (evs[mid].time > endSeconds) right = mid - 1;
            else left = mid + 1;
        }
        endIdx = right;

        if (startIdx <= endIdx) {
            return evs.slice(startIdx, endIdx + 1);
        }
        return [];
    }

    // ── Playback State ────────────────────────────────────────────────────────────

    /**
     * Reset the sequential playback pointer to the beginning.
     */
    reset() {
        this._playbackIdx = 0;
    }

    /**
     * Seek to the first event at or after seekTimeSeconds.
     * @param {number} seekTimeSeconds
     */
    seek(seekTimeSeconds) {
        if (!this._cache || !this._cache.events) return;
        const evs = this._cache.events;
        let left = 0;
        let right = evs.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (evs[mid].time < seekTimeSeconds) left = mid + 1;
            else right = mid - 1;
        }
        this._playbackIdx = left;
    }

    /**
     * Helper to read sequentially (used by BeatCachePlayer).
     */
    tickSequential(timeSeconds) {
        if (!this._cache || !this._cache.events) return null;
        const evs = this._cache.events;
        if (this._playbackIdx < evs.length && timeSeconds >= evs[this._playbackIdx].time) {
            const ev = evs[this._playbackIdx];
            this._playbackIdx++;
            return ev;
        }
        return null;
    }

    // ── Diagnostics ───────────────────────────────────────────────────────────────

    /**
     * Returns metadata about the current loaded cache.
     * @returns {object|null}
     */
    getInfo() {
        if (!this._cache) return null;
        return {
            key: this._key,
            hash: this._cache.audioHash,
            eventCount: this._cache.events ? this._cache.events.length : 0,
            bpm: this._cache.bpm,
            duration: this._cache.duration,
            sizeBytes: 0, // Not calculated
            version: this._cache.version
        };
    }
}

export const beatCacheManager = new BeatCacheManager();
