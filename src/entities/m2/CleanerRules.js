/**
 * M2 Cleaner Rules
 *
 * Defines all title cleaning rules for the Metadata Engine.
 * This is the single source of truth for what gets removed/transformed.
 *
 * Pipeline:
 *   Raw Title → cleanTitle() → Clean Title → Naming Engine → Output Title
 */

// ─── Removal Phrases ──────────────────────────────────────────────────────────
// Matched case-insensitively. Order matters: longer phrases first.

export const REMOVAL_PHRASES = [
  // Platform / Promo labels (longest first)
  'official music video',
  'official lyric video',
  'official audio video',
  'official video',
  'official audio',
  'official mv',
  'lyric video',
  'music video',
  'audio video',
  'lyrics video',

  // Quality / Format tags
  'high quality',
  'hq audio',
  '4k uhd',
  '4k video',
  '1080p',
  '720p',
  '4k',
  'hd',
  'hq',

  // Social / Viral markers
  'viral tiktok',
  'tiktok viral',
  'viral 2026',
  'viral 2025',
  'viral 2024',
  'ft tiktok',
  'tiktok',
  'viral',

  // Lyrics
  'with lyrics',
  'lyrics video',
  'lirik lagu',
  'lirik',
  'lyrics',
  'lyric',

  // Indonesian / Malay promo words
  'terbaru 2026',
  'terbaru 2025',
  'terbaru 2024',
  'terbaru',
  'tahun 2026',
  'tahun 2025',
  'tahun 2024',
  'tahun',
  'terpopuler',
  'terpanas',

  // Year markers (4-digit years 2020–2030)
  '2030', '2029', '2028', '2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020',

  // Subscribe / Channel CTA
  'subscribe',
  'like and subscribe',
  'like & subscribe',
  'follow me',
  'no copyright',
  'free download',
  'free use',
  'copyright free',
  'royalty free',
];

// ─── Channel Name Strip Patterns ──────────────────────────────────────────────
// Common channel name suffixes to strip from titles

export const CHANNEL_SUFFIXES = [
  'channel',
  'official channel',
  'music channel',
  'records',
  'productions',
  'entertainment',
  'studio',
];

// ─── Bracket Stripping Patterns ───────────────────────────────────────────────

// Matches () and [] blocks including their contents
const BRACKET_PATTERNS = [
  /\s*\([^)]*\)/g,    // (content)
  /\s*\[[^\]]*\]/g,   // [content]
];

// ─── Title Case Converter ─────────────────────────────────────────────────────

const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor',
  'on', 'at', 'to', 'by', 'up', 'in', 'of',
]);

const ACRONYMS = new Set(['dj', 'mc', 'bpm', 'vip', 'hq', 'hd', 'tv', 'uk', 'us', 'usa']);
const LOWERCASE_SPECIAL = new Set(['ft', 'feat', 'vs', 'x']);

/**
 * Convert a string to Title Case, preserving non-ASCII chars.
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str) {
  return str
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return word;
      const lower = word.toLowerCase();
      
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (LOWERCASE_SPECIAL.has(lower)) return lower;

      // Always capitalize first word; lowercase minor words otherwise
      if (idx === 0 || !LOWERCASE_WORDS.has(lower)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return lower;
    })
    .join(' ');
}

// ─── Core Clean Function ──────────────────────────────────────────────────────

/**
 * Clean a raw source title through the full cleaning pipeline.
 *
 * Pipeline:
 *   1. Strip bracket groups () []
 *   2. Remove promo phrases (case-insensitive)
 *   3. Remove trailing/leading punctuation and separators
 *   4. Collapse duplicate spaces
 *   5. Apply Title Case
 *   6. Trim
 *
 * @param {string} rawTitle - The original, dirty title
 * @returns {string} - The cleaned title
 */
export function cleanTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';

  let t = rawTitle;

  // Step 1: Strip bracket groups (always)
  for (const pattern of BRACKET_PATTERNS) {
    t = t.replace(pattern, '');
  }

  // Step 2: Remove promo phrases (longest first, case-insensitive)
  for (const phrase of REMOVAL_PHRASES) {
    // Word-boundary-aware removal to avoid partial matches
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|\\s|[-|–—])${escaped}(?:$|\\s|[-|–—,!])`, 'gi');
    t = t.replace(re, ' ');
  }

  // Step 3: Remove trailing separators and leading/trailing symbols
  // Remove lines that are just dashes, pipes, etc.
  t = t.replace(/^[\s\-–—|_,!.]+/, '');
  t = t.replace(/[\s\-–—|_,!.]+$/, '');

  // Step 4: Collapse multiple spaces, tabs, etc.
  t = t.replace(/\s{2,}/g, ' ');
  t = t.trim();

  // Step 5: Apply Title Case
  t = toTitleCase(t);

  // Step 6: Final trim
  return t.trim() || rawTitle; // Fallback to rawTitle if everything was stripped
}

// ─── Batch Cleaner ────────────────────────────────────────────────────────────

/**
 * Clean multiple titles at once.
 * @param {string[]} rawTitles
 * @returns {Array<{rawTitle: string, cleanTitle: string}>}
 */
export function cleanTitles(rawTitles) {
  return rawTitles.map(raw => ({
    rawTitle: raw,
    cleanTitle: cleanTitle(raw),
  }));
}

/**
 * Specifically cleans YouTube titles according to SEO junk removal rules.
 * @param {string} title 
 * @returns {{videoTitle: string, cleanTitle: string}}
 */
export function cleanYoutubeTitle(title) {
  if (!title) return { videoTitle: '', cleanTitle: '' };
  
  let cleanedTitle = title;
  
  const junkPhrases = [
    'TRENDING', 'TREND', 'VIRAL', 'TIKTOK', 'SLOW', 'FULL SONG', 'FULL ALBUM', 'NONSTOP',
    '2025', '2026', '2027', 'MAMAN FVNDY', 'DJ REMIX TERBARU', 'DJ VIRAL', 'DJ TIKTOK',
    'BRAZIL', 'FYP', 'SOUND TIKTOK', 'DANCE'
  ];

  for (const phrase of junkPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    cleanedTitle = cleanedTitle.replace(re, ' ');
  }

  for (const phrase of junkPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    cleanedTitle = cleanedTitle.replace(re, ' ');
  }

  cleanedTitle = cleanedTitle.replace(/\s{2,}/g, ' ');
  cleanedTitle = cleanedTitle.replace(/^[\s\-–—|_,!.]+/g, '');
  cleanedTitle = cleanedTitle.replace(/[\s\-–—|_,!.]+$/g, '');
  cleanedTitle = cleanedTitle.replace(/\s{2,}/g, ' ').trim();

  console.log('RAW_TITLE', title);
  console.log('CLEAN_TITLE', cleanedTitle);
  console.log('TITLE_USED_FOR_RENDER', cleanedTitle);

  return {
    videoTitle: title,
    cleanTitle: cleanedTitle
  };
}

// ─── Title Source Enum ────────────────────────────────────────────────────────

/**
 * Tracks where the cleanTitle was derived from.
 */
export const TITLE_SOURCE = Object.freeze({
  PATH:        'path',         // From file system path (audio_file, folder_audio)
  YOUTUBE:     'youtube',      // From YouTube metadata (videoTitle)
  MANUAL:      'manual',       // User manually set
  FALLBACK:    'fallback',     // No clean title derived; fell back to raw
});
