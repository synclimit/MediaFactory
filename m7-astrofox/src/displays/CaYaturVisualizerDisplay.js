import Display from 'core/Display';
import { CaYaturVisualizers, CAYATUR_VIZ_MODES } from 'visualizer/cayatur/modes';

export default class CaYaturVisualizerDisplay extends Display {
  static config = {
    name: 'CaYaturVisualizerDisplay',
    description: 'Unique audio visualizers from CaYatur (3D Terrain, Spectrogram, Ribbon, 3D Orb, Dot Matrix).',
    type: 'display',
    label: 'CaYatur Visualizer',
    defaultProperties: {
      width: 800,
      height: 280,
      x: 0,
      y: 0,
      mode: 'terrain',
      rotation: 0,
      opacity: 1.0,
    },
  };

  constructor(properties = {}) {
    super(CaYaturVisualizerDisplay, properties);
    const { width = 800, height = 280 } = this.properties;

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
    } else {
      this.canvas = new OffscreenCanvas(width, height);
    }
    this.canvas.width = Math.max(50, Math.round(width));
    this.canvas.height = Math.max(20, Math.round(height));
    this.ctx = this.canvas.getContext('2d');

    this.engine = new CaYaturVisualizers();
    this.lastTime = Date.now();
  }

  update(properties = {}) {
    const changed = super.update(properties);
    const { width, height } = this.properties;
    if (width && height && (this.canvas.width !== Math.round(width) || this.canvas.height !== Math.round(height))) {
      this.canvas.width = Math.max(50, Math.round(width));
      this.canvas.height = Math.max(20, Math.round(height));
    }
    return changed;
  }

  render(scene, data = {}) {
    if (!this.canvas || !this.ctx || !this.engine) return;

    const now = Date.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0.016);
    this.lastTime = now;

    // Clear transparent
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Compute band energies from FFT
    let bass = 0;
    let mid = 0;
    let treble = 0;

    const fft = data.fft;
    if (fft && fft.length > 0) {
      const len = fft.length;
      const bEnd = Math.floor(len * 0.12);
      const mEnd = Math.floor(len * 0.5);

      let bSum = 0;
      for (let i = 0; i < bEnd; i++) bSum += fft[i];
      bass = bSum / (bEnd || 1) / 255;

      let mSum = 0;
      for (let i = bEnd; i < mEnd; i++) mSum += fft[i];
      mid = mSum / ((mEnd - bEnd) || 1) / 255;

      let tSum = 0;
      for (let i = mEnd; i < len; i++) tSum += fft[i];
      treble = tSum / ((len - mEnd) || 1) / 255;
    }

    const mode = this.properties.mode || 'terrain';
    this.engine.draw(mode, this.ctx, this.canvas.width, this.canvas.height, { fft, bass, mid, treble }, dt);

    const origin = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };

    if (scene && scene.renderToCanvas) {
      scene.renderToCanvas(this.canvas, this.properties, origin);
    }
  }
}
