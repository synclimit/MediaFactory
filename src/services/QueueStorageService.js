/**
 * QueueStorageService.js
 * High-performance, quota-immune storage service using native browser IndexedDB.
 * Completely immune to localStorage 5MB quota errors (can store gigabytes of project data and thumbnails).
 * Provides dual-layer persistence: IndexedDB (Primary) + sanitized LocalStorage (Fallback).
 */

const DB_NAME = 'MediaFactoryStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'pipeline_store';

class QueueStorageService {
  constructor() {
    this._dbPromise = this._initDB();
  }

  _initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => {
          console.warn('[QueueStorageService] IndexedDB open error, using localStorage fallback:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('[QueueStorageService] IndexedDB init caught error:', err);
        resolve(null);
      }
    });
  }

  async _get(key) {
    const db = await this._dbPromise;
    if (!db) {
      return this._fallbackGet(key);
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result !== undefined && req.result !== null) {
            resolve(req.result);
          } else {
            resolve(this._fallbackGet(key));
          }
        };
        req.onerror = () => resolve(this._fallbackGet(key));
      } catch (e) {
        resolve(this._fallbackGet(key));
      }
    });
  }

  async _set(key, val) {
    // 1. Try writing to IndexedDB first
    const db = await this._dbPromise;
    if (db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(val, key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn('[QueueStorageService] IndexedDB write failed:', e);
      }
    }

    // 2. Also write sanitized copy to localStorage as lightweight fallback
    this._fallbackSet(key, val);
  }

  _fallbackGet(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  _fallbackSet(key, val) {
    try {
      // Strip massive base64 thumbnails if any before saving to localStorage to prevent QuotaExceededError
      if (Array.isArray(val)) {
        const sanitized = val.map(item => {
          if (item && item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.length > 5000) {
            return { ...item, thumbnail: undefined };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(sanitized));
      } else {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (e) {
      // Silently catch quota exceeded errors in fallback layer
    }
  }

  // --- Active Queue API ---

  async loadQueue() {
    try {
      const data = await this._get('pipeline_queue');
      if (Array.isArray(data)) {
        return data.map(job => {
          // Reset stale transient statuses to 'Waiting'
          if (['Rendering', 'Processing', 'Downloading', 'Converting', 'Splitting', 'Running'].includes(job.status)) {
            return { ...job, status: 'Waiting', progress: 0, backendJobId: undefined, error: null, failureReason: null };
          }
          return job;
        });
      }
    } catch (e) {
      console.error('[QueueStorageService] Error loading queue:', e);
    }
    return [];
  }

  async saveQueue(queue) {
    if (!Array.isArray(queue)) return;
    try {
      await this._set('pipeline_queue', queue);
    } catch (e) {
      console.error('[QueueStorageService] Error saving queue:', e);
    }
  }

  async clearQueue() {
    await this._set('pipeline_queue', []);
  }

  // --- Render History API ---

  async loadHistory() {
    try {
      const data = await this._get('render_history');
      if (Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.error('[QueueStorageService] Error loading history:', e);
    }
    return [];
  }

  async saveHistory(history) {
    if (!Array.isArray(history)) return;
    try {
      await this._set('render_history', history);
    } catch (e) {
      console.error('[QueueStorageService] Error saving history:', e);
    }
  }

  async addHistoryEntry(entry) {
    if (!entry) return;
    try {
      const history = await this.loadHistory();
      const existingIdx = history.findIndex(h => h.id === entry.id || (entry.jobId && h.jobId === entry.jobId));
      if (existingIdx !== -1) {
        history[existingIdx] = { ...history[existingIdx], ...entry };
      } else {
        history.unshift(entry);
      }
      const capped = history.slice(0, 2000);
      await this.saveHistory(capped);
      return capped;
    } catch (e) {
      console.error('[QueueStorageService] Error adding history entry:', e);
    }
  }

  async deleteHistoryEntry(id) {
    try {
      const history = await this.loadHistory();
      const filtered = history.filter(h => h.id !== id && h.jobId !== id);
      await this.saveHistory(filtered);
      return filtered;
    } catch (e) {
      console.error('[QueueStorageService] Error deleting history entry:', e);
    }
  }

  async clearHistory() {
    await this._set('render_history', []);
  }
}

export const queueStorageService = new QueueStorageService();
