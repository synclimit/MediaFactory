/**
 * M2 Naming Engine
 *
 * Generates output filenames from clean source titles.
 *
 * Naming Pattern Pipeline:
 *   Clean Titles → Naming Engine → Output Preview List
 *
 * All patterns operate on CLEAN titles (post-Metadata Cleaner).
 */

// ─── Naming Pattern Constants ─────────────────────────────────────────────────

export const NAMING_PATTERN = Object.freeze({
  CLEAN_TITLE:    'clean_title',     // DJ Tabola Bale
  TITLE_A:        'title_a',         // DJ Tabola Bale A
  TITLE_B:        'title_b',         // DJ Tabola Bale B
  TITLE_C:        'title_c',         // DJ Tabola Bale C
  CUSTOM_PREFIX:  'custom_prefix',   // DJ Viral TikTok - DJ Tabola Bale
  CUSTOM_SUFFIX:  'custom_suffix',   // DJ Tabola Bale - Full Bass
});

export const NAMING_PATTERN_LABELS = Object.freeze({
  [NAMING_PATTERN.CLEAN_TITLE]:   'Clean Title',
  [NAMING_PATTERN.TITLE_A]:       'Title + A',
  [NAMING_PATTERN.TITLE_B]:       'Title + B',
  [NAMING_PATTERN.TITLE_C]:       'Title + C',
  [NAMING_PATTERN.CUSTOM_PREFIX]: 'Custom Prefix',
  [NAMING_PATTERN.CUSTOM_SUFFIX]: 'Custom Suffix',
});

// ─── Default Settings ─────────────────────────────────────────────────────────

export const DEFAULT_NAMING_SETTINGS = Object.freeze({
  pattern:       NAMING_PATTERN.CLEAN_TITLE,
  djPrefix:      true,          // Prepend "DJ" if not already present
  customPrefix:  'DJ Viral TikTok',
  customSuffix:  'Full Bass',
});

// ─── DJ Prefix Helper ─────────────────────────────────────────────────────────

/**
 * Apply DJ prefix to a clean title if enabled and not already present.
 * @param {string} title
 * @param {boolean} djPrefix
 * @returns {string}
 */
function applyDjPrefix(title, djPrefix) {
  if (!djPrefix) return title;
  if (!title) return title;
  const upper = title.trim().toUpperCase();
  if (upper.startsWith('DJ ') || upper.startsWith('DJ\t')) return title;
  return `DJ ${title}`;
}

// ─── Pattern Generators ───────────────────────────────────────────────────────

/**
 * Generate an output name from a single clean title using the chosen pattern.
 *
 * @param {string} cleanTitle   - The cleaned source title
 * @param {string} pattern      - NAMING_PATTERN value
 * @param {Object} settings     - { djPrefix, customPrefix, customSuffix }
 * @returns {string}            - The generated output name (without extension)
 */
export function generateOutputName(cleanTitle, pattern, settings = {}) {
  const { djPrefix = true, customPrefix = '', customSuffix = '' } = settings;
  const base = applyDjPrefix(cleanTitle || 'Unknown', djPrefix);

  const sanitize = (name) => name.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, ' ').trim();

  switch (pattern) {
    case NAMING_PATTERN.CLEAN_TITLE:
      return sanitize(base);

    case NAMING_PATTERN.TITLE_A:
      return sanitize(`${base} A`);

    case NAMING_PATTERN.TITLE_B:
      return sanitize(`${base} B`);

    case NAMING_PATTERN.TITLE_C:
      return sanitize(`${base} C`);

    case NAMING_PATTERN.CUSTOM_PREFIX:
      return sanitize(customPrefix
        ? `${customPrefix.trim()} - ${base}`
        : base);

    case NAMING_PATTERN.CUSTOM_SUFFIX:
      return sanitize(customSuffix
        ? `${base} - ${customSuffix.trim()}`
        : base);

    default:
      return sanitize(base);
  }
}

/**
 * Generate output names for multiple clean titles.
 *
 * @param {Array<{id: string, cleanTitle: string, rawTitle: string}>} sources
 * @param {string} pattern   - NAMING_PATTERN value
 * @param {Object} settings  - { djPrefix, customPrefix, customSuffix }
 * @returns {Array<{id: string, rawTitle: string, cleanTitle: string, outputName: string}>}
 */
export function generateOutputNames(sources, pattern, settings = {}) {
  return sources.map(src => ({
    id: src.id,
    rawTitle: src.rawTitle || src.title || '',
    cleanTitle: src.cleanTitle || src.title || '',
    outputName: generateOutputName(src.cleanTitle || src.title || '', pattern, settings),
  }));
}

/**
 * Generate a live preview list from a set of sources.
 * Returns the first N entries for display.
 *
 * @param {Array} sources
 * @param {string} pattern
 * @param {Object} settings
 * @param {number} maxPreview - Max entries to show (default 5)
 * @returns {string[]} List of output names for preview
 */
export function generateLivePreview(sources, pattern, settings = {}, maxPreview = 5) {
  const slice = sources.slice(0, maxPreview);
  return generateOutputNames(slice, pattern, settings).map(r => r.outputName);
}

/**
 * Describe a naming pattern in human-readable terms.
 * @param {string} pattern
 * @param {Object} settings
 * @returns {string}
 */
export function describePattern(pattern, settings = {}) {
  switch (pattern) {
    case NAMING_PATTERN.CLEAN_TITLE:
      return 'Output name = Clean Title only.';
    case NAMING_PATTERN.TITLE_A:
      return 'Output name = Clean Title + letter "A" suffix.';
    case NAMING_PATTERN.TITLE_B:
      return 'Output name = Clean Title + letter "B" suffix.';
    case NAMING_PATTERN.TITLE_C:
      return 'Output name = Clean Title + letter "C" suffix.';
    case NAMING_PATTERN.CUSTOM_PREFIX:
      return `Output name = "${settings.customPrefix || 'Custom'} - " + Clean Title.`;
    case NAMING_PATTERN.CUSTOM_SUFFIX:
      return `Output name = Clean Title + " - ${settings.customSuffix || 'Custom'}".`;
    default:
      return '';
  }
}
