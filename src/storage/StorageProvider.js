/**
 * StorageProvider Interface
 *
 * All storage providers must implement this interface.
 * Changing the provider (LocalStorage → Supabase → PostgreSQL)
 * must NOT require any UI or service layer changes.
 *
 * Rules:
 * - Repositories use providers. Never call localStorage directly.
 * - Services use repositories. Never call providers directly.
 * - UI uses services. Never calls repositories or providers.
 */

export class StorageProvider {
  /**
   * Get all records from a collection.
   * @param {string} collection - Collection/table name
   * @returns {Promise<Array>}
   */
  async getAll(collection) {
    throw new Error(`StorageProvider.getAll() not implemented for collection: ${collection}`);
  }

  /**
   * Get a single record by ID.
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(collection, id) {
    throw new Error(`StorageProvider.getById() not implemented`);
  }

  /**
   * Insert a new record.
   * @param {string} collection
   * @param {Object} record
   * @returns {Promise<Object>} The inserted record
   */
  async insert(collection, record) {
    throw new Error(`StorageProvider.insert() not implemented`);
  }

  /**
   * Update an existing record by ID.
   * @param {string} collection
   * @param {string} id
   * @param {Object} changes - Partial update fields
   * @returns {Promise<Object>} The updated record
   */
  async update(collection, id, changes) {
    throw new Error(`StorageProvider.update() not implemented`);
  }

  /**
   * Delete a record by ID.
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(collection, id) {
    throw new Error(`StorageProvider.delete() not implemented`);
  }

  /**
   * Query records by a filter function.
   * @param {string} collection
   * @param {Function} filterFn - (record) => boolean
   * @returns {Promise<Array>}
   */
  async query(collection, filterFn) {
    throw new Error(`StorageProvider.query() not implemented`);
  }

  /**
   * Clear all records from a collection.
   * @param {string} collection
   * @returns {Promise<void>}
   */
  async clear(collection) {
    throw new Error(`StorageProvider.clear() not implemented`);
  }
}
