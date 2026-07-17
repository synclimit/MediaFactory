import { BaseRepository } from './BaseRepository.js';

export class ProjectRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'projects');
  }

  /** @returns {Promise<Array>} Projects for a given workspace */
  async getByWorkspace(workspaceId) {
    return this.query(p => p.workspaceId === workspaceId);
  }

  /** @returns {Promise<Array>} Projects with a given status */
  async getByStatus(status) {
    return this.query(p => p.status === status);
  }
}
