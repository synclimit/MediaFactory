/**
 * M2 Source Entity
 *
 * Represents a single imported audio source in the Source Pool.
 * Sources can be: audio files, folders (expanded to individual tracks), or YouTube URLs.
 *
 * Source Pool is the single source of truth for all M2 audio sources.
 * All future M2 engines (Metadata, Processing, Shuffle, Naming) read from Source Pool.
 */

import { generateId, SYNC_STATUS } from '../index.js';

// ─── Source Type Constants ─────────────────────────────────────────────────────

export const SOURCE_TYPE = Object.freeze({
  AUDIO_FILE:    'audio_file',    // Single audio file (mp3, wav, flac, m4a, etc.)
  FOLDER_AUDIO:  'folder_audio',  // Expanded from a folder import
  YOUTUBE_URL:   'youtube_url',   // YouTube URL (audio only, no download in Task 01)
});

export const AUDIO_EXTENSIONS = Object.freeze([
  'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma', 'opus', 'aiff', 'aif'
]);

// ─── Source Status Constants ───────────────────────────────────────────────────

export const SOURCE_STATUS = Object.freeze({
  PENDING:  'pending',   // Not yet processed / YouTube URLs awaiting metadata
  READY:    'ready',     // File validated and ready for use
  INVALID:  'invalid',   // File missing, bad path, or invalid URL
  FAILED:   'failed',    // Processing error
});

// ─── Metadata Status Constants ─────────────────────────────────────────────────
// Separate from SOURCE_STATUS — tracks YouTube metadata fetch lifecycle.

export const METADATA_STATUS = Object.freeze({
  NONE:     null,        // Not applicable (audio files, folders)
  IDLE:     'idle',      // URL added, fetch not yet triggered
  FETCHING: 'fetching',  // Fetch in progress
  READY:    'ready',     // Metadata successfully fetched
  FAILED:   'failed',    // Fetch attempt failed
});

// ─── YouTube URL Validation ────────────────────────────────────────────────────

const YT_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=[\w-]+/,
  /^https?:\/\/youtu\.be\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
];

/**
 * Validate a YouTube URL.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return YT_PATTERNS.some(p => p.test(url.trim()));
}

/**
 * Extract a YouTube video ID from a URL.
 * @param {string} url
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0];
      return u.searchParams.get('v');
    }
  } catch { /* invalid URL */ }
  return null;
}

/**
 * Check if a filename has a supported audio extension.
 * @param {string} filename
 * @returns {boolean}
 */
export function isAudioFile(filename) {
  if (!filename) return false;
  const ext = filename.split('.').pop().toLowerCase();
  return AUDIO_EXTENSIONS.includes(ext);
}

/**
 * Extract a display title from a file path.
 * e.g. "D:/Music/DJ Tabola Bale.mp3" → "DJ Tabola Bale"
 * @param {string} path
 * @returns {string}
 */
export function titleFromPath(path) {
  if (!path) return 'Unknown';
  const basename = path.replace(/\\/g, '/').split('/').pop() || path;
    return basename.replace(/\.[^/.]+$/, ''); // strip extension
  }
  


// ─── Source Entity Factory ────────────────────────────────────────────────────

