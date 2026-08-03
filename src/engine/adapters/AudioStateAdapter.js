/**
 * AudioStateAdapter.js [Status: NEW]
 * Adapter for creating and normalizing AudioState objects from Media Factory audio engine snapshots.
 * 
 * SPRINT 03 GOVERNANCE:
 * - AudioState is constructed and passed passively through RenderFrame.
 * - Legacy Beat Engine (BeatEngine.js) remains 100% ACTIVE as the primary driver.
 * - AudioState is Standby / Passive (Feature Flag useReferenceEngine = false).
 */

import { createAudioState } from '../audio/AudioState.js';

export class AudioStateAdapter {
  /**
   * Normalizes raw FFT frequency array (0-255) into a 64-element Float32Array normalized [0.0, 1.0].
   * @param {Uint8Array|Float32Array|Array} rawArray Raw frequencies
   * @returns {Float32Array} Normalized frequencies (0.0 to 1.0)
   */
  static normalizeFrequencies(rawArray) {
    const target = new Float32Array(64);
    if (!rawArray || !rawArray.length) return target;

    const sourceLen = rawArray.length;
    const factor = sourceLen / 64;

    for (let i = 0; i < 64; i++) {
      const srcIdx = Math.floor(i * factor);
      let val = rawArray[srcIdx] || 0;
      // If 8-bit uint (0-255), normalize to [0.0, 1.0]
      if (val > 1.0) val = val / 255.0;
      target[i] = Math.min(Math.max(val, 0.0), 1.0);
    }
    return target;
  }

  /**
   * Extracts multi-band energy levels (subBass, bass, lowMid, mid, highMid, treble) from normalized frequencies.
   * @param {Float32Array} freqs Normalized frequencies (64 bins)
   * @returns {Object} Multi-band energy values [0.0, 1.0]
   */
  static calculateBands(freqs) {
    if (!freqs || !freqs.length) {
      return { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 };
    }

    const averageRange = (start, end) => {
      let sum = 0;
      const count = end - start;
      if (count <= 0) return 0;
      for (let i = start; i < end; i++) {
        sum += freqs[i] || 0;
      }
      return Math.min(sum / count, 1.0);
    };

    return {
      subBass: averageRange(0, 3),   // Bins 0-2 (~20-60Hz)
      bass: averageRange(3, 10),     // Bins 3-9 (~60-250Hz)
      lowMid: averageRange(10, 20),  // Bins 10-19 (~250-500Hz)
      mid: averageRange(20, 36),     // Bins 20-35 (~500-2kHz)
      highMid: averageRange(36, 50), // Bins 36-49 (~2k-4kHz)
      treble: averageRange(50, 64)   // Bins 50-63 (~4k-20kHz)
    };
  }

  /**
   * Creates a normalized AudioState instance from raw Media Factory engine snapshots.
   * @param {Object} [engineStates={}] Media Factory frame states
   * @returns {Object} Immutable AudioState data structure
   */
  static createFromFrame(engineStates = {}) {
    const beat = engineStates.BeatEngine || engineStates.beat || {};
    const audio = engineStates.AudioDrivenAdapter || engineStates.audio || {};

    const rawFreqs = audio.frequencies || audio.spectrum || beat.spectrum || null;
    const normalizedFreqs = AudioStateAdapter.normalizeFrequencies(rawFreqs);
    const bands = AudioStateAdapter.calculateBands(normalizedFreqs);

    const rawEnergy = beat.energy !== undefined ? beat.energy : (audio.energy || 0);
    const energy = rawEnergy > 1.0 ? rawEnergy / 255.0 : rawEnergy;

    return createAudioState({
      time: audio.time || beat.time || 0,
      subBass: bands.subBass,
      bass: beat.bass !== undefined ? beat.bass : bands.bass,
      lowMid: bands.lowMid,
      mid: beat.mid !== undefined ? beat.mid : bands.mid,
      highMid: bands.highMid,
      treble: beat.treble !== undefined ? beat.treble : bands.treble,
      energy: Math.min(Math.max(energy, 0.0), 1.0),
      RMS: audio.rms || energy,
      kick: Boolean(beat.kick),
      snare: Boolean(beat.snare),
      beatStrength: beat.beatStrength || energy,
      spectralFlux: audio.spectralFlux || 0,
      frequencies: normalizedFreqs,
      waveform: audio.waveform || new Float32Array(64)
    });
  }
}
