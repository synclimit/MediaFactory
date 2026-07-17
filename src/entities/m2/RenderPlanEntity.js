/**
 * M2 Render Plan Entity
 *
 * Represents a prepared render job configuration.
 * This is a planning object only — no rendering, no FFmpeg, no files.
 *
 * Created by RenderPlanPanel when user clicks "Prepare Render".
 * Consumed later by the Queue Engine (future task).
 */

import { generateId } from '../index.js';

// ─── Render Plan Status ───────────────────────────────────────────────────────

export const RENDER_PLAN_STATUS = Object.freeze({
  READY:   'ready',   // Plan is current and valid
  STALE:   'stale',   // A dependency (mix/profile) has changed
});

// ─── Render Name Generator ────────────────────────────────────────────────────

/**
 * Derive a render name from a list of tracks and a naming pattern.
 * Mirrors Mode 2 naming conventions without requiring NamingEngine.
 *
 * @param {Array<{title: string}>} tracks
 * @param {string} namingPattern - e.g. 'Title A', 'Title A x Title B', ...
 * @param {string} customPattern - used when pattern is 'Custom'
 * @returns {string}
 */
export function deriveRenderName(tracks, namingPattern, customPattern = '') {
  console.log('NAMING_PATTERN_SELECTED', namingPattern);
  console.log('RENDER_NAME_INPUT_TRACKS', 
    tracks?.map(t => ({
      title: t.title,
      videoTitle: t.videoTitle
    }))
  );

  if (!tracks || tracks.length === 0) {
    console.log('RENDER_NAME_RESULT', 'Untitled Mix');
    return 'Untitled Mix';
  }

  const clean = (t) => (t?.cleanTitle || t?.title || 'Unknown').replace(/\.[^/.]+$/, '').trim();

  let renderName = clean(tracks[0]);

  switch (namingPattern) {
    case 'Title A':
      renderName = `${clean(tracks[0])}`;
      break;

    case 'Title A x Title B':
      renderName = tracks.length >= 2
        ? `${clean(tracks[0])} x ${clean(tracks[1])}`
        : `${clean(tracks[0])}`;
      break;

    case 'Title A x Title B x Title C':
      if (tracks.length >= 3)
        renderName = `${clean(tracks[0])} x ${clean(tracks[1])} x ${clean(tracks[2])}`;
      else if (tracks.length === 2)
        renderName = `${clean(tracks[0])} x ${clean(tracks[1])}`;
      else
        renderName = `${clean(tracks[0])}`;
      break;

    case 'Custom':
      renderName = customPattern?.trim() || clean(tracks[0]);
      break;

    default:
      renderName = clean(tracks[0]);
      break;
  }

  console.log('RENDER_NAME_RESULT', renderName);
  return renderName;
}

// ─── Render Plan Factory ──────────────────────────────────────────────────────

/**
 * Create a RenderPlan object from compilation result + audio profile + naming.
 *
 * @param {Object} opts
 * @param {string}   opts.renderName       - Derived output name
 * @param {string}   opts.outputFolder     - Target output directory path
 * @param {number}   opts.trackCount       - Number of selected tracks
 * @param {number}   opts.totalDurationSec - Numeric duration in seconds
 * @param {string}   opts.totalDurationFormatted - Human-readable duration string
 * @param {string}   opts.audioProfile     - Audio preset name (e.g. 'Neutral', 'Bright')
 * @param {string}   opts.namingPattern    - The active naming pattern
 * @param {Array}    opts.trackList        - [{order, id, title, duration}]
 * @returns {Object} RenderPlan
 */
export function createRenderPlan({
  renderName,
  outputFolder,
  trackCount,
  totalDurationSec,
  totalDurationFormatted,
  audioProfile,
  namingPattern,
  trackList,
}) {
  const now = new Date().toISOString();
  return {
    renderId:               generateId('rp'),
    renderName:             renderName || 'Untitled Mix',
    outputFolder:           outputFolder || 'D:\\MediaFactory\\Output',
    trackCount:             trackCount ?? 0,
    totalDurationSec:       totalDurationSec ?? 0,
    totalDurationFormatted: totalDurationFormatted || '—',
    audioProfile:           audioProfile || 'Neutral',
    namingPattern:          namingPattern || 'Title A',
    trackList:              trackList ?? [],
    status:                 RENDER_PLAN_STATUS.READY,
    createdAt:              now,
    updatedAt:              now,
  };
}

// ─── Render Plan Hash ─────────────────────────────────────────────────────────

/**
 * Generate a stable hex hash for a render plan (for dev mode display).
 * @param {Object} plan
 * @returns {string}
 */
export function computeRenderPlanHash(plan) {
  if (!plan) return 'empty';
  const key = `${plan.renderId}:${plan.totalDurationSec}:${plan.trackCount}:${plan.audioProfile}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, '0');
}