/**
 * @typedef {Object} SourceEntity
 * @property {string} id                  - Unique source ID
 * @property {string} sourceType          - 'audio_file' | 'folder_audio' | 'youtube_url'
 * @property {string} title               - Display title (derived from path or videoTitle)
 * @property {string|null} duration       - Duration string (e.g. "3m 45s") or null if unknown
 * @property {string} status              - 'pending' | 'ready' | 'invalid' | 'failed'
 * @property {string|null} localPath      - File system path (for audio_file and folder_audio)
 * @property {string|null} youtubeUrl     - Full YouTube URL (for youtube_url sources)
 * @property {string|null} youtubeId      - Extracted YouTube video ID
 * @property {string|null} folderPath     - Original folder path (for folder_audio sources)
 * @property {Object} metadata            - Additional metadata (channel, cleanTitle, etc.)
 * @property {string[]} validationErrors  - List of validation error messages
 * @property {boolean} selected           - UI multi-select state
 * --- YouTube Metadata Fields (Task 02) ---
 * @property {string|null} rawVideoTitle  - Raw video title from YouTube
 * @property {string|null} normalizedTitle - Cleaned video title
 * @property {string|null} channelName    - YouTube channel name
 * @property {number|null} videoDuration  - Duration in seconds (from YouTube metadata)
 * @property {string|null} thumbnailUrl   - Thumbnail URL
 * @property {string|null} metadataStatus - null | 'idle' | 'fetching' | 'ready' | 'failed'
 * @property {string|null} metadataError  - Error message if metadataStatus = 'failed'
 * @property {string|null} metadataProgressText - UI display text for fetch progress
 * @property {string|null} metadataFetchedAt - ISO timestamp of successful fetch
 * @property {string|null} metadataProvider - 'yt-dlp' | 'oembed' | null
 * --- Cleaner Fields (Task 03) ---
 * @property {string|null} rawTitle       - Original unmodified title (set on first clean)
 * @property {string|null} cleanTitle     - Cleaned title produced by MetadataCleanerService
 * @property {string|null} titleSource    - 'path' | 'youtube' | 'manual' | 'fallback'
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} syncStatus          - 'local' | 'pending' | 'synced' | 'failed'
 */

/**
 * Create a Source entity.
 * @param {Partial<SourceEntity>} overrides
 * @returns {SourceEntity}
 */
export function createSource(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: generateId('src'),
    sourceType: SOURCE_TYPE.AUDIO_FILE,
    title: 'Unknown Source',
    duration: null,
    status: SOURCE_STATUS.READY,
    localPath: null,
    youtubeUrl: null,
    youtubeId: null,
    folderPath: null,
    metadata: {},
    validationErrors: [],
    selected: false,
    isUnlinked: false,
    // YouTube Metadata Fields (Task 02)
    rawVideoTitle: null,
    normalizedTitle: null,
    channelName: null,
    videoDuration: null,    // seconds
    thumbnailUrl: null,
    metadataStatus: null,   // null for non-YouTube sources
    metadataError: null,
    metadataProgressText: null,
    metadataFetchedAt: null,
    metadataProvider: null,
    // Cleaner Fields (Task 03)
    rawTitle: null,         // Set once on first clean; never overwritten
    cleanTitle: null,       // Updated by MetadataCleanerService
    titleSource: null,      // 'path' | 'youtube' | 'manual' | 'fallback'
    createdAt: now,
    updatedAt: now,
    syncStatus: SYNC_STATUS.LOCAL,
    ...overrides,
  };
}

// ─── Factory Helpers ──────────────────────────────────────────────────────────

/**
 * Create an Audio File source from a file path.
 * @param {string} path - File system path
 * @returns {SourceEntity}
 */
export function createAudioFileSource(path) {
  const errors = [];
  if (!path || !path.trim()) errors.push('File path cannot be empty.');
  else if (!isAudioFile(path)) errors.push(`File "${path}" does not appear to be a supported audio format.`);

  return createSource({
    sourceType: SOURCE_TYPE.AUDIO_FILE,
    title: titleFromPath(path),
    localPath: path || null,
    status: errors.length > 0 ? SOURCE_STATUS.INVALID : SOURCE_STATUS.READY,
    validationErrors: errors,
  });
}

/**
 * Create a Folder Audio source (a single track expanded from a folder).
 * @param {string} filePath - Full path to the audio file inside the folder
 * @param {string} folderPath - The original folder path
 * @returns {SourceEntity}
 */
export function createFolderAudioSource(filePath, folderPath, durationSec = 0) {
  return createSource({
    sourceType: SOURCE_TYPE.FOLDER_AUDIO,
    title: titleFromPath(filePath),
    localPath: filePath,
    folderPath: folderPath || null,
    status: SOURCE_STATUS.READY,
    videoDuration: durationSec,
    duration: durationSec > 0 ? formatDuration(durationSec) : null,
    validationErrors: [],
  });
}

