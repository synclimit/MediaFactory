/**
 * Presets from harmonics-audio/fft-visualizer
 * License: MIT
 */

export const defaultSettings = {
  bands: 80,
  showPeaks: false,
  peakDecay: 0.99,
  ledBars: false,
  ledShape: 'segment',
  lumiBars: false,
  radial: false,
  radialInnerRadius: 0.35,
  barSpace: 0.35,
  reflexRatio: 0,
  reflexAlpha: 0.5,
  glow: 0,
  rotation: 0,
  gradient: 'rainbow',
  gradientDirection: 'horizontal',
  colorMode: 'gradient',
  noiseFloor: 0,
  smoothing: 0.6,
  stereo: false,
  background: 'transparent'
};

export const builtinPresets = [
  {
    name: 'stereo glow',
    settings: { ...defaultSettings, barSpace: 0.4, reflexRatio: 0.35, glow: 1, noiseFloor: 65, smoothing: 0.65, stereo: true }
  },
  {
    name: 'reflected',
    settings: { ...defaultSettings, peakDecay: 0.988, barSpace: 0.45, reflexRatio: 0.35, reflexAlpha: 0.25, glow: 0.1, noiseFloor: 50, smoothing: 0.7 }
  },
  {
    name: 'disco',
    settings: { ...defaultSettings, radial: true, barSpace: 0.2, reflexRatio: 0.65, glow: 0.9, noiseFloor: 55, smoothing: 0.65 }
  },
  {
    name: 'disco stereo',
    settings: { ...defaultSettings, radial: true, radialInnerRadius: 0.5, barSpace: 0.2, reflexRatio: 0.65, glow: 1, rotation: 180, gradient: 'mono', colorMode: 'bar-level', noiseFloor: 40, smoothing: 0.5, stereo: true }
  },
  {
    name: 'lazers',
    settings: { ...defaultSettings, bands: 40, radial: true, radialInnerRadius: 0, glow: 1, noiseFloor: 70, smoothing: 0.5, stereo: true }
  },
  {
    name: 'fireplace',
    settings: { ...defaultSettings, glow: 1, noiseFloor: 75, smoothing: 0.9 }
  },
  {
    name: 'stereo peaks',
    settings: { ...defaultSettings, showPeaks: true, peakDecay: 0.98, glow: 0.25, smoothing: 0.4, stereo: true }
  },
  {
    name: 'vertical glowing',
    settings: { ...defaultSettings, bands: 40, barSpace: 0.05, reflexRatio: 0.35, reflexAlpha: 0.25, glow: 1, rotation: 270, colorMode: 'bar-level', noiseFloor: 20, smoothing: 0.65, stereo: true }
  },
  {
    name: 'vertical lumi bars',
    settings: { ...defaultSettings, bands: 10, showPeaks: true, lumiBars: true, barSpace: 0.05, reflexRatio: 0.35, reflexAlpha: 0.25, glow: 1, rotation: 270, colorMode: 'bar-level', noiseFloor: 20, smoothing: 0.65, stereo: true }
  },
  {
    name: 'horizontal lumi bars',
    settings: { ...defaultSettings, bands: 40, showPeaks: true, lumiBars: true, barSpace: 0.05, reflexRatio: 0.35, reflexAlpha: 0.25, glow: 1, colorMode: 'bar-level', noiseFloor: 20, smoothing: 0.65, stereo: true }
  },
  {
    name: 'vertical peaks',
    settings: { ...defaultSettings, bands: 20, showPeaks: true, peakDecay: 0.991, barSpace: 0.25, reflexRatio: 0.35, reflexAlpha: 0.25, glow: 0.45, rotation: 270, noiseFloor: 15, smoothing: 0.65, stereo: true }
  },
  {
    name: 'sonic spikes',
    settings: { ...defaultSettings, bands: 120, radial: true, radialInnerRadius: 0.2, barSpace: 0.15, reflexRatio: 0.8, glow: 1.0, noiseFloor: 30, smoothing: 0.45, stereo: true }
  },
  {
    name: 'circular 360',
    settings: { ...defaultSettings, bands: 96, radial: true, radialInnerRadius: 0.45, barSpace: 0.2, glow: 0.9, noiseFloor: 40, smoothing: 0.6, stereo: false }
  },
  {
    name: 'energy ribbon',
    settings: { ...defaultSettings, bands: 64, barSpace: 0.05, glow: 1.0, reflexRatio: 0.4, reflexAlpha: 0.3, noiseFloor: 45, smoothing: 0.85, stereo: true }
  }
];
