/**
 * Purpose: Single access layer for chrome.storage.local with namespace support.
 * Public API: load(ns, key), save(ns, key, val), update(ns, key, fn), remove(ns, key), clear(ns)
 * Future Dependencies: None
 * Current Dependencies: Logger
 * Initialization Flow: Standalone instantiation or singleton.
 * Example Usage:
 *   await StorageManager.save('queue', 'items', []);
 */

import { Logger } from './Logger.js';

const VALID_NAMESPACES = new Set([
  'queue',
  'settings',
  'statistics',
  'developer',
  'activity',
  'cache'
]);

class StorageManagerService {
  constructor() {
    this.memoryFallback = new Map();
  }

  _getKey(namespace, key) {
    if (!VALID_NAMESPACES.has(namespace)) {
      throw new Error(`Invalid storage namespace: ${namespace}`);
    }
    return key ? `${namespace}:${key}` : namespace;
  }

  _getStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local;
    }
    return null;
  }

  async load(namespace, key = null, defaultValue = null) {
    const fullKey = this._getKey(namespace, key);
    const storage = this._getStorage();

    if (!storage) {
      const val = this.memoryFallback.get(fullKey);
      return val !== undefined ? val : defaultValue;
    }

    return new Promise((resolve) => {
      storage.get([fullKey], (result) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          Logger.error('StorageManager load error:', chrome.runtime.lastError);
          resolve(defaultValue);
          return;
        }
        const val = result[fullKey];
        resolve(val !== undefined ? val : defaultValue);
      });
    });
  }

  async save(namespace, key, value) {
    const fullKey = this._getKey(namespace, key);
    const storage = this._getStorage();

    if (!storage) {
      this.memoryFallback.set(fullKey, value);
      return true;
    }

    return new Promise((resolve) => {
      storage.set({ [fullKey]: value }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          Logger.error('StorageManager save error:', chrome.runtime.lastError);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  async update(namespace, key, updaterFn, defaultValue = null) {
    const current = await this.load(namespace, key, defaultValue);
    const updated = await updaterFn(current);
    await this.save(namespace, key, updated);
    return updated;
  }

  async remove(namespace, key) {
    const fullKey = this._getKey(namespace, key);
    const storage = this._getStorage();

    if (!storage) {
      this.memoryFallback.delete(fullKey);
      return true;
    }

    return new Promise((resolve) => {
      storage.remove([fullKey], () => {
        resolve(true);
      });
    });
  }

  async clearNamespace(namespace) {
    if (!VALID_NAMESPACES.has(namespace)) {
      return false;
    }
    const prefix = `${namespace}:`;
    const storage = this._getStorage();

    if (!storage) {
      for (const k of this.memoryFallback.keys()) {
        if (k.startsWith(prefix)) {
          this.memoryFallback.delete(k);
        }
      }
      return true;
    }

    return new Promise((resolve) => {
      storage.get(null, (all) => {
        const keysToRemove = Object.keys(all || {}).filter((k) =>
          k.startsWith(prefix)
        );
        storage.remove(keysToRemove, () => resolve(true));
      });
    });
  }
}

export const StorageManager = new StorageManagerService();
