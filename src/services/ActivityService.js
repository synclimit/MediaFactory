/**
 * ActivityService
 *
 * Centralized activity logging service.
 * Every important action in the app must log through this service.
 *
 * Examples:
 * - Created Project
 * - Started Render
 * - Completed Render
 * - Loaded Preset
 * - Deleted Queue Item
 * - Save Template
 *
 * UI → ActivityService → ActivityRepository → StorageProvider
 */

import { createActivityLog } from '../entities/index.js';

export class ActivityService {
  /** @param {import('../repositories/ActivityRepository.js').ActivityRepository} repo */
  constructor(repo) {
    this.repo = repo;
  }

  /**
   * Log an activity.
   * @param {{workspaceId: string, userId: string, projectId?: string, action: string, details?: Object}} params
   * @returns {Promise<Object>}
   */
  async log({ workspaceId, userId, projectId = null, action, details = null }) {
    const entry = createActivityLog({ workspaceId, userId, projectId, action, details });
    return this.repo.insert(entry);
  }

  /**
   * Get recent logs for a workspace.
   * @param {string} workspaceId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRecent(workspaceId, limit = 50) {
    return this.repo.getByWorkspace(workspaceId, limit);
  }

  /**
   * Get all logs.
   * @returns {Promise<Array>}
   */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Get logs for a specific project.
   * @param {string} projectId
   * @returns {Promise<Array>}
   */
  async getByProject(projectId) {
    return this.repo.getByProject(projectId);
  }
}
