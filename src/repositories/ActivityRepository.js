import { BaseRepository } from './BaseRepository.js';

export class ActivityRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'activity_logs');
  }

  /** @returns {Promise<Array>} Logs for a workspace, newest first */
  async getByWorkspace(workspaceId, limit = 100) {
    const logs = await this.query(l => l.workspaceId === workspaceId);
    return logs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /** @returns {Promise<Array>} Logs for a specific project */
  async getByProject(projectId) {
    return this.query(l => l.projectId === projectId);
  }

  /** @returns {Promise<Array>} Logs for a specific user */
  async getByUser(userId) {
    return this.query(l => l.userId === userId);
  }
}
