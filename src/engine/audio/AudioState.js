/**
 * AudioState.js
 * Normalized AudioState Data Object Factory for Production Reference Engine v1.0.
 */

export function createAudioState({
  time = 0,
  subBass = 0,
  bass = 0,
  lowMid = 0,
  mid = 0,
  highMid = 0,
  treble = 0,
  energy = 0,
  RMS = 0,
  kick = false,
  snare = false,
  beatStrength = 0,
  spectralFlux = 0,
  frequencies = new Float32Array(64),
  waveform = new Float32Array(64)
} = {}) {
  return Object.freeze({
    time,
    subBass,
    bass,
    lowMid,
    mid,
    highMid,
    treble,
    energy,
    RMS,
    kick,
    snare,
    beatStrength,
    spectralFlux,
    frequencies,
    waveform
  });
}
