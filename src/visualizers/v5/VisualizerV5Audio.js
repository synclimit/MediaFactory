/**
 * VisualizerV5Audio.js
 * Visualizer V5 Audio State & FFT Utility
 * Single Source of Truth for Audio & Abstract Math Data across Live Editor & Render Exporter.
 */

export class VisualizerV5Audio {
  /**
   * Shared Deterministic Abstract FFT Generator for 'fast' mode & paused snapshots.
   * Produces smooth, multi-octave non-audio-bound spectrum frequencies [0.0, 1.0].
   * @param {number} timestamp  Time in seconds
   * @param {number} barCount   Number of frequency bins (default 64)
   * @returns {{ frequencies: Float32Array, waveform: Float32Array, energy: number, bass: number, mid: number, treble: number }}
   */
  static generateAbstractFFT(timestamp = 0, barCount = 64) {
    const count = Math.max(16, Math.min(256, barCount));
    const frequencies = new Float32Array(count);
    const waveform = new Float32Array(count);

    const t = timestamp || 0;
    const bpm = 130;
    const beatPeriod = 60 / bpm; // ~0.4615s per beat
    const beatPhase = (t % beatPeriod) / beatPeriod; // [0, 1)

    // 1. Snappy 4-on-the-floor Kick Transient (exponential fast attack + punchy release)
    const kickCurve = Math.max(0, 1 - beatPhase * 3.2);
    const kickPunch = Math.pow(kickCurve, 2.0); // sharp percussive transient

    // 2. Off-beat Snare / Clap pop (on beats 2 & 4)
    const measurePhase = (t % (beatPeriod * 2)) / (beatPeriod * 2);
    const snareHit = measurePhase > 0.5 ? Math.max(0, 1 - (measurePhase - 0.5) * 6.0) : 0;
    const snarePop = Math.pow(snareHit, 2.5);

    // 3. 16th-note Rapid Groove / Hi-Hat Pulse
    const sixteenthPhase = (t % (beatPeriod / 4)) / (beatPeriod / 4);
    const hatTick = Math.max(0, 1 - sixteenthPhase * 4.5) * 0.35;

    // 4. Dynamic build-up and drop wave modulation
    const phraseMod = 0.88 + 0.12 * Math.sin(t * 0.5);

    let energySum = 0;

    for (let i = 0; i < count; i++) {
      const freqNorm = i / count; // 0.0 (sub-bass) to 1.0 (treble)
      const barPhase = Math.sin(i * 19.123 + 47.89) * 43758.5453;
      const barSeed = barPhase - Math.floor(barPhase);

      // Multi-layer high-energy oscillators
      const oscBass = Math.sin(t * 7.5 + barSeed * 6.28);
      const oscMid = Math.cos(t * 14.2 + freqNorm * 18.0 + barSeed * 4.0);
      const oscHigh = Math.sin(t * 26.5 + freqNorm * 32.0 + barSeed * 8.0);
      const oscJitter = Math.cos(t * 42.0 + i * 5.7) * 0.25;

      // Equalized multi-band base energy (Bass, Mids, Highs all stay lively)
      let baseVal = 0;
      if (freqNorm < 0.2) {
        // Sub-Bass & Bass (Punchy, deep, bouncing)
        const subPulse = Math.abs(oscBass * 0.55 + oscMid * 0.45);
        baseVal = subPulse * 0.65 + kickPunch * 0.55;
      } else if (freqNorm < 0.6) {
        // Mid-Range & Vocals (Dancing melodic movement + snare response)
        const midDance = Math.abs(oscMid * 0.5 + oscHigh * 0.35 + oscJitter * 0.15);
        baseVal = midDance * 0.70 + snarePop * 0.40 + kickPunch * 0.20;
      } else {
        // Treble & Highs (Sparkling rapid hi-hats, airy top-end)
        const highSparkle = Math.abs(oscHigh * 0.55 + oscJitter * 0.45);
        baseVal = highSparkle * 0.65 + hatTick * 0.45 + snarePop * 0.30;
      }

      // Add lively per-bar texture so adjacent bars bounce independently
      const microJitter = (barSeed - 0.5) * 0.12;
      const finalVal = Math.min(0.98, Math.max(0.06, (baseVal + microJitter) * phraseMod));

      frequencies[i] = finalVal;
      energySum += finalVal;

      waveform[i] = Math.sin(t * 18 + freqNorm * Math.PI * 6) * 0.45 + Math.cos(t * 32 + i * 0.5) * 0.15;
    }

    const energy = energySum / count;
    const bass = frequencies[Math.min(2, count - 1)] || energy;
    const mid = frequencies[Math.min(Math.floor(count * 0.35), count - 1)] || energy;
    const treble = frequencies[Math.min(Math.floor(count * 0.75), count - 1)] || energy;

    return {
      time: t,
      energy,
      RMS: energy,
      bass,
      mid,
      treble,
      kick: kickPunch > 0.4,
      snare: snarePop > 0.35,
      beatStrength: energy,
      spectralFlux: energy,
      frequencies,
      waveform
    };
  }

