/**
 * AudioState.js [Visualizer 3 Audio Contract]
 * Normalized, immutable AudioState struct factory.
 */

export function createAudioState(data = {}) {
  const time = typeof data.time === 'number' ? data.time : 0;
  const subBass = Math.min(1.0, Math.max(0.0, data.subBass || 0));
  const bass = Math.min(1.0, Math.max(0.0, data.bass || 0));
  const lowMid = Math.min(1.0, Math.max(0.0, data.lowMid || 0));
  const mid = Math.min(1.0, Math.max(0.0, data.mid || 0));
  const highMid = Math.min(1.0, Math.max(0.0, data.highMid || 0));
  const treble = Math.min(1.0, Math.max(0.0, data.treble || 0));
  const energy = Math.min(1.0, Math.max(0.0, data.energy || 0));
  const RMS = typeof data.RMS === 'number' ? data.RMS : 0;
  const kick = Boolean(data.kick);
  const snare = Boolean(data.snare);
  const beatStrength = Math.min(1.0, Math.max(0.0, data.beatStrength || 0));
  const spectralFlux = typeof data.spectralFlux === 'number' ? data.spectralFlux : 0;

  const frequencies = data.frequencies instanceof Float32Array 
    ? data.frequencies 
    : new Float32Array(data.frequencies || 64);

  const waveform = data.waveform instanceof Float32Array 
    ? data.waveform 
    : new Float32Array(data.waveform || 64);

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
