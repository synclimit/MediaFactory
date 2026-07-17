/**
 * WorkspaceService
 *
 * Manages workspace operations.
 * UI → WorkspaceService → WorkspaceRepository → StorageProvider
 */

import { createWorkspace } from '../entities/index.js';

export class WorkspaceService {
  /** @param {import('../repositories/WorkspaceRepository.js').WorkspaceRepository} repo */
  constructor(repo) {
    this.repo = repo;
  }

  /** @returns {Promise<Object|null>} The current active workspace */
  async getDefault() {
    return this.repo.getDefault();
  }

  /** @returns {Promise<Array>} All workspaces */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Create a new workspace.
   * @param {{name: string, ownerId: string}} params
   * @returns {Promise<Object>}
   */
  async create({ name, ownerId }) {
    const workspace = createWorkspace({ name, ownerId });
    return this.repo.insert(workspace);
  }

  /**
   * Update workspace name.
   * @param {string} id
   * @param {string} name
   * @returns {Promise<Object>}
   */
  async rename(id, name) {
    return this.repo.update(id, { name });
  }

  /**
   * Ensure the default workspace exists; create it if not.
   * @param {string} ownerId
   * @returns {Promise<Object>}
   */
  async ensureDefault(ownerId) {
    const existing = await this.getDefault();
    if (existing) return existing;
    return this.create({ name: 'MediaFactory Workspace', ownerId });
  }
}
