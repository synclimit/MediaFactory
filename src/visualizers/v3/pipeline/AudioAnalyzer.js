/**
 * AudioAnalyzer.js [Visualizer 3 Audio Pipeline]
 * Handles pre-computation of FFT timeline cache and deterministic LERP interpolation.
 */

import { BeatEngine } from '../audio/BeatEngine.js';

export class AudioAnalyzer {
  constructor(fps = 60) {
    this.fps = fps;
    this.frameDuration = 1.0 / fps;
    this.fftCache = [];
    this.duration = 0;
    this.beatEngine = new BeatEngine();
  }

  /**
   * Pre-computes timeline FFT cache from raw PCM Float32Array channel data.
   */
  analyzePCM(channelData, sampleRate = 44100, fftSize = 128) {
    if (!channelData || channelData.length === 0) {
      throw new Error('[AudioAnalyzer] Invalid channel data provided');
    }

    this.duration = channelData.length / sampleRate;
    const totalFrames = Math.ceil(this.duration * this.fps);
    this.fftCache = new Array(totalFrames);

    const hopSize = Math.floor(sampleRate / this.fps);
    const numBins = fftSize / 2;

    for (let f = 0; f < totalFrames; f++) {
      const time = f * this.frameDuration;
      const startSample = Math.floor(f * hopSize);

      const rawFreqs = new Uint8Array(numBins);
      const rawWave = new Uint8Array(numBins);

      for (let i = 0; i < numBins; i++) {
        const sampleIdx = startSample + i;
        const sampleVal = sampleIdx < channelData.length ? channelData[sampleIdx] : 0;
        
        // Map Float32 PCM [-1, 1] to Uint8 Waveform [0, 255]
        rawWave[i] = Math.min(255, Math.max(0, Math.floor(128 + sampleVal * 127)));

        // Simulated frequency bin magnitude calculation
        const freqMag = Math.abs(sampleVal) * Math.exp(- (i / numBins) * 1.8);
        rawFreqs[i] = Math.min(255, Math.max(0, Math.floor(freqMag * 255)));
      }

      this.fftCache[f] = this.beatEngine.processFrame(time, rawFreqs, rawWave, sampleRate);
    }

    return this.fftCache;
  }

  /**
   * Generates synthetic audio timeline cache for testing or synth demo tracks.
   */
  generateSyntheticTimeline(duration = 10.0, numBins = 64) {
    this.duration = duration;
    const totalFrames = Math.ceil(this.duration * this.fps);
    this.fftCache = new Array(totalFrames);

    for (let f = 0; f < totalFrames; f++) {
      const time = f * this.frameDuration;
      const rawFreqs = new Uint8Array(numBins);
      const rawWave = new Uint8Array(numBins);

      const bassPulse = Math.pow(Math.max(0, Math.sin(time * Math.PI * 4)), 3);

      for (let i = 0; i < numBins; i++) {
        const norm = i / numBins;
        const env = Math.exp(-norm * 2.5);
        const waveVal = Math.sin(time * 10 + i * 0.2) * 0.5 + Math.cos(time * 5 + i * 0.1) * 0.3;
        
        rawWave[i] = Math.min(255, Math.max(0, Math.floor(128 + waveVal * 120)));

        const mag = (0.2 + bassPulse * 0.7 * (1 - norm) + Math.sin(time * 8 + i) * 0.1) * env;
        rawFreqs[i] = Math.min(255, Math.max(0, Math.floor(mag * 255)));
      }

      this.fftCache[f] = this.beatEngine.processFrame(time, rawFreqs, rawWave, 44100);
    }

    return this.fftCache;
  }

  /**
   * Deterministic timeline lookup with LERP linear interpolation between adjacent frames.
   */
  getAudioDataAtTimestamp(timestamp) {
    if (!this.fftCache || this.fftCache.length === 0) {
      this.generateSyntheticTimeline(10.0);
    }

    const clampedTime = Math.min(Math.max(0, timestamp), this.duration);
    const exactFrame = clampedTime * this.fps;
    const frameAIndex = Math.min(Math.floor(exactFrame), this.fftCache.length - 1);
    const frameBIndex = Math.min(frameAIndex + 1, this.fftCache.length - 1);
    const factor = exactFrame - frameAIndex;

    const stateA = this.fftCache[frameAIndex];
    const stateB = this.fftCache[frameBIndex];

    if (factor === 0 || frameAIndex === frameBIndex) {
      return stateA;
    }

    // LERP Float32Array frequencies
    const len = Math.min(stateA.frequencies.length, stateB.frequencies.length);
    const lerpFreqs = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      lerpFreqs[i] = stateA.frequencies[i] + (stateB.frequencies[i] - stateA.frequencies[i]) * factor;
    }

    // LERP Float32Array waveform
    const waveLen = Math.min(stateA.waveform.length, stateB.waveform.length);
    const lerpWave = new Float32Array(waveLen);
    for (let i = 0; i < waveLen; i++) {
      lerpWave[i] = stateA.waveform[i] + (stateB.waveform[i] - stateA.waveform[i]) * factor;
    }

    return {
      time: clampedTime,
      subBass: stateA.subBass + (stateB.subBass - stateA.subBass) * factor,
      bass: stateA.bass + (stateB.bass - stateA.bass) * factor,
      lowMid: stateA.lowMid + (stateB.lowMid - stateA.lowMid) * factor,
      mid: stateA.mid + (stateB.mid - stateA.mid) * factor,
      highMid: stateA.highMid + (stateB.highMid - stateA.highMid) * factor,
      treble: stateA.treble + (stateB.treble - stateA.treble) * factor,
      energy: stateA.energy + (stateB.energy - stateA.energy) * factor,
      RMS: stateA.RMS + (stateB.RMS - stateA.RMS) * factor,
      kick: factor < 0.5 ? stateA.kick : stateB.kick,
      snare: factor < 0.5 ? stateA.snare : stateB.snare,
      beatStrength: stateA.beatStrength + (stateB.beatStrength - stateA.beatStrength) * factor,
      spectralFlux: stateA.spectralFlux + (stateB.spectralFlux - stateA.spectralFlux) * factor,
      frequencies: lerpFreqs,
      waveform: lerpWave
    };
  }
}
