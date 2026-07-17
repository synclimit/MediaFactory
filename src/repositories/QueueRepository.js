import { BaseRepository } from './BaseRepository.js';

export class QueueRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'queue_jobs');
  }

  /** @returns {Promise<Array>} Jobs for a workspace */
  async getByWorkspace(workspaceId) {
    return this.query(j => j.workspaceId === workspaceId);
  }

  /** @returns {Promise<Array>} Jobs with a given status */
  async getByStatus(status) {
    return this.query(j => j.status === status);
  }

  /** @returns {Promise<Array>} Pending and Failed jobs (eligible for render) */
  async getPendingJobs() {
    return this.query(j => j.status === 'Pending' || j.status === 'Failed');
  }
}
