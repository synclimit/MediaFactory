/**
 * PresetService
 *
 * Manages audio, video, and render presets.
 * UI → PresetService → PresetRepository → StorageProvider
 */

import { createPreset, PRESET_TYPES } from '../entities/index.js';

export class PresetService {
  /**
   * @param {import('../repositories/PresetRepository.js').PresetRepository} repo
   * @param {import('./ActivityService.js').ActivityService} activityService
   */
  constructor(repo, activityService) {
    this.repo = repo;
    this.activityService = activityService;
  }

  /** @returns {Promise<Array>} All presets */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Get presets by type.
   * @param {'audio'|'video'|'render'} type
   * @returns {Promise<Array>}
   */
  async getByType(type) {
    return this.repo.getByType(type);
  }

  /**
   * Save a new preset.
   * @param {{workspaceId: string, name: string, type: string, config: Object, createdBy: string}} params
   * @returns {Promise<Object>}
   */
  async save({ workspaceId, name, type = PRESET_TYPES.RENDER, config = {}, createdBy }) {
    const preset = createPreset({ workspaceId, name, type, config, createdBy });
    const saved = await this.repo.insert(preset);

    if (this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId: createdBy,
        action: 'Load Preset',
        details: { name, type },
      });
    }
    return saved;
  }

  /**
   * Delete a preset.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return this.repo.delete(id);
  }
}
