/**
 * Purpose: Tracks extension versions and handles schema migration hooks.
 * Public API: checkVersion(), getCurrentVersion(), getPreviousVersion()
 * Future Dependencies: Migration scripts
 * Current Dependencies: StorageManager, Logger
 * Initialization Flow: Called during startup sequence.
 * Example Usage:
 *   const { migrationNeeded } = await VersionManager.checkVersion('1.0.0');
 */

import { StorageManager } from './StorageManager.js';
import { Logger } from './Logger.js';

const SCHEMA_VERSION = 1;

class VersionManagerService {
  constructor() {
    this.currentVersion = '1.0.0';
    this.previousVersion = null;
    this.migrationRequired = false;
  }

  async checkVersion(manifestVersion = '1.0.0') {
    this.currentVersion = manifestVersion;
    const storedInfo = await StorageManager.load('settings', 'versionInfo', {
      version: null,
      schemaVersion: 0
    });

    this.previousVersion = storedInfo.version;

    if (!this.previousVersion || storedInfo.schemaVersion < SCHEMA_VERSION) {
      this.migrationRequired = true;
      Logger.info(
        `Migration required from schema ${storedInfo.schemaVersion} to ${SCHEMA_VERSION}`
      );
    } else {
      this.migrationRequired = false;
    }

    return {
      currentVersion: this.currentVersion,
      previousVersion: this.previousVersion,
      migrationRequired: this.migrationRequired
    };
  }

  async finishMigration() {
    await StorageManager.save('settings', 'versionInfo', {
      version: this.currentVersion,
      schemaVersion: SCHEMA_VERSION,
      updatedAt: Date.now()
    });
    this.migrationRequired = false;
    Logger.info('Version migration finished successfully');
  }

  getCurrentVersion() {
    return this.currentVersion;
  }

  getPreviousVersion() {
    return this.previousVersion;
  }
}

export const VersionManager = new VersionManagerService();
