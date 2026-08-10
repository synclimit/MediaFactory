/**
 * Visualizer V4 Audio Math & State Utility
 * Single Source of Truth for Deterministic Frequency & Waveform Data
 */

export class VisualizerV4Audio {
  static generateSyntheticState(timestamp = 0, binCount = 64) {
    const frequencies = new Float32Array(binCount);
    const waveform = new Float32Array(binCount);

    const frameIndex = Math.floor(timestamp * 60);
    const frameCount = 300;
    const normalizedLoopTime = (frameIndex % frameCount) / frameCount;
    const tAngle = normalizedLoopTime * Math.PI * 2;

    let energySum = 0;

    for (let i = 0; i < binCount; i++) {
      const freqNorm = i / binCount;
      const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const barSeed = barPhase - Math.floor(barPhase);
      const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
      const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
      const envelope = Math.exp(-freqNorm * 2.2);
      const rawVal = (0.5 * oct1 + 0.5 * oct2) * envelope;
      
      const val = Math.min(1.0, Math.max(0.05, Math.abs(rawVal)));
      frequencies[i] = val;
      energySum += val;

      waveform[i] = Math.sin(timestamp * 20 + (i / binCount) * Math.PI * 4) * 0.5;
    }

    const energy = energySum / binCount;

    return {
      time: timestamp,
      energy,
      RMS: energy,
      beatStrength: energy,
      subBass: frequencies[0] || 0,
      bass: frequencies[Math.min(2, binCount - 1)] || 0,
      lowMid: frequencies[Math.min(12, binCount - 1)] || 0,
      mid: frequencies[Math.min(25, binCount - 1)] || 0,
      highMid: frequencies[Math.min(40, binCount - 1)] || 0,
      treble: frequencies[Math.min(55, binCount - 1)] || 0,
      frequencies,
      waveform
    };
  }

  static parseColor(colorStr, defaultColor = '#FF8800') {
    if (!colorStr || typeof colorStr !== 'string') return defaultColor;
    return colorStr.trim();
  }
}
