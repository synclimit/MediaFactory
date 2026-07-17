import { BaseRepository } from './BaseRepository.js';

export class PresetRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'presets');
  }

  /** @returns {Promise<Array>} Presets for a workspace */
  async getByWorkspace(workspaceId) {
    return this.query(p => p.workspaceId === workspaceId);
  }

  /** @returns {Promise<Array>} Presets by type (audio|video|render) */
  async getByType(type) {
    return this.query(p => p.type === type);
  }
}
