/**
 * ReferenceBeatEngineAdapter.js [Status: NEW]
 * Standby Beat Engine Adapter for Production Reference Engine v1.0.
 * 
 * SPRINT 04 GOVERNANCE:
 * - Computes standby beat state (RMS, spectralFlux, peak energy, kick/snare detection) deterministically.
 * - Coexists passively with legacy BeatEngine.js.
 * - Legacy BeatEngine.js remains 100% ACTIVE as the primary driver.
 * - Feature Flag `useReferenceEngine` remains FALSE.
 */

export class ReferenceBeatEngineAdapter {
  /**
   * Calculates deterministic BeatState metrics from normalized 64-bin Float32 frequencies array.
   * @param {Float32Array} freqs Normalized frequencies (0.0 to 1.0)
   * @param {Object} [previousState={}] Previous frame beat state for flux & decay calculation
   * @returns {Object} Deterministic BeatState object
   */
  static calculateBeatState(freqs, previousState = {}) {
    if (!freqs || !freqs.length) {
      return {
        energy: 0,
        RMS: 0,
        spectralFlux: 0,
        kick: false,
        snare: false,
        beatStrength: 0
      };
    }

    // 1. Calculate RMS & Total Energy
    let sumSquares = 0;
    let sumEnergy = 0;
    const len = freqs.length;

    for (let i = 0; i < len; i++) {
      const val = freqs[i] || 0;
      sumSquares += val * val;
      sumEnergy += val;
    }

    const rms = Math.sqrt(sumSquares / len);
    const energy = Math.min(sumEnergy / len, 1.0);

    // 2. Calculate Spectral Flux (rate of change between frames)
    const prevFreqs = previousState.frequencies || new Float32Array(len);
    let flux = 0;
    for (let i = 0; i < len; i++) {
      const diff = (freqs[i] || 0) - (prevFreqs[i] || 0);
      if (diff > 0) flux += diff;
    }
    const spectralFlux = Math.min(flux / len, 1.0);

    // 3. Sub-bass & Bass Transient Detection (Kick & Snare)
    let bassEnergy = 0;
    for (let i = 0; i < 8; i++) {
      bassEnergy += freqs[i] || 0;
    }
    bassEnergy /= 8;

    let midEnergy = 0;
    for (let i = 16; i < 32; i++) {
      midEnergy += freqs[i] || 0;
    }
    midEnergy /= 16;

    const prevBass = previousState.bassEnergy || 0;
    const kickThreshold = 0.35;
    const kick = (bassEnergy - prevBass) > 0.15 && bassEnergy > kickThreshold;

    const prevMid = previousState.midEnergy || 0;
    const snareThreshold = 0.30;
    const snare = (midEnergy - prevMid) > 0.12 && midEnergy > snareThreshold;

    const beatStrength = Math.min(bassEnergy * 1.5 + spectralFlux * 0.5, 1.0);

    return Object.freeze({
      energy,
      RMS: rms,
      spectralFlux,
      kick,
      snare,
      beatStrength,
      bassEnergy,
      midEnergy
    });
  }
}
