import { VisualizerV5Audio } from '../v5/VisualizerV5Audio.js';

export class VisualizerV4Audio {
  static generateSyntheticState(timestamp = 0, binCount = 64) {
    return VisualizerV5Audio.generateAbstractFFT(timestamp, binCount);
  }

  static parseColor(colorStr, defaultColor = '#FF8800') {
    if (!colorStr || typeof colorStr !== 'string') return defaultColor;
    return colorStr.trim();
  }
}
