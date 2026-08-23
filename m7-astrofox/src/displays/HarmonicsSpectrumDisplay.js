import Display from 'core/Display';
import { FFTVisualizer } from 'visualizer/harmonics/FFTVisualizer';
import { builtinPresets, defaultSettings } from 'visualizer/harmonics/presets';
import { gradientNames } from 'visualizer/harmonics/gradients';
import { property, stageWidth, stageHeight } from 'utils/controls';

const presetNames = builtinPresets.map(p => p.name);

export default class HarmonicsSpectrumDisplay extends Display {
  static config = {
    name: 'HarmonicsSpectrumDisplay',
    description: 'GPU WebGL FFT Audio Visualizer from harmonics-audio.',
    type: 'display',
    label: 'Harmonics FFT Spectrum',
    defaultProperties: {
      width: 800,
      height: 280,
      x: 0,
      y: 0,
      preset: 'stereo glow',
      gradient: 'rainbow',
      bands: 80,
      showPeaks: true,
      peakDecay: 0.99,
      ledBars: false,
      ledShape: 'segment',
      lumiBars: false,
      radial: false,
      radialInnerRadius: 0.35,
      barSpace: 0.35,
      reflexRatio: 0.35,
      reflexAlpha: 0.5,
      glow: 1.0,
      rotation: 0,
      noiseFloor: 65,
      smoothing: 0.65,
      stereo: true,
      opacity: 1.0,
      background: 'transparent'
    },
    controls: {
      preset: {
        label: 'Preset',
        type: 'select',
        items: presetNames
      },
      gradient: {
        label: 'Color Theme',
        type: 'select',
        items: gradientNames
      },
      bands: {
        label: 'Bands',
        type: 'select',
        items: [10, 20, 40, 80]
      },
      glow: {
        label: 'Glow Intensity',
        type: 'number',
        min: 0,
        max: 1.0,
        step: 0.05,
        withRange: true
      },
      radial: {
        label: 'Radial Circle Mode',
        type: 'toggle'
      },
      radialInnerRadius: {
        label: 'Inner Hole Radius',
        type: 'number',
        min: 0,
        max: 0.9,
        step: 0.05,
        withRange: true,
        hidden: property('radial', r => !r)
      },
      ledBars: {
        label: 'LED Segment Style',
        type: 'toggle'
      },
      stereo: {
        label: 'Stereo Split Channels',
        type: 'toggle'
      },
      reflexRatio: {
        label: 'Mirror Reflection Ratio',
        type: 'number',
        min: 0,
        max: 0.7,
        step: 0.05,
        withRange: true
      },
      reflexAlpha: {
        label: 'Mirror Opacity',
        type: 'number',
        min: 0,
        max: 1.0,
        step: 0.05,
        withRange: true
      },
      smoothing: {
        label: 'Temporal Smoothing',
        type: 'number',
        min: 0,
        max: 0.95,
        step: 0.01,
        withRange: true
      },
      noiseFloor: {
        label: 'Noise Floor Cutoff',
        type: 'number',
        min: 0,
        max: 200,
        step: 5,
        withRange: true
      },
      width: {
        label: 'Width',
        type: 'number',
        min: 50,
        max: stageWidth(),
        withRange: true
      },
      height: {
        label: 'Height',
        type: 'number',
        min: 20,
        max: stageHeight(),
        withRange: true
      },
      x: {
        label: 'X',
        type: 'number',
        min: stageWidth(n => -n),
        max: stageWidth(),
        withRange: true
      },
      y: {
        label: 'Y',
        type: 'number',
        min: stageHeight(n => -n),
        max: stageHeight(),
        withRange: true
      },
      rotation: {
        label: 'Rotation',
        type: 'select',
        items: [0, 90, 180, 270]
      },
      opacity: {
        label: 'Opacity',
        type: 'number',
        min: 0,
        max: 1.0,
        step: 0.01,
        withRange: true
      }
    }
  };

  constructor(properties) {
    super(HarmonicsSpectrumDisplay, properties);

    const { width = 800, height = 280 } = this.properties;

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
    } else {
      this.canvas = new OffscreenCanvas(width, height);
    }
    this.canvas.width = Math.max(50, Math.round(width));
    this.canvas.height = Math.max(20, Math.round(height));

    this.viz = new FFTVisualizer(this.canvas, {
      ...this.properties,
      background: 'transparent'
    });

    if (this.properties.preset) {
      this.applyPreset(this.properties.preset);
    }
  }

  applyPreset(presetName) {
    const found = builtinPresets.find(p => p.name === presetName);
    if (found) {
      const newSettings = { ...found.settings, preset: presetName };
      delete newSettings.background;
      this.update(newSettings);
    }
  }

  update(properties = {}) {
    if (properties.preset) {
      const found = builtinPresets.find(p => p.name === properties.preset);
      if (found) {
        properties = { ...found.settings, ...properties };
        delete properties.background;
      }
    }

    const changed = super.update(properties);

    const { width, height } = this.properties;
    if (width && height && (this.canvas.width !== Math.round(width) || this.canvas.height !== Math.round(height))) {
      this.canvas.width = Math.max(50, Math.round(width));
      this.canvas.height = Math.max(20, Math.round(height));
    }
    if (this.viz) {
      this.viz.setOptions({
        ...this.properties,
        background: 'transparent'
      });
    }

    return changed;
  }

  render(scene, data) {
    if (!this.canvas || !this.viz) return;

    if (data && data.fft) {
      this.viz.feedData(data.fft);
    }

    this.viz.drawSpectrum();

    const origin = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    };

    scene.renderToCanvas(this.canvas, this.properties, origin);
  }

  removeFromScene() {
    if (this.viz) {
      this.viz.destroy();
    }
  }
}
