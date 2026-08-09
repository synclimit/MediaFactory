/**
 * BeatEngine.js
 * Feature Extraction & Transient Beat Detector Engine.
 */
import { createAudioState } from './AudioState.js';

export class BeatEngine {
  constructor(numBins = 64) {
    this.numBins = numBins;
    this.prevFrequencies = new Float32Array(numBins);
    this.energyHistory = [];
    this.maxHistoryLen = 43; // ~0.7 seconds at 60fps
    this.kickCooldown = 0;
    this.snareCooldown = 0;
  }

  processFrame(timestamp, frequencies, waveform) {
    let totalEnergy = 0;
    for (let i = 0; i < this.numBins; i++) {
      totalEnergy += frequencies[i];
    }
    const avgEnergy = totalEnergy / this.numBins;

    let flux = 0;
    for (let i = 0; i < this.numBins; i++) {
      const diff = frequencies[i] - this.prevFrequencies[i];
      if (diff > 0) flux += diff;
      this.prevFrequencies[i] = frequencies[i];
    }

    this.energyHistory.push(avgEnergy);
    if (this.energyHistory.length > this.maxHistoryLen) {
      this.energyHistory.shift();
    }

    const localAvgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / (this.energyHistory.length || 1);
    const isBeat = avgEnergy > localAvgEnergy * 1.3 && avgEnergy > 0.15;

    let subBass = 0, bass = 0, lowMid = 0, mid = 0, highMid = 0, treble = 0;
    const b = Math.floor(this.numBins / 6);
    for (let i = 0; i < b; i++) subBass += frequencies[i];
    for (let i = b; i < b * 2; i++) bass += frequencies[i];
    for (let i = b * 2; i < b * 3; i++) lowMid += frequencies[i];
    for (let i = b * 3; i < b * 4; i++) mid += frequencies[i];
    for (let i = b * 4; i < b * 5; i++) highMid += frequencies[i];
    for (let i = b * 5; i < this.numBins; i++) treble += frequencies[i];

    subBass /= b; bass /= b; lowMid /= b; mid /= b; highMid /= b; treble /= (this.numBins - b * 5 || 1);

    if (this.kickCooldown > 0) this.kickCooldown--;
    if (this.snareCooldown > 0) this.snareCooldown--;

    let kick = false;
    let snare = false;

    if (subBass > 0.6 && this.kickCooldown === 0) {
      kick = true;
      this.kickCooldown = 10;
    }

    if (highMid > 0.5 && this.snareCooldown === 0) {
      snare = true;
      this.snareCooldown = 12;
    }

    let sumSq = 0;
    for (let i = 0; i < waveform.length; i++) {
      sumSq += waveform[i] * waveform[i];
    }
    const rms = Math.sqrt(sumSq / (waveform.length || 1));

    return createAudioState({
      time: timestamp,
      subBass,
      bass,
      lowMid,
      mid,
      highMid,
      treble,
      energy: avgEnergy,
      RMS: rms,
      kick,
      snare,
      beatStrength: isBeat ? Math.min(1.0, (avgEnergy / (localAvgEnergy || 1)) * 0.5) : 0,
      spectralFlux: flux,
      frequencies,
      waveform
    });
  }
}
