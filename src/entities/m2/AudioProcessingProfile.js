/**
 * AudioProcessingProfile Entity
 *
 * Represents the global processing settings applied to all source tracks
 * before compilation in Mode 2.
 */

export class AudioProcessingProfile {
  constructor({
    pitch = 0.0,
    tempo = 1.0,
    bass = 0,
    treble = 0,
    stereoWidth = 100,
    normalize = true,
    presetName = 'Neutral',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  } = {}) {
    this.pitch = pitch;
    this.tempo = tempo;
    this.bass = bass;
    this.treble = treble;
    this.stereoWidth = stereoWidth;
    this.normalize = normalize;
    this.presetName = presetName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Generates a simple hash string for developer mode
   * @returns {string}
   */
  generateHash() {
    const raw = `${this.pitch}_${this.tempo}_${this.bass}_${this.treble}_${this.stereoWidth}_${this.normalize}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Returns a display-friendly summary string
   * @returns {string}
   */
  getSummaryString() {
    return `Pitch: ${this.pitch > 0 ? '+' : ''}${this.pitch} | Tempo: ${this.tempo.toFixed(2)} | Bass: ${this.bass > 0 ? '+' : ''}${this.bass} | Treble: ${this.treble > 0 ? '+' : ''}${this.treble} | Stereo: ${this.stereoWidth}% | Normalize: ${this.normalize ? 'ON' : 'OFF'}`;
  }
}

// ─── Constants for UI Limits ──────────────────────────────────────────────────

export const AUDIO_CONTROLS = {
  PITCH: { min: -1.0, max: 1.0, step: 0.1, default: 0.0 },
  TEMPO: { min: 0.90, max: 1.10, step: 0.01, default: 1.0 },
  BASS: { min: -10, max: 10, step: 1, default: 0 },
  TREBLE: { min: -10, max: 10, step: 1, default: 0 },
  STEREO_WIDTH: { min: 0, max: 200, step: 1, default: 100 },
};

// ─── Built-in Presets ─────────────────────────────────────────────────────────

import { AudioPresetLibrary } from './AudioPresetLibrary.js';

export const AUDIO_PRESETS = AudioPresetLibrary.getLegacyExportFormat();
