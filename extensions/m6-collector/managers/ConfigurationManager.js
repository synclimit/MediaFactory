/**
 * Purpose: Manages default and user configurable settings for the extension.
 * Public API: load(), get(key), set(key, val), getAll()
 * Future Dependencies: None
 * Current Dependencies: StorageManager, Logger
 * Initialization Flow: Called during startup sequence.
 * Example Usage:
 *   await ConfigurationManager.load();
 *   const devMode = ConfigurationManager.get('developerMode');
 */

import { StorageManager } from './StorageManager.js';
import { Logger } from './Logger.js';

const DEFAULT_SETTINGS = {
  developerMode: false,
  toastEnabled: true,
  soundEnabled: false,
  autoAcceptDownloadConfirmation: true,
  downloadConfirmationDelayMs: 1000,
  shortcuts: {
    quickCollect: 'Ctrl+Q',
    quickDownload: 'Ctrl+Shift+Q',
    openCollector: 'Ctrl+Alt+Q'
  },
  featureFlags: {
    supportsCollect: true,
    supportsDownload: true,
    supportsCanonical: true
  }
};

class ConfigurationManagerService {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  async load() {
    const stored = await StorageManager.load('settings', 'userConfig', null);
    if (stored) {
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...stored,
        shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...(stored.shortcuts || {}) },
        featureFlags: { ...DEFAULT_SETTINGS.featureFlags, ...(stored.featureFlags || {}) }
      };
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      await this.save();
    }

    Logger.setDeveloperMode(this.settings.developerMode);
    return this.settings;
  }

  async save() {
    await StorageManager.save('settings', 'userConfig', this.settings);
  }

  get(key) {
    return this.settings[key];
  }

  async set(key, value) {
    this.settings[key] = value;
    if (key === 'developerMode') {
      Logger.setDeveloperMode(Boolean(value));
    }
    await this.save();
  }

  getAll() {
    return { ...this.settings };
  }
}

export const ConfigurationManager = new ConfigurationManagerService();
