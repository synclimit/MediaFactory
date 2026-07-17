/**
 * AudioPresetLibrary
 * 
 * Centralized library for all Audio Processing Presets.
 * Contains both Legacy presets (for backward compatibility) and new categorized presets.
 */

export const PRESET_CATEGORIES = {
  LEGACY: 'Legacy',
  DJ_REMIX: 'DJ / Remix',
  LOFI: 'LoFi',
  AMBIENT: 'Ambient',
  STREAMING: 'Streaming',
};

const _library = [
  // ─── Legacy (Original Presets) ──────────────────────────────────────────────────
  { category: PRESET_CATEGORIES.LEGACY, name: 'Neutral', pitch: 0.0, tempo: 1.0, bass: 0, treble: 0, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.LEGACY, name: 'Full Bass', pitch: 0.0, tempo: 1.0, bass: 6, treble: 2, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.LEGACY, name: 'Bright', pitch: 0.0, tempo: 1.0, bass: 1, treble: 6, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.LEGACY, name: 'Slow Chill', pitch: 0.0, tempo: 0.95, bass: 2, treble: 0, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.LEGACY, name: 'Wide Stereo', pitch: 0.0, tempo: 1.0, bass: 0, treble: 0, stereoWidth: 150, normalize: true },

  // ─── DJ / Remix ───────────────────────────────────────────────────────────────
  { category: PRESET_CATEGORIES.DJ_REMIX, name: 'Deep Bass', pitch: 0.0, tempo: 1.0, bass: 8, treble: 0, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.DJ_REMIX, name: 'Club Mix', pitch: 0.0, tempo: 1.05, bass: 7, treble: 4, stereoWidth: 120, normalize: true },
  { category: PRESET_CATEGORIES.DJ_REMIX, name: 'Festival Boost', pitch: 0.0, tempo: 1.02, bass: 6, treble: 5, stereoWidth: 140, normalize: true },
  { category: PRESET_CATEGORIES.DJ_REMIX, name: 'Nightcore', pitch: 0.0, tempo: 1.25, bass: 2, treble: 5, stereoWidth: 110, normalize: true },
  { category: PRESET_CATEGORIES.DJ_REMIX, name: 'Slowed', pitch: 0.0, tempo: 0.85, bass: 3, treble: -2, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.DJ_REMIX, name: 'Slowed + Reverb', pitch: 0.0, tempo: 0.80, bass: 4, treble: -3, stereoWidth: 140, normalize: true },

  // ─── LoFi ───────────────────────────────────────────────────────────────────
  { category: PRESET_CATEGORIES.LOFI, name: 'LoFi Warm', pitch: 0.0, tempo: 0.95, bass: 4, treble: -4, stereoWidth: 90, normalize: true },
  { category: PRESET_CATEGORIES.LOFI, name: 'LoFi Soft', pitch: 0.0, tempo: 0.92, bass: 3, treble: -6, stereoWidth: 95, normalize: true },
  { category: PRESET_CATEGORIES.LOFI, name: 'Study Focus', pitch: 0.0, tempo: 0.98, bass: 2, treble: -2, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.LOFI, name: 'Cafe Chill', pitch: 0.0, tempo: 1.0, bass: 3, treble: -1, stereoWidth: 110, normalize: true },
  { category: PRESET_CATEGORIES.LOFI, name: 'Chillhop', pitch: 0.0, tempo: 0.96, bass: 5, treble: 0, stereoWidth: 100, normalize: true },

  // ─── Ambient ────────────────────────────────────────────────────────────────
  { category: PRESET_CATEGORIES.AMBIENT, name: 'Rain Soft', pitch: 0.0, tempo: 1.0, bass: 2, treble: -3, stereoWidth: 120, normalize: true },
  { category: PRESET_CATEGORIES.AMBIENT, name: 'Rain Deep', pitch: 0.0, tempo: 0.9, bass: 6, treble: -5, stereoWidth: 150, normalize: true },
  { category: PRESET_CATEGORIES.AMBIENT, name: 'Sleep Mode', pitch: 0.0, tempo: 0.85, bass: 5, treble: -8, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.AMBIENT, name: 'Meditation', pitch: 0.0, tempo: 0.9, bass: 3, treble: -4, stereoWidth: 130, normalize: true },
  { category: PRESET_CATEGORIES.AMBIENT, name: 'Calm Night', pitch: 0.0, tempo: 0.95, bass: 4, treble: -5, stereoWidth: 110, normalize: true },

  // ─── Streaming ──────────────────────────────────────────────────────────────
  { category: PRESET_CATEGORIES.STREAMING, name: 'YouTube Chill', pitch: 0.0, tempo: 1.0, bass: 2, treble: 1, stereoWidth: 100, normalize: true },
  { category: PRESET_CATEGORIES.STREAMING, name: 'Background Music', pitch: 0.0, tempo: 1.0, bass: 1, treble: -2, stereoWidth: 110, normalize: true },
  { category: PRESET_CATEGORIES.STREAMING, name: 'Podcast Clear', pitch: 0.0, tempo: 1.0, bass: -2, treble: 4, stereoWidth: 90, normalize: true },
  { category: PRESET_CATEGORIES.STREAMING, name: 'Radio Voice', pitch: 0.0, tempo: 1.0, bass: -1, treble: 5, stereoWidth: 80, normalize: true },
];

export const AudioPresetLibrary = {
  getAllPresets: () => _library,
  
  getPresetsByCategory: () => {
    return _library.reduce((acc, preset) => {
      if (!acc[preset.category]) acc[preset.category] = [];
      acc[preset.category].push(preset);
      return acc;
    }, {});
  },

  getPresetByName: (name) => {
    return _library.find(p => p.name === name) || _library.find(p => p.name === 'Neutral');
  },

  /**
   * Generates the flat object format expected by the legacy AUDIO_PRESETS constant
   */
  getLegacyExportFormat: () => {
    return _library.reduce((acc, preset) => {
      acc[preset.name] = {
        pitch: preset.pitch,
        tempo: preset.tempo,
        bass: preset.bass,
        treble: preset.treble,
        stereoWidth: preset.stereoWidth,
        normalize: preset.normalize,
      };
      return acc;
    }, {});
  }
};
