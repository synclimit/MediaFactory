import { BaseRepository } from './BaseRepository.js';

export class TemplateRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'templates');
  }

  /** @returns {Promise<Array>} Templates for a workspace */
  async getByWorkspace(workspaceId) {
    return this.query(t => t.workspaceId === workspaceId);
  }

  /** @returns {Promise<Array>} Templates by type (thumbnail|audio|naming) */
  async getByType(type) {
    return this.query(t => t.type === type);
  }
}
