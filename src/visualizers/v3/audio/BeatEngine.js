/**
 * BeatEngine.js [Visualizer 3 Audio Feature Extractor]
 * Pure production-grade audio feature extractor:
 * Calculates RMS, multi-band frequency mapping, spectral flux, and transient peak detection.
 */

import { createAudioState } from './AudioState.js';

export class BeatEngine {
  constructor() {
    this.prevFrequencies = null;
    this.fluxHistory = [];
    this.maxFluxHistoryLen = 30;
  }

  processFrame(time, rawFrequencies, rawWaveform, sampleRate = 44100) {
    const numBins = rawFrequencies.length;
    const binWidth = (sampleRate / 2) / numBins;

    // Multi-band frequency mapping (Hz boundaries)
    let subBassSum = 0, subBassCount = 0; // 20 - 60 Hz
    let bassSum = 0, bassCount = 0;       // 60 - 250 Hz
    let lowMidSum = 0, lowMidCount = 0;   // 250 - 500 Hz
    let midSum = 0, midCount = 0;         // 500 - 2000 Hz
    let highMidSum = 0, highMidCount = 0; // 2000 - 4000 Hz
    let trebleSum = 0, trebleCount = 0;   // 4000 - 20000 Hz
    let totalEnergySum = 0;

    for (let i = 0; i < numBins; i++) {
      const freq = i * binWidth;
      const val = rawFrequencies[i] / 255.0; // Normalized [0, 1]
      totalEnergySum += val;

      if (freq >= 20 && freq < 60) { subBassSum += val; subBassCount++; }
      else if (freq >= 60 && freq < 250) { bassSum += val; bassCount++; }
      else if (freq >= 250 && freq < 500) { lowMidSum += val; lowMidCount++; }
      else if (freq >= 500 && freq < 2000) { midSum += val; midCount++; }
      else if (freq >= 2000 && freq < 4000) { highMidSum += val; highMidCount++; }
      else if (freq >= 4000) { trebleSum += val; trebleCount++; }
    }

    const subBass = subBassCount > 0 ? subBassSum / subBassCount : 0;
    const bass = bassCount > 0 ? bassSum / bassCount : 0;
    const lowMid = lowMidCount > 0 ? lowMidSum / lowMidCount : 0;
    const mid = midCount > 0 ? midSum / midCount : 0;
    const highMid = highMidCount > 0 ? highMidSum / highMidCount : 0;
    const treble = trebleCount > 0 ? trebleSum / trebleCount : 0;
    const energy = totalEnergySum / numBins;

    // RMS Calculation
    let sumSquares = 0;
    if (rawWaveform && rawWaveform.length > 0) {
      for (let i = 0; i < rawWaveform.length; i++) {
        const norm = (rawWaveform[i] - 128) / 128.0;
        sumSquares += norm * norm;
      }
    }
    const RMS = rawWaveform.length > 0 ? Math.sqrt(sumSquares / rawWaveform.length) : 0;

    // Spectral Flux Calculation
    let currentFlux = 0;
    if (this.prevFrequencies && this.prevFrequencies.length === numBins) {
      for (let i = 0; i < numBins; i++) {
        const diff = (rawFrequencies[i] / 255.0) - (this.prevFrequencies[i] / 255.0);
        if (diff > 0) currentFlux += diff;
      }
    }
    this.prevFrequencies = new Float32Array(rawFrequencies);

    // Dynamic threshold tracking for transient detection
    this.fluxHistory.push(currentFlux);
    if (this.fluxHistory.length > this.maxFluxHistoryLen) {
      this.fluxHistory.shift();
    }
    const avgFlux = this.fluxHistory.reduce((a, b) => a + b, 0) / (this.fluxHistory.length || 1);
    const fluxThreshold = avgFlux * 1.4;

    const kick = (subBass > 0.4 || bass > 0.5) && currentFlux > fluxThreshold;
    const snare = (highMid > 0.35 || treble > 0.3) && currentFlux > fluxThreshold;
    const beatStrength = Math.min(1.0, currentFlux / (fluxThreshold || 1.0));

    // Prepare normalized Float32Array frequencies and waveform
    const normFreqs = new Float32Array(numBins);
    for (let i = 0; i < numBins; i++) {
      normFreqs[i] = rawFrequencies[i] / 255.0;
    }

    const normWave = new Float32Array(rawWaveform.length);
    for (let i = 0; i < rawWaveform.length; i++) {
      normWave[i] = (rawWaveform[i] - 128) / 128.0;
    }

    return createAudioState({
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
      spectralFlux: currentFlux,
      frequencies: normFreqs,
      waveform: normWave
    });
  }
}
