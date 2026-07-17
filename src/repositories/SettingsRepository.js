import { BaseRepository } from './BaseRepository.js';

export class SettingsRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'settings');
  }

  /**
   * Get a setting by key.
   * @param {string} key
   * @returns {Promise<Object|null>}
   */
  async getByKey(key) {
    const results = await this.query(s => s.key === key);
    return results[0] || null;
  }

  /**
   * Get settings by scope.
   * @param {'app'|'workspace'|'user'} scope
   * @returns {Promise<Array>}
   */
  async getByScope(scope) {
    return this.query(s => s.scope === scope);
  }
}
