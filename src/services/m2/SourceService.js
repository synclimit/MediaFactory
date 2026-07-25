/**
 * M2 SourceService
 *
 * Business logic for the Source Pool.
 *
 * Responsibilities:
 * - Import audio files (with path validation + duplicate detection)
 * - Import folders (recursive scan → multiple sources)
 * - Import YouTube URLs (Task 01: store only)
 * - Fetch YouTube metadata (Task 02: simulated async fetch)
 * - Remove sources
 * - Clear entire Source Pool
 * - Source statistics (including metadata lifecycle counts)
 *
 * Rules:
 * - Duplicate local paths are silently skipped
 * - Duplicate YouTube URLs are silently skipped
 * - Invalid sources are still added with status = invalid
 * - All meaningful actions are logged via ActivityService
 *
 * UI → SourceService → SourceRepository → StorageProvider
 */

import {
  createAudioFileSource,
  createFolderAudioSource,
  createYouTubeSource,
  simulateFolderScan,
  SOURCE_TYPE,
  SOURCE_STATUS,
  METADATA_STATUS,
  sumTotalDuration,
  formatDuration,
} from '../../entities/m2/SourceEntity.js';

import { cleanYoutubeTitle } from '../../entities/m2/CleanerRules.js';

export class SourceService extends EventTarget {
  /**
   * @param {import('../../repositories/m2/SourceRepository.js').SourceRepository} repo
   * @param {import('../ActivityService.js').ActivityService} activityService
   */
  constructor(repo, activityService) {
    super();
    this.repo = repo;
    this.activityService = activityService;
  }

