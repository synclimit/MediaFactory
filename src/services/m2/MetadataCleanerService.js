/**
 * M2 MetadataCleanerService
 *
 * Orchestrates the Metadata Cleaner pipeline:
 *   Source Pool → Raw Title extraction → cleanTitle() → persist to SourceRepository
 *
 * Also owns naming settings state (pattern + djPrefix + custom prefix/suffix).
 * NamingEngine generates previews from this service's current settings.
 *
 * Responsibilities:
 * - cleanSource(id)    — clean a single source's title
 * - cleanAll()         — clean all sources in the pool
 * - getCleanedSources() — return sources that have a cleanTitle
 * - updateNamingSettings(settings) — update pattern/djPrefix/prefix/suffix
 * - generatePreview(sources) — live preview list for current settings
 * - getStats()         — raw/clean counts + pattern info
 *
 * Activity Logging:
 * - "Metadata Cleaned"      — on cleanSource / cleanAll
 * - "Naming Pattern Changed" — on pattern update
 * - "Prefix Changed"        — on custom prefix/suffix update
 *
 * UI → MetadataCleanerService → SourceRepository → StorageProvider
 */

import { cleanTitle, TITLE_SOURCE } from '../../entities/m2/CleanerRules.js';
import { SOURCE_TYPE } from '../../entities/m2/SourceEntity.js';
import {
  NAMING_PATTERN,
  DEFAULT_NAMING_SETTINGS,
  generateLivePreview,
  generateOutputNames,
} from './NamingEngine.js';

export class MetadataCleanerService {
  /**
   * @param {import('../../repositories/m2/SourceRepository.js').SourceRepository} sourceRepo
   * @param {import('../ActivityService.js').ActivityService} activityService
   */
  constructor(sourceRepo, activityService) {
    this.sourceRepo = sourceRepo;
    this.activityService = activityService;

    // Naming settings — owned by this service, persisted to localStorage via key below
    this._namingSettings = { ...DEFAULT_NAMING_SETTINGS };
    this._loadNamingSettings();
  }

  // ─── Naming Settings Persistence ──────────────────────────────────────────

  _settingsKey() { return 'mf_m2_naming_settings'; }

  _loadNamingSettings() {
    try {
      const raw = localStorage.getItem(this._settingsKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        this._namingSettings = { ...DEFAULT_NAMING_SETTINGS, ...parsed };
      }
    } catch { /* ignore parse errors */ }
  }

  _saveNamingSettings() {
    try {
      localStorage.setItem(this._settingsKey(), JSON.stringify(this._namingSettings));
    } catch { /* quota exceeded etc. */ }
  }

  /** @returns {Object} current naming settings */
  getNamingSettings() {
    return { ...this._namingSettings };
  }

  /**
   * Update naming settings.
   * @param {Partial<typeof DEFAULT_NAMING_SETTINGS>} updates
   * @param {{workspaceId: string, userId: string}} context
   */
  async updateNamingSettings(updates, context = {}) {
    const prev = { ...this._namingSettings };
    this._namingSettings = { ...this._namingSettings, ...updates };
    this._saveNamingSettings();

    // Activity logging
    if (this.activityService && context.workspaceId) {
      const actions = [];

      if (updates.pattern !== undefined && updates.pattern !== prev.pattern) {
        actions.push(this.activityService.log({
          workspaceId: context.workspaceId,
          userId: context.userId || '',
          action: 'Naming Pattern Changed',
          details: { from: prev.pattern, to: updates.pattern },
        }));
      }

      if (
        (updates.customPrefix !== undefined && updates.customPrefix !== prev.customPrefix) ||
        (updates.customSuffix !== undefined && updates.customSuffix !== prev.customSuffix) ||
        (updates.djPrefix !== undefined && updates.djPrefix !== prev.djPrefix)
      ) {
        actions.push(this.activityService.log({
          workspaceId: context.workspaceId,
          userId: context.userId || '',
          action: 'Prefix Changed',
          details: {
            djPrefix: this._namingSettings.djPrefix,
            customPrefix: this._namingSettings.customPrefix,
            customSuffix: this._namingSettings.customSuffix,
          },
        }));
      }

      await Promise.all(actions);
    }

    return this.getNamingSettings();
  }

  // ─── Title Extraction ──────────────────────────────────────────────────────

  /**
   * Get the best available "raw title" from a source for cleaning input.
   * Priority: videoTitle (after YT fetch) → title → localPath basename → 'Unknown'
   *
   * @param {Object} source
   * @returns {{ rawTitle: string, titleSource: string }}
   */
  _extractRawTitle(source) {
    // YouTube source with fetched metadata: use videoTitle
    if (source.sourceType === SOURCE_TYPE.YOUTUBE_URL && source.videoTitle) {
      return { rawTitle: source.videoTitle, titleSource: TITLE_SOURCE.YOUTUBE };
    }
    // Any source with a title set
    if (source.title && source.title !== 'Unknown Source') {
      const src = source.sourceType === SOURCE_TYPE.YOUTUBE_URL
        ? TITLE_SOURCE.YOUTUBE
        : TITLE_SOURCE.PATH;
      return { rawTitle: source.title, titleSource: src };
    }
    // Fallback
    return { rawTitle: source.title || 'Unknown', titleSource: TITLE_SOURCE.FALLBACK };
  }

