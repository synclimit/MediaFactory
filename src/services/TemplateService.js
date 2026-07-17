/**
 * TemplateService
 *
 * Manages shared templates across the workspace.
 * UI → TemplateService → TemplateRepository → StorageProvider
 */

import { createTemplate, TEMPLATE_TYPES } from '../entities/index.js';

export class TemplateService {
  /**
   * @param {import('../repositories/TemplateRepository.js').TemplateRepository} repo
   * @param {import('./ActivityService.js').ActivityService} activityService
   */
  constructor(repo, activityService) {
    this.repo = repo;
    this.activityService = activityService;
  }

  /** @returns {Promise<Array>} All templates */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Get templates by type.
   * @param {'thumbnail'|'audio'|'naming'} type
   * @returns {Promise<Array>}
   */
  async getByType(type) {
    return this.repo.getByType(type);
  }

  /**
   * Save a new template (or overwrite by name).
   * @param {{workspaceId: string, name: string, type: string, config: Object, createdBy: string}} params
   * @returns {Promise<Object>}
   */
  async save({ workspaceId, name, type = TEMPLATE_TYPES.THUMBNAIL, config = {}, createdBy }) {
    // Check for existing by name
    const all = await this.repo.getAll();
    const existing = all.find(t => t.name.toLowerCase() === name.toLowerCase() && t.type === type);

    let saved;
    if (existing) {
      saved = await this.repo.update(existing.id, { config });
    } else {
      const tpl = createTemplate({ workspaceId, name, type, config, createdBy });
      saved = await this.repo.insert(tpl);
    }

    if (this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId: createdBy,
        action: 'Save Template',
        details: { name, type },
      });
    }
    return saved;
  }

  /**
   * Load a template by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async load(id) {
    return this.repo.getById(id);
  }

  /**
   * Delete a template.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return this.repo.delete(id);
  }
}