  _notify() {
    console.log(`NOTIFY_EMITTED\nevent=sources_updated`);
    this.getAll().then(all => {
      this.dispatchEvent(new Event('sources_updated'));
    });
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /** @returns {Promise<Array>} All sources in the pool */
  async getAll() {
    return this.repo.getAll();
  }

  /** @returns {Promise<Array>} Ready sources only */
  async getReady() {
    return this.repo.getReadySources();
  }

  /** @returns {Promise<Object>} Statistics about the current source pool */
  async getStats() {
    const all = await this.repo.getAll();
    const folders = [...new Set(
      all.filter(s => s.sourceType === SOURCE_TYPE.FOLDER_AUDIO && s.folderPath)
         .map(s => s.folderPath)
    )];
    const invalid = all.filter(s => s.status === SOURCE_STATUS.INVALID);
    const totalDurationSec = sumTotalDuration(all);

    // YouTube metadata lifecycle counts
    const ytSources = all.filter(s => s.sourceType === SOURCE_TYPE.YOUTUBE_URL);

    return {
      total: all.length,
      audioFileCount: all.filter(s => s.sourceType === SOURCE_TYPE.AUDIO_FILE).length,
      folderTrackCount: all.filter(s => s.sourceType === SOURCE_TYPE.FOLDER_AUDIO).length,
      folderCount: folders.length,
      youtubeCount: ytSources.length,
      invalidCount: invalid.length,
      readyCount: all.filter(s => s.status === SOURCE_STATUS.READY).length,
      pendingCount: all.filter(s => s.status === SOURCE_STATUS.PENDING).length,
      totalDurationSec,
      totalDurationFormatted: formatDuration(totalDurationSec),
      // Metadata lifecycle (Task 02)
      metadataPendingCount:  ytSources.filter(s => s.metadataStatus === METADATA_STATUS.PENDING).length,
      metadataFetchingCount: ytSources.filter(s => s.metadataStatus === METADATA_STATUS.FETCHING).length,
      metadataReadyCount:    ytSources.filter(s => s.metadataStatus === METADATA_STATUS.READY).length,
      metadataFailedCount:   ytSources.filter(s => s.metadataStatus === METADATA_STATUS.FAILED).length,
    };
  }

  // ─── Import: Audio File ────────────────────────────────────────────────────

  /**
   * Import a single audio file into the Source Pool.
   * Skips silently if the path already exists (duplicate prevention).
   *
   * @param {string} filePath - File system path to the audio file
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<{source: Object, skipped: boolean, reason: string|null}>}
   */
  async importAudioFile(filePath, context = {}) {
    // Duplicate check
    if (filePath && await this.repo.existsByPath(filePath)) {
      return { source: null, skipped: true, reason: 'Duplicate path — file already in pool.' };
    }

    const source = createAudioFileSource(filePath);
    const saved = await this.repo.insert(source);

    // Activity log
    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Imported Audio File',
        details: { title: saved.title, path: filePath, status: saved.status },
      });
    }

    this._notify();
    return { source: saved, skipped: false, reason: null };
  }

  // ─── Import: Folder ────────────────────────────────────────────────────────

  /**
   * Import a folder — recursively scans for audio files and adds each as a source.
   * Skips files that are already in the pool.
   * Returns all sources added.
   *
   * @param {string} folderPath - Folder path
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<{added: Array, skipped: number}>}
   */
  async importFolder(folderPath, context = {}) {
    let filePaths = [];
    const res = await fetch('/api/m2/folder/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath.trim() })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.files) filePaths = data.files;
    } else {
      throw new Error("Backend API /api/m2/folder/scan failed. Please restart your backend server!");
    }

    const added = [];
    let skipped = 0;

    const getAudioDuration = (filePath) => new Promise(resolve => {
        const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
        const audio = new Audio(fileUrl);
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
        audio.addEventListener('error', () => resolve(0));
        setTimeout(() => resolve(0), 1000);
    });

    for (const filePath of filePaths) {
      // Duplicate check per file
      if (await this.repo.existsByPath(filePath)) {
        skipped++;
        continue;
      }
      const durationSec = await getAudioDuration(filePath);
      const source = createFolderAudioSource(filePath, folderPath, durationSec);
      const saved = await this.repo.insert(source);
      added.push(saved);
    }

    // Activity log (one log per folder, not per file)
    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Imported Folder',
        details: {
          folderPath,
          tracksFound: filePaths.length,
          tracksAdded: added.length,
          tracksSkipped: skipped,
        },
      });
    }

    if (added.length > 0) this._notify();
    return { added, skipped };
  }

  // ─── Import: YouTube URL ───────────────────────────────────────────────────

  /**
   * Add a YouTube URL to the Source Pool.
   * Task 01: Stores URL only. No download. No metadata fetch.
   * Status = pending (until Task 02 fetches metadata).
   * Skips silently if URL already exists.
   *
   * @param {string} url - YouTube URL
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<{source: Object, skipped: boolean, reason: string|null}>}
   */
  async addYouTubeUrl(url, context = {}) {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl) {
       return { source: null, skipped: true, reason: 'URL cannot be empty.' };
    }
    console.log(`ADD_URL_START\nurl=${trimmedUrl}`);
    
    const all = await this.repo.getAll();
    const existing = all.find(s => s.youtubeUrl === trimmedUrl);
    
    if (existing) {
      // Re-create the youtube source to get a fresh entity, but keep the ID
      const freshSource = createYouTubeSource(trimmedUrl);
      const updated = await this.repo.update(existing.id, {
        ...freshSource,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      });
      
      if (this.activityService && context.workspaceId) {
        await this.activityService.log({
          workspaceId: context.workspaceId,
          userId: context.userId || '',
          action: 'Updated YouTube URL',
          details: { url: trimmedUrl, youtubeId: updated.youtubeId, status: updated.status },
        });
      }
      
      console.log(`CREATE_SOURCE_SUCCESS\nid=${updated.id}`);
      console.log(`REPO_INSERT_SUCCESS\nid=${updated.id}`);

      this._notify();
      return { source: updated, skipped: false, reason: 'Replaced stale state for existing URL.' };
    }

    const source = createYouTubeSource(trimmedUrl);
    console.log(`CREATE_SOURCE_SUCCESS\nid=${source.id}`);

    let saved;
    try {
      saved = await this.repo.insert(source);
      console.log('--- Step 2 ---');
      console.log('insert success');
      console.log('stored entity:', JSON.stringify(saved, null, 2));
    } catch(err) {
      console.log('--- Step 2 ---');
      console.log('insert failure:', err.message);
      throw err;
    }

    // Activity log
    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Added YouTube URL',
        details: { url: trimmedUrl, youtubeId: saved.youtubeId, status: saved.status },
      });
    }

    this._notify();
    return { source: saved, skipped: false, reason: null };
  }

  // ─── Remove ────────────────────────────────────────────────────────────────

  /**
   * Remove a source from the pool by ID.
   * @param {string} id
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<boolean>}
   */
  async removeSource(id, context = {}) {
    const source = await this.repo.getById(id);
    const result = await this.repo.delete(id);

    if (result && this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Removed Source',
        details: { id, title: source?.title },
      });
    }
    if (result) this._notify();
    return result;
  }

  /**
   * Remove multiple sources by IDs.
   * @param {string[]} ids
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<number>} Count of removed sources
   */
  async removeSources(ids, context = {}) {
    let count = 0;
    for (const id of ids) {
      const ok = await this.repo.delete(id);
      if (ok) count++;
    }

    if (count > 0 && this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Removed Sources',
        details: { count, ids },
      });
    }
    if (count > 0) this._notify();
    return count;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Update the clean title of a source.
   * @param {string} id
   * @param {string} cleanTitle
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<Object>}
   */
  async updateCleanTitle(id, cleanTitle, context = {}) {
    const updated = await this.repo.update(id, {
      cleanTitle: cleanTitle.trim(),
      updatedAt: new Date().toISOString()
    });

    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Updated Clean Title',
        details: { id, oldTitle: updated.title, newCleanTitle: updated.cleanTitle },
      });
    }

    this._notify();
    return updated;
  }

  // ─── Metadata Fetch (Task 02) ────────────────────────────────────────────────

  /**
   * Fetch YouTube metadata for a single source.
   *
   * Lifecycle:
   *   pending → fetching → ready (on success)
   *                      → failed (on error)
   *
   * On success:
   *   - Sets videoTitle, channelName, videoDuration, thumbnailUrl
   *   - Updates title to videoTitle
   *   - Updates duration to formatted string
   *   - Sets source.status = 'ready'
   *   - Sets metadataStatus = 'ready'
   *
   * On failure:
   *   - Sets metadataStatus = 'failed'
   *   - Sets metadataError with message
   *   - source.status remains 'pending'
   *
   * @param {string} id - Source entity ID
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<{source: Object, success: boolean, error: string|null}>}
   */
  async fetchMetadata(id, context = {}) {
    const source = await this.repo.getById(id);

    if (!source) {
      return { source: null, success: false, error: 'Source not found.' };
    }
    if (source.sourceType !== SOURCE_TYPE.YOUTUBE_URL) {
      return { source, success: false, error: 'Source is not a YouTube URL.' };
    }
    if (source.status === SOURCE_STATUS.INVALID) {
      return { source, success: false, error: 'Source URL is invalid.' };
    }
    if (!source.youtubeId) {
      return { source, success: false, error: 'No YouTube video ID found.' };
    }

    // Log: Fetch Metadata
    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Fetch Metadata',
        details: { id, youtubeId: source.youtubeId, url: source.youtubeUrl },
      });
    }

    // Set status to 'fetching'
    const fetchingUpdate = {
      metadataStatus: METADATA_STATUS.FETCHING,
      metadataProgressText: 'Launching yt-dlp...',
      metadataError: null,
      updatedAt: new Date().toISOString(),
    };
    await this.repo.update(id, fetchingUpdate);
    this._notify();

    let progressInterval = null;
    try {
      let stage = 0;
      const stages = [
        'Connecting to YouTube...',
        'Downloading Metadata...'
      ];
      progressInterval = setInterval(async () => {
        if (stage < stages.length) {
          await this.repo.update(id, { metadataProgressText: stages[stage] });
          this._notify();
          stage++;
        }
      }, 2000);

      const res = await fetch('/api/m2/yt-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: source.youtubeUrl })
      });
      
      clearInterval(progressInterval);
      
      if (!res.ok) {
        let errStr = 'Unable to retrieve YouTube metadata.';
        try {
           const errBody = await res.json();
           if (errBody.error) errStr = errBody.error;
        } catch(e) {}
        throw new Error(errStr);
      }

      await this.repo.update(id, { metadataProgressText: 'Parsing Response...' });
      this._notify();

      const meta = await res.json();

      console.log('METADATA_FETCH_RESULT', JSON.stringify({
        videoTitle: meta.videoTitle,
        duration: meta.duration || null,
        videoDuration: meta.videoDuration,
        provider: meta.provider
      }));

      const durationStr = meta.videoDuration
        ? formatDuration(meta.videoDuration)
        : null;

      let finalStatus = METADATA_STATUS.READY;
      let finalProgressText = 'Metadata Ready';
      let finalSourceStatus = SOURCE_STATUS.READY;
      let metadataError = null;

      if (!meta.videoDuration || isNaN(meta.videoDuration)) {
        finalStatus = METADATA_STATUS.FAILED;
        finalProgressText = 'Duration Unavailable';
        finalSourceStatus = SOURCE_STATUS.FAILED;
        metadataError = 'Duration unavailable';
      }

      const { videoTitle, cleanTitle } = cleanYoutubeTitle(meta.videoTitle);

      const successUpdate = {
        rawVideoTitle:  videoTitle,
        normalizedTitle: cleanTitle,
        channelName:    meta.channelName,
        videoDuration:  meta.videoDuration,
        thumbnailUrl:   meta.thumbnailUrl,
        // Promote normalized title to UI display fields
        title:          cleanTitle,
        cleanTitle:     cleanTitle,
        rawTitle:       videoTitle,
        titleSource:    'youtube',
        duration:       durationStr,
        metadataStatus: finalStatus,
        metadataProgressText: finalProgressText,
        metadataFetchedAt: new Date().toISOString(),
        metadataProvider: meta.provider,
        metadataError:  metadataError,
        status:         finalSourceStatus,
        updatedAt:      new Date().toISOString(),
      };

      console.log('SOURCE_BEFORE_SAVE', JSON.stringify({
        id: id,
        title: successUpdate.title,
        duration: successUpdate.duration,
        videoDuration: successUpdate.videoDuration,
        metadataStatus: successUpdate.metadataStatus
      }));

      const updatedSource = await this.repo.update(id, successUpdate);

      console.log('LOG:');
      console.log('id=' + updatedSource.id);
      console.log('title=' + updatedSource.title);
      console.log('videoTitle=' + updatedSource.videoTitle);
      console.log('duration=' + updatedSource.duration);
      console.log('videoDuration=' + updatedSource.videoDuration);
      console.log('metadataStatus=' + updatedSource.metadataStatus);

      // Log: Metadata Success
      if (this.activityService && context.workspaceId) {
        await this.activityService.log({
          workspaceId: context.workspaceId,
          userId: context.userId || '',
          action: 'Metadata Success',
          details: {
            id,
            youtubeId: source.youtubeId,
            videoTitle: meta.videoTitle,
            channelName: meta.channelName,
            duration: durationStr,
            provider: meta.provider
          },
        });
      }

      this._notify();
      return { source: updatedSource, success: true, error: null };

    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      const errMsg = err?.message || 'Unable to retrieve YouTube metadata.';

      const failedUpdate = {
        metadataStatus: METADATA_STATUS.FAILED,
        metadataError:  errMsg,
        metadataProgressText: null,
        updatedAt:      new Date().toISOString(),
      };
      const failedSource = await this.repo.update(id, failedUpdate);

      // Log: Metadata Failed
      if (this.activityService && context.workspaceId) {
        await this.activityService.log({
          workspaceId: context.workspaceId,
          userId: context.userId || '',
          action: 'Metadata Failed',
          details: { id, youtubeId: source.youtubeId, error: errMsg },
        });
      }

      this._notify();
      return { source: failedSource, success: false, error: errMsg };
    }
  }

  /**
   * Fetch metadata for multiple YouTube sources in sequence.
   * Non-YouTube sources in the list are silently skipped.
   *
   * @param {string[]} ids - Array of source IDs
   * @param {{workspaceId: string, userId: string}} context
   * @param {(progress: {done: number, total: number, current: Object}) => void} [onProgress]
   * @returns {Promise<{succeeded: number, failed: number, skipped: number}>}
   */
  async fetchMetadataBulk(ids, context = {}, onProgress) {
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    const total = ids.length;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const source = await this.repo.getById(id);

      if (!source || source.sourceType !== SOURCE_TYPE.YOUTUBE_URL) {
        skipped++;
        if (onProgress) onProgress({ done: i + 1, total, current: source });
        continue;
      }

      const { success } = await this.fetchMetadata(id, context);
      if (success) succeeded++;
      else failed++;

      if (onProgress) {
        const updated = await this.repo.getById(id);
        onProgress({ done: i + 1, total, current: updated });
      }
    }

    return { succeeded, failed, skipped };
  }

  // ─── Template Source Restoration ───────────────────────────────────────────

  /**
   * Restore sources from a Fixed Template.
   * @param {Array} fixedSources
   * @param {{workspaceId: string, userId: string}} context
   */
  async restoreTemplateSources(fixedSources, context = {}) {
    for (const src of fixedSources) {
      if (src.sourceType === SOURCE_TYPE.YOUTUBE_URL) {
        if (!await this.repo.existsByYouTubeUrl(src.youtubeUrl)) {
          const source = createYouTubeSource(src.youtubeUrl);
          await this.repo.insert(source);
        }
      } else {
        const source = createSource({
          sourceType: src.sourceType,
          title: src.title,
          status: SOURCE_STATUS.INVALID,
          validationErrors: ['Unlinked Source: Please relink the file.'],
          isUnlinked: true,
        });
        await this.repo.insert(source);
      }
    }
    
    if (this.activityService && context.workspaceId && fixedSources.length > 0) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Restored Template Sources',
        details: { count: fixedSources.length },
      });
    }

    this._notify();
  }

  /**
   * Relink an unlinked source with a new valid file path
   * @param {string} id
   * @param {string} newPath
   * @param {{workspaceId: string, userId: string}} context
   */
  async relinkSource(id, newPath, context = {}) {
    const source = await this.repo.getById(id);
    if (!source || !source.isUnlinked) return false;
    
    const valid = createAudioFileSource(newPath);
    
    await this.repo.update(id, {
      localPath: valid.localPath,
      title: valid.title, // Might want to keep the old cleanTitle, but we reset the base title
      status: valid.status,
      validationErrors: valid.validationErrors,
      isUnlinked: false,
      updatedAt: new Date().toISOString()
    });
    
    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Relinked Source',
        details: { id, newPath },
      });
    }
    this._notify();
    return true;
  }

  // ─── Clear ─────────────────────────────────────────────────────────────────

  /**
   * Clear the entire Source Pool.
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<void>}
   */
  async clearPool(context = {}) {
    await this.repo.clearAll();

    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Cleared Source Pool',
        details: { clearedAt: new Date().toISOString() },
      });
    }
    this._notify();
  }
}