  // ─── Clean: Single Source ──────────────────────────────────────────────────

  /**
   * Clean metadata for a single source by ID.
   * Persists rawTitle + cleanTitle + titleSource back to the repository.
   *
   * @param {string} id - Source entity ID
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<{source: Object, cleanTitle: string, rawTitle: string}>}
   */
  async cleanSource(id, context = {}) {
    const source = await this.sourceRepo.getById(id);
    if (!source) throw new Error(`Source "${id}" not found.`);

    const { rawTitle, titleSource } = this._extractRawTitle(source);
    const clean = cleanTitle(rawTitle);

    const updates = {
      // Preserve original rawTitle (never overwrite once set)
      rawTitle: source.rawTitle || rawTitle,
      cleanTitle: clean,
      titleSource,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.sourceRepo.update(id, updates);

    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Metadata Cleaned',
        details: { id, rawTitle, cleanTitle: clean, titleSource },
      });
    }

    return { source: updated, cleanTitle: clean, rawTitle };
  }

  // ─── Clean: All Sources ────────────────────────────────────────────────────

  /**
   * Clean metadata for all sources in the pool.
   * @param {{workspaceId: string, userId: string}} context
   * @returns {Promise<{cleaned: number, skipped: number, results: Array}>}
   */
  async cleanAll(context = {}) {
    const all = await this.sourceRepo.getAll();
    const results = [];
    let cleaned = 0;
    let skipped = 0;

    for (const source of all) {
      if (source.status === 'invalid') { skipped++; continue; }
      try {
        const result = await this.cleanSource(source.id, {});  // No individual activity logs
        results.push(result);
        cleaned++;
      } catch { skipped++; }
    }

    // One combined activity log
    if (this.activityService && context.workspaceId) {
      await this.activityService.log({
        workspaceId: context.workspaceId,
        userId: context.userId || '',
        action: 'Metadata Cleaned',
        details: { cleaned, skipped, total: all.length },
      });
    }

    return { cleaned, skipped, results };
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /** @returns {Promise<Array>} All sources from the pool */
  async getAllSources() {
    return this.sourceRepo.getAll();
  }

  /** @returns {Promise<Array>} Sources that have a cleanTitle */
  async getCleanedSources() {
    const all = await this.sourceRepo.getAll();
    return all.filter(s => s.cleanTitle !== null && s.cleanTitle !== undefined);
  }

  // ─── Live Preview ──────────────────────────────────────────────────────────

  /**
   * Generate a live output name preview list from current sources + current settings.
   * Sources without a cleanTitle use their title as fallback.
   *
   * @param {number} maxPreview - Max entries (default 6)
   * @returns {Promise<string[]>} - List of output names
   */
  async generatePreview(maxPreview = 6) {
    const all = await this.sourceRepo.getAll();
    const cleaned = all
      .filter(s => s.status !== 'invalid')
      .map(s => ({
        id: s.id,
        rawTitle: s.rawTitle || s.title || '',
        cleanTitle: s.cleanTitle || s.title || '',
      }));

    return generateLivePreview(cleaned, this._namingSettings.pattern, this._namingSettings, maxPreview);
  }

  /**
   * Generate full output names for all cleaned sources.
   * @returns {Promise<Array>}
   */
  async generateAllOutputNames() {
    const all = await this.sourceRepo.getAll();
    const cleaned = all
      .filter(s => s.cleanTitle)
      .map(s => ({
        id: s.id,
        rawTitle: s.rawTitle || s.title || '',
        cleanTitle: s.cleanTitle || '',
      }));

    return generateOutputNames(cleaned, this._namingSettings.pattern, this._namingSettings);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  /**
   * @returns {Promise<Object>} Cleaner statistics
   */
  async getStats() {
    const all = await this.sourceRepo.getAll();
    const withRaw    = all.filter(s => s.rawTitle !== null && s.rawTitle !== undefined);
    const withClean  = all.filter(s => s.cleanTitle !== null && s.cleanTitle !== undefined);
    const bySource   = {
      path:     withClean.filter(s => s.titleSource === TITLE_SOURCE.PATH).length,
      youtube:  withClean.filter(s => s.titleSource === TITLE_SOURCE.YOUTUBE).length,
      fallback: withClean.filter(s => s.titleSource === TITLE_SOURCE.FALLBACK).length,
    };

    return {
      total:         all.length,
      rawTitleCount: withRaw.length,
      cleanTitleCount: withClean.length,
      uncleaned:     all.length - withClean.length,
      byTitleSource: bySource,
      pattern:       this._namingSettings.pattern,
      djPrefix:      this._namingSettings.djPrefix,
      customPrefix:  this._namingSettings.customPrefix,
      customSuffix:  this._namingSettings.customSuffix,
    };
  }
}
