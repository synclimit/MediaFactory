import { Texture, LinearFilter } from 'three';
import Display from 'core/Display';
import ImagePass from 'graphics/ImagePass';
import { CaYaturBackgrounds, CAYATUR_BG_PRESETS } from 'visualizer/cayatur/backgrounds';

export default class CaYaturBackgroundDisplay extends Display {
  static config = {
    name: 'CaYaturBackgroundDisplay',
    description: 'Procedural audio-reactive background generator from CaYatur.',
    type: 'display',
    label: 'CaYatur Procedural Background',
    defaultProperties: {
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      preset: 'fluid',
      speed: 1.0,
      opacity: 1.0,
    },
  };

  constructor(properties = {}) {
    super(CaYaturBackgroundDisplay, properties);
    const { width = 1920, height = 1080 } = this.properties;

    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.max(50, Math.round(width));
    this.canvas.height = Math.max(20, Math.round(height));
    this.ctx = this.canvas.getContext('2d');

    this.engine = new CaYaturBackgrounds();
    this.lastTime = Date.now();

    this.texture = new Texture(this.canvas);
    this.texture.minFilter = LinearFilter;
    this.texture.magFilter = LinearFilter;
    this.pass = new ImagePass(this.texture, { width, height });
  }

  addToScene({ getSize }) {
    const size = getSize ? getSize() : { width: 1920, height: 1080 };
    const width = size.width || 1920;
    const height = size.height || 1080;
    this.setSize(width, height);
  }

  setSize(width, height) {
    if (this.canvas && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.pass) {
      this.pass.camera.aspect = width / height;
      this.pass.camera.updateProjectionMatrix();
    }
  }

  update(properties = {}) {
    const changed = super.update(properties);
    const { width, height, opacity, zoom } = this.properties;
    if (width && height && (this.canvas.width !== Math.round(width) || this.canvas.height !== Math.round(height))) {
      this.canvas.width = Math.max(50, Math.round(width));
      this.canvas.height = Math.max(20, Math.round(height));
    }
    if (this.pass && opacity !== undefined) {
      this.pass.material.opacity = opacity;
    }
    if (this.pass && zoom !== undefined) {
      this.pass.camera.zoom = zoom;
      this.pass.camera.updateProjectionMatrix();
    }
    return changed;
  }

  render(scene, data = {}) {
    if (!this.canvas || !this.ctx || !this.engine) return;

    const now = Date.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0.016);
    this.lastTime = now;

    // Compute band energies from FFT
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let rms = 0;

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

      rms = (bass * 0.5 + mid * 0.35 + treble * 0.15);
    }

    const preset = this.properties.preset || 'fluid';
    this.engine.draw(preset, this.ctx, this.canvas.width, this.canvas.height, { bass, mid, treble, rms, fft }, dt);

    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }
}
