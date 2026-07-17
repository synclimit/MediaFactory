import { BaseRepository } from './BaseRepository.js';

export class WorkspaceRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'workspaces');
  }

  /** @returns {Promise<Object|null>} The first (default) workspace */
  async getDefault() {
    const all = await this.getAll();
    return all[0] || null;
  }
}
