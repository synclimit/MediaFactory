/**
 * BaseRepository
 *
 * Shared repository base class. All repositories extend this.
 * Provides standard CRUD operations via a StorageProvider.
 *
 * Rules:
 * - UI never calls repositories directly.
 * - Services call repositories.
 * - Repositories call storage providers.
 */

export class BaseRepository {
  /**
   * @param {import('../storage/StorageProvider.js').StorageProvider} provider
   * @param {string} collection - Collection/table name
   */
  constructor(provider, collection) {
    this.provider = provider;
    this.collection = collection;
  }

  /**
   * Get all records.
   * @returns {Promise<Array>}
   */
  async getAll() {
    return this.provider.getAll(this.collection);
  }

  /**
   * Get a record by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    return this.provider.getById(this.collection, id);
  }

  /**
   * Insert a new record.
   * @param {Object} record
   * @returns {Promise<Object>}
   */
  async insert(record) {
    return this.provider.insert(this.collection, record);
  }

  /**
   * Update a record by ID.
   * @param {string} id
   * @param {Object} changes
   * @returns {Promise<Object>}
   */
  async update(id, changes) {
    const result = await this.provider.update(this.collection, id, changes);
    if (this.collection === 'm2_sources') {
      console.log('SOURCE_AFTER_SAVE', JSON.stringify({
        id: result.id,
        title: result.title,
        duration: result.duration,
        videoDuration: result.videoDuration,
        metadataStatus: result.metadataStatus
      }));
    }
    return result;
  }

  /**
   * Delete a record by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return this.provider.delete(this.collection, id);
  }

  /**
   * Query records by a filter function.
   * @param {Function} filterFn
   * @returns {Promise<Array>}
   */
  async query(filterFn) {
    return this.provider.query(this.collection, filterFn);
  }

  /**
   * Clear all records in this collection.
   * @returns {Promise<void>}
   */
  async clear() {
    return this.provider.clear(this.collection);
  }

  /**
   * Count all records.
   * @returns {Promise<number>}
   */
  async count() {
    const all = await this.getAll();
    return all.length;
  }
}