/**
 * Create a YouTube URL source.
 * Task 01: Store URL only. No download. No metadata fetch. Status = pending.
 * @param {string} url - YouTube URL
 * @returns {SourceEntity}
 */
export function createYouTubeSource(url) {
  const trimmedUrl = url?.trim() || '';
  const errors = [];

  if (!trimmedUrl) {
    errors.push('YouTube URL cannot be empty.');
  } else if (!isValidYouTubeUrl(trimmedUrl)) {
    errors.push(`"${trimmedUrl}" is not a valid YouTube URL.`);
  }

  const videoId = errors.length === 0 ? extractYouTubeId(trimmedUrl) : null;

  return createSource({
    sourceType: SOURCE_TYPE.YOUTUBE_URL,
    title: videoId ? `YouTube: ${videoId}` : 'Invalid YouTube URL',
    youtubeUrl: trimmedUrl || null,
    youtubeId: videoId,
    metadataStatus: errors.length > 0 ? null : METADATA_STATUS.IDLE,
    status: errors.length > 0 ? SOURCE_STATUS.INVALID : SOURCE_STATUS.PENDING,
    validationErrors: errors,
  });
}

// ─── Simulated Folder Scanner ─────────────────────────────────────────────────

// Simulated folder structure for UI demonstration.
// Real implementation will use filesystem API or Electron IPC.
const MOCK_FOLDER_CONTENTS = {
  default: [
    'Track 01 - DJ Tabola Bale.mp3',
    'Track 02 - DJ Orang Baru.mp3',
    'Track 03 - DJ Kaka Bass.mp3',
  ],
};

/**
 * Simulate recursive folder scan.
 * Returns an array of mock audio file paths found inside the folder.
 * @param {string} folderPath
 * @returns {string[]}
 */
export function simulateFolderScan(folderPath) {
  if (!folderPath || !folderPath.trim()) return [];
  const folderName = folderPath.replace(/\\/g, '/').split('/').pop() || 'folder';
  const mockFiles = MOCK_FOLDER_CONTENTS[folderName] || MOCK_FOLDER_CONTENTS.default;
  // Return full simulated paths
  return mockFiles.map(f => `${folderPath.replace(/[/\\]$/, '')}/${f}`);
}

// ─── Duration Formatting ──────────────────────────────────────────────────────

/**
 * Format seconds as "Xm Ys".
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Sum total duration in seconds from source entities.
 * Only counts sources with a numeric duration.
 * @param {SourceEntity[]} sources
 * @returns {number}
 */
export function sumTotalDuration(sources) {
  return sources.reduce((acc, src) => {
    // 1. Prefer videoDuration if available, ensuring numeric addition
    if (src.videoDuration != null) {
      const parsed = parseFloat(src.videoDuration);
      if (!isNaN(parsed)) return acc + parsed;
    }

    // 2. Fallback to duration string parsing
    if (!src.duration) return acc;

    // Handle "Xm Ys" or "Xm Y.Zs"
    const match = src.duration.match(/(\d+)m\s*(\d+(?:\.\d+)?)\s*s?/);
    if (match) {
      return acc + (parseInt(match[1]) * 60) + parseFloat(match[2]);
    }

    // Handle "HH:MM:SS" or "MM:SS" (e.g. "03:45" or "01:15:30")
    const timeMatch = src.duration.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const hrs = parseInt(timeMatch[1] || '0', 10);
      const mins = parseInt(timeMatch[2], 10);
      const secs = parseInt(timeMatch[3], 10);
      return acc + (hrs * 3600) + (mins * 60) + secs;
    }

    // Handle plain numeric strings (e.g. "212.5" from older metadata versions)
    const floatMatch = src.duration.match(/^[\d.]+$/);
    if (floatMatch) {
      const parsed = parseFloat(src.duration);
      if (!isNaN(parsed)) return acc + parsed;
    }

    return acc;
  }, 0);
}
