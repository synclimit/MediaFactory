/**
 * M2 SourceRepository
 *
 * Data access layer for Source Pool entities.
 * Extends BaseRepository for standard CRUD.
 * Adds Source Pool-specific query methods.
 *
 * UI → SourceService → SourceRepository → StorageProvider
 */

import { BaseRepository } from '../BaseRepository.js';
import { SOURCE_TYPE, SOURCE_STATUS } from '../../entities/m2/SourceEntity.js';

export class SourceRepository extends BaseRepository {
  constructor(provider) {
    super(provider, 'm2_sources');
  }

  /**
   * Get all sources of a specific type.
   * @param {'audio_file'|'folder_audio'|'youtube_url'} type
   * @returns {Promise<Array>}
   */
  async getByType(type) {
    return this.provider.query(this.collection, s => s.sourceType === type);
  }

  /**
   * Get all audio file sources (audio_file + folder_audio).
   * @returns {Promise<Array>}
   */
  async getAudioSources() {
    return this.provider.query(this.collection, s =>
      s.sourceType === SOURCE_TYPE.AUDIO_FILE ||
      s.sourceType === SOURCE_TYPE.FOLDER_AUDIO
    );
  }

  /**
   * Get all YouTube URL sources.
   * @returns {Promise<Array>}
   */
  async getYouTubeSources() {
    return this.provider.query(this.collection, s => s.sourceType === SOURCE_TYPE.YOUTUBE_URL);
  }

  /**
   * Get all ready sources.
   * @returns {Promise<Array>}
   */
  async getReadySources() {
    return this.provider.query(this.collection, s => s.status === SOURCE_STATUS.READY);
  }

  /**
   * Get all invalid sources.
   * @returns {Promise<Array>}
   */
  async getInvalidSources() {
    return this.provider.query(this.collection, s => s.status === SOURCE_STATUS.INVALID);
  }

  /**
   * Check if a source with the given localPath already exists.
   * @param {string} localPath
   * @returns {Promise<boolean>}
   */
  async existsByPath(localPath) {
    const all = await this.getAll();
    return all.some(s => s.localPath && s.localPath === localPath);
  }

  /**
   * Check if a YouTube URL is already in the pool.
   * @param {string} youtubeUrl
   * @returns {Promise<boolean>}
   */
  async existsByYouTubeUrl(youtubeUrl) {
    const all = await this.getAll();
    return all.some(s => s.youtubeUrl && s.youtubeUrl === youtubeUrl);
  }

  /**
   * Clear all sources from the pool.
   * @returns {Promise<void>}
   */
  async clearAll() {
    return this.provider.clear(this.collection);
  }
}
