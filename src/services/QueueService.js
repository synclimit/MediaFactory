/**
 * QueueService
 *
 * Foundation-level queue service. Safe integration point.
 * Does NOT replace or interfere with M1's existing queue state.
 *
 * This is the architectural registration layer for future migration.
 * M1 queue logic in App.jsx remains untouched.
 *
 * UI → QueueService → QueueRepository → StorageProvider
 */

import { createQueueJob, QUEUE_JOB_STATUS } from '../entities/index.js';

export class QueueService {
  /**
   * @param {import('../repositories/QueueRepository.js').QueueRepository} repo
   * @param {import('./ActivityService.js').ActivityService} activityService
   */
  constructor(repo, activityService) {
    this.repo = repo;
    this.activityService = activityService;
  }

  /** @returns {Promise<Array>} All queue jobs */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Get queue jobs for a workspace.
   * @param {string} workspaceId
   * @returns {Promise<Array>}
   */
  async getByWorkspace(workspaceId) {
    return this.repo.getByWorkspace(workspaceId);
  }

  /**
   * Register a queue job in the foundation layer.
   * NOTE: This is separate from M1's in-memory queue state.
   * @param {{workspaceId: string, projectId?: string, createdBy: string, mode: string, payload: Object}} params
   * @returns {Promise<Object>}
   */
  async register({ workspaceId, projectId = null, createdBy, mode, payload = {} }) {
    const job = createQueueJob({ workspaceId, projectId, createdBy, mode, payload });
    const saved = await this.repo.insert(job);

    if (this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId: createdBy,
        projectId,
        action: 'Create Queue Item',
        details: { mode, jobId: saved.id },
      });
    }
    return saved;
  }

  /**
   * Update a job's status.
   * @param {string} id
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    return this.repo.update(id, { status });
  }

  /**
   * Delete a queue job.
   * @param {string} id
   * @param {string} workspaceId
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async delete(id, workspaceId, userId) {
    const result = await this.repo.delete(id);
    if (result && this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId,
        action: 'Delete Queue Item',
        details: { jobId: id },
      });
    }
    return result;
  }

  /**
   * Get pending jobs ready for processing.
   * @returns {Promise<Array>}
   */
  async getPending() {
    return this.repo.getPendingJobs();
  }
}
