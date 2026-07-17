/**
 * UserService
 *
 * Manages user operations.
 * UI → UserService → UserRepository → StorageProvider
 */

import { createUser, USER_ROLES } from '../entities/index.js';

export class UserService {
  /** @param {import('../repositories/UserRepository.js').UserRepository} repo */
  constructor(repo) {
    this.repo = repo;
  }

  /** @returns {Promise<Object|null>} The local default user */
  async getLocalUser() {
    return this.repo.getLocalUser();
  }

  /** @returns {Promise<Array>} All users */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Create a new user.
   * @param {{name: string, email: string, role?: string}} params
   * @returns {Promise<Object>}
   */
  async create({ name, email, role = USER_ROLES.OWNER }) {
    const user = createUser({ name, email, role });
    return this.repo.insert(user);
  }

  /**
   * Ensure the default local user exists; create if not.
   * @returns {Promise<Object>}
   */
  async ensureLocalUser() {
    const existing = await this.getLocalUser();
    if (existing) return existing;
    return this.create({
      name: 'Local User',
      email: 'local@mediafactory.app',
      role: USER_ROLES.OWNER,
    });
  }
}