  /**
   * Resolves audio state according to mode:
   * - 'fast': Always returns deterministic abstract FFT state (animated math generator).
   * - 'normal': Spectrum is flat/still when paused. When playing, reads live BeatEngine / Web Audio FFT frequency data.
   */
  static getAudioState(timestamp = 0, mode = 'normal', config = {}, liveFrequencies = null, isPlaying = false) {
    const barCount = parseInt(config.barCount) || 64;
    const isFastWorkspace = typeof window !== 'undefined' && (window.m3RenderMode === 'fast' || window.__m3FastWorkspaceActive);
    const renderMode = String(mode || config.renderMode || (isFastWorkspace ? 'fast' : 'normal')).toLowerCase();

    // Mode 'fast' completely bypasses BeatEngine and live audio, always uses abstract math generator
    if (renderMode === 'fast') {
      return this.generateAbstractFFT(timestamp, barCount);
    }

    // Mode 'normal':
    // If not playing (paused/stopped), spectrum is completely STILL / DIAM (baseline flat)
    const playingState = isPlaying || (typeof window !== 'undefined' && Boolean(window.m3IsPlaying));
    if (!playingState && typeof window !== 'undefined') {
      const freqs = new Float32Array(barCount);
      freqs.fill(0.02);
      const waveform = new Float32Array(barCount);
      return {
        time: timestamp,
        energy: 0,
        RMS: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        kick: false,
        snare: false,
        beatStrength: 0,
        spectralFlux: 0,
        frequencies: freqs,
        waveform
      };
    }

    // Mode 'normal' while playing: read live frequency data via Logarithmic Octave Binning
    let freqsSource = liveFrequencies;
    if ((!freqsSource || freqsSource.length === 0) && typeof window !== 'undefined') {
      try {
        if (window.m3Analyser) {
          if (window.m3Analyser.context && window.m3Analyser.context.state === 'suspended') {
            window.m3Analyser.context.resume().catch(() => {});
          }
          if (typeof window.m3Analyser.getFrequencyData === 'function') {
            freqsSource = window.m3Analyser.getFrequencyData();
          }
        } else if (window.beatEngine && typeof window.beatEngine.getSpectrum === 'function') {
          freqsSource = window.beatEngine.getSpectrum();
        }
      } catch (e) {}
    }

    if (freqsSource && freqsSource.length > 0) {
      const srcLen = freqsSource.length;
      let rawSum = 0;
      for (let k = 0; k < Math.min(128, srcLen); k++) {
        const v = freqsSource[k];
        rawSum += typeof v === 'number' ? (v > 1 ? v / 255 : v) : 0;
      }

      // If Web Audio API returns all 0s / silence while playing, fall back to synthetic abstract FFT generator
      if (rawSum < 0.01) {
        return this.generateAbstractFFT(timestamp, barCount);
      }

      const freqs = new Float32Array(barCount);
      let sum = 0;

      if (srcLen === barCount) {
        // Direct 1:1 mapping when frequencies are already binned
        for (let i = 0; i < barCount; i++) {
          const raw = typeof freqsSource[i] === 'number' ? freqsSource[i] : 0;
          const val = raw > 1 ? raw / 255 : raw;
          const normalizedVal = Math.min(1.0, Math.max(0.02, val));
          freqs[i] = normalizedVal;
          sum += normalizedVal;
        }
      } else {
        // Logarithmic / Octave frequency mapping for raw FFT data (e.g., AnalyserNode 256/1024 bins)
        const minBin = 1;
        const maxBin = Math.min(srcLen - 1, Math.floor(srcLen * 0.75));

        for (let i = 0; i < barCount; i++) {
          const startPct = Math.pow(i / barCount, 2.0);
          const endPct = Math.pow((i + 1) / barCount, 2.0);

          const startBin = Math.min(srcLen - 1, Math.max(0, Math.floor(minBin + startPct * (maxBin - minBin))));
          const endBin = Math.min(srcLen - 1, Math.max(startBin + 1, Math.floor(minBin + endPct * (maxBin - minBin))));

          let binSum = 0;
          let binCount = 0;
          for (let b = startBin; b < endBin; b++) {
            const raw = typeof freqsSource[b] === 'number' ? freqsSource[b] : 0;
            binSum += raw > 1 ? raw / 255 : raw;
            binCount++;
          }

          const avgVal = binCount > 0 ? binSum / binCount : 0;
          const boost = 1.0 + (i / barCount) * 1.5; // High-frequency boost for equalized visual response
          const normalizedVal = Math.min(1.0, Math.max(0.02, avgVal * boost));

          freqs[i] = normalizedVal;
          sum += normalizedVal;
        }
      }

      const energy = sum / barCount;
      const bass = (freqs[0] + freqs[1] + freqs[2] + freqs[3]) / 4;
      const mid = freqs[Math.floor(barCount * 0.35)] || energy;
      const treble = freqs[Math.floor(barCount * 0.75)] || energy;

      const waveform = new Float32Array(barCount);
      for (let i = 0; i < barCount; i++) {
        waveform[i] = Math.sin(timestamp * 14 + (i / barCount) * Math.PI * 4) * (energy * 0.5);
      }

      return {
        time: timestamp,
        energy,
        RMS: energy,
        bass,
        mid,
        treble,
        kick: bass > 0.45,
        snare: treble > 0.4,
        beatStrength: energy,
        spectralFlux: energy,
        frequencies: freqs,
        waveform
      };
    }

    // Fallback if playing in export mode without live Web Audio API
    return this.generateAbstractFFT(timestamp, barCount);
  }
}
