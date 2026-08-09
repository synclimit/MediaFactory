/**
 * AudioState.js
 * Normalized AudioState Data Factory.
 */

export function createAudioState(override = {}) {
  const numBins = override.frequencies ? override.frequencies.length : 64;
  
  return {
    time: override.time || 0,
    subBass: override.subBass || 0,
    bass: override.bass || 0,
    lowMid: override.lowMid || 0,
    mid: override.mid || 0,
    highMid: override.highMid || 0,
    treble: override.treble || 0,
    energy: override.energy || 0,
    RMS: override.RMS || 0,
    kick: override.kick || false,
    snare: override.snare || false,
    beatStrength: override.beatStrength || 0,
    spectralFlux: override.spectralFlux || 0,
    frequencies: override.frequencies || new Float32Array(numBins),
    waveform: override.waveform || new Float32Array(numBins)
  };
}
