/**
 * SettingsService
 *
 * Manages application, workspace, and user settings.
 * UI → SettingsService → SettingsRepository → StorageProvider
 */

import { createSetting, SETTINGS_SCOPE } from '../entities/index.js';

export class SettingsService {
  /** @param {import('../repositories/SettingsRepository.js').SettingsRepository} repo */
  constructor(repo) {
    this.repo = repo;
  }

  /**
   * Get a setting value by key.
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    const setting = await this.repo.getByKey(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Set a setting value. Creates or updates.
   * @param {string} key
   * @param {*} value
   * @param {'app'|'workspace'|'user'} scope
   * @returns {Promise<Object>}
   */
  async set(key, value, scope = SETTINGS_SCOPE.APP) {
    const existing = await this.repo.getByKey(key);
    if (existing) {
      return this.repo.update(existing.id, { value });
    }
    const setting = createSetting({ key, value, scope });
    return this.repo.insert(setting);
  }

  /**
   * Get all settings for a given scope.
   * @param {'app'|'workspace'|'user'} scope
   * @returns {Promise<Array>}
   */
  async getByScope(scope) {
    return this.repo.getByScope(scope);
  }

  /**
   * Delete a setting by key.
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    const existing = await this.repo.getByKey(key);
    if (!existing) return false;
    return this.repo.delete(existing.id);
  }

  /** @returns {Promise<Array>} All settings */
  async getAll() {
    return this.repo.getAll();
  }
}
