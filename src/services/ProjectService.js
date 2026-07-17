/**
 * ProjectService
 *
 * Manages project operations.
 * UI → ProjectService → ProjectRepository → StorageProvider
 */

import { createProject, PROJECT_STATUS } from '../entities/index.js';

export class ProjectService {
  /**
   * @param {import('../repositories/ProjectRepository.js').ProjectRepository} repo
   * @param {import('./ActivityService.js').ActivityService} activityService
   */
  constructor(repo, activityService) {
    this.repo = repo;
    this.activityService = activityService;
  }

  /** @returns {Promise<Array>} All projects */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Get projects for a workspace.
   * @param {string} workspaceId
   * @returns {Promise<Array>}
   */
  async getByWorkspace(workspaceId) {
    return this.repo.getByWorkspace(workspaceId);
  }

  /**
   * Create a new project.
   * @param {{workspaceId: string, name: string, description?: string, createdBy: string}} params
   * @returns {Promise<Object>}
   */
  async create({ workspaceId, name, description = '', createdBy }) {
    const project = createProject({ workspaceId, name, description, createdBy });
    const saved = await this.repo.insert(project);

    // Log activity
    if (this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId: createdBy,
        projectId: saved.id,
        action: 'Created Project',
        details: { name },
      });
    }
    return saved;
  }

  /**
   * Update a project.
   * @param {string} id
   * @param {Object} changes
   * @returns {Promise<Object>}
   */
  async update(id, changes) {
    return this.repo.update(id, changes);
  }

  /**
   * Archive a project.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async archive(id) {
    return this.repo.update(id, { status: PROJECT_STATUS.ARCHIVED });
  }

  /**
   * Delete a project.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return this.repo.delete(id);
  }
}
