/**
 * M2 Cache Manager MVP
 *
 * Simulates caching tracks exclusively as MP3.
 * Persists cache metadata to localStorage.
 */

class CacheManager {
  constructor() {
    this.storageKey = 'mediafactory_m2_cache';
    this.cache = this._load();
  }

  _load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  _save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
  }

  /**
   * Resolve a track URI to a streaming endpoint.
   * Vite plugin handles caching/streaming natively.
   */
  async resolveTrack(uri) {
    if (!uri) throw new Error('Cannot resolve empty URI');
    return `/api/m2/stream?uri=${encodeURIComponent(uri)}`;
  }

  _hashUri(uri) {
    let h = 0;
    for (let i = 0; i < uri.length; i++) h = (Math.imul(31, h) + uri.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).padStart(8, '0');
  }

  getStats() {
    const keys = Object.keys(this.cache);
    return {
      cacheFileCount: keys.length,
      cacheSize: keys.length * 4.5, // simulate 4.5 MB per file
    };
  }
}

export const m2CacheManager = new CacheManager();
