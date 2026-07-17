import { BaseRepository } from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'users');
  }

  /** @returns {Promise<Object|null>} The default local user */
  async getLocalUser() {
    const all = await this.getAll();
    return all[0] || null;
  }

  /** @returns {Promise<Array>} Users filtered by role */
  async getByRole(role) {
    return this.query(u => u.role === role);
  }
}
