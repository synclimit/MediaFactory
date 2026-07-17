/**
 * LocalStorageProvider
 *
 * Phase 1 storage implementation using browser localStorage.
 * Implements the StorageProvider interface.
 *
 * Future: Replace with SupabaseProvider or PostgreSQLProvider
 * without any UI or service layer changes.
 */

import { StorageProvider } from './StorageProvider.js';

const PREFIX = 'mf_';

export class LocalStorageProvider extends StorageProvider {
  /**
   * Get all records from a collection.
   * @param {string} collection
   * @returns {Promise<Array>}
   */
  async getAll(collection) {
    try {
      const data = localStorage.getItem(`${PREFIX}${collection}`);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (collection === 'm2_sources') {
        parsed.forEach(r => {
          console.log('LOCALSTORAGE_READ', JSON.stringify({
            id: r.id,
            duration: r.duration,
            videoDuration: r.videoDuration
          }));
        });
      }
      return parsed;
    } catch (e) {
      console.warn(`[LocalStorageProvider] getAll failed for "${collection}":`, e);
      return [];
    }
  }

  /**
   * Get a single record by ID.
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(collection, id) {
    try {
      const all = await this.getAll(collection);
      return all.find(r => r.id === id) || null;
    } catch (e) {
      console.warn(`[LocalStorageProvider] getById failed:`, e);
      return null;
    }
  }

  /**
   * Insert a new record.
   * @param {string} collection
   * @param {Object} record
   * @returns {Promise<Object>}
   */
  async insert(collection, record) {
    try {
      const all = await this.getAll(collection);
      all.push(record);
      localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(all));
      return record;
    } catch (e) {
      console.error(`[LocalStorageProvider] insert failed:`, e);
      throw e;
    }
  }

  /**
   * Update an existing record by ID.
   * @param {string} collection
   * @param {string} id
   * @param {Object} changes
   * @returns {Promise<Object>}
   */
  async update(collection, id, changes) {
    try {
      const all = await this.getAll(collection);
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`Record "${id}" not found in "${collection}"`);
      all[idx] = { ...all[idx], ...changes, updatedAt: new Date().toISOString() };
      localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(all));

      if (collection === 'm2_sources') {
        const persisted = all[idx];
        console.log('LOCALSTORAGE_WRITE', JSON.stringify({
          id: persisted.id,
          duration: persisted.duration,
          videoDuration: persisted.videoDuration
        }));
      }

      return all[idx];
    } catch (e) {
      console.error(`[LocalStorageProvider] update failed:`, e);
      throw e;
    }
  }

  /**
   * Delete a record by ID.
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(collection, id) {
    try {
      const all = await this.getAll(collection);
      const filtered = all.filter(r => r.id !== id);
      localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error(`[LocalStorageProvider] delete failed:`, e);
      return false;
    }
  }

  /**
   * Query records by filter function.
   * @param {string} collection
   * @param {Function} filterFn
   * @returns {Promise<Array>}
   */
  async query(collection, filterFn) {
    try {
      const all = await this.getAll(collection);
      return all.filter(filterFn);
    } catch (e) {
      console.warn(`[LocalStorageProvider] query failed:`, e);
      return [];
    }
  }

  /**
   * Clear all records from a collection.
   * @param {string} collection
   * @returns {Promise<void>}
   */
  async clear(collection) {
    try {
      localStorage.removeItem(`${PREFIX}${collection}`);
    } catch (e) {
      console.warn(`[LocalStorageProvider] clear failed:`, e);
    }
  }

  /**
   * Debug: Get all stored collection names.
   * @returns {string[]}
   */
  getStoredCollections() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        keys.push(key.replace(PREFIX, ''));
      }
    }
    return keys;
  }
}

// Singleton instance shared across repositories
export const localStorageProvider = new LocalStorageProvider();
