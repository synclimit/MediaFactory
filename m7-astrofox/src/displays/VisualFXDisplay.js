import CanvasDisplay from 'core/CanvasDisplay';
import { VisualFXEngine, ALL_EFFECTS, GENRE_PRESETS } from 'visualizer/fx/VisualFXEngine';

export { ALL_EFFECTS, GENRE_PRESETS };

export default class VisualFXDisplay extends CanvasDisplay {
  static config = {
    name: 'VisualFXDisplay',
    description: 'Post-processing & visual effect overlay system matching MediaFactory M3.',
    type: 'display',
    label: 'Visual FX',
    defaultProperties: {
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      effects: [],
    },
  };

  constructor(properties = {}) {
    super(VisualFXDisplay, properties);
    const { width = 1920, height = 1080 } = this.properties;

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
    } else {
      this.canvas = new OffscreenCanvas(width, height);
    }
    this.canvas.width = Math.max(100, Math.round(width));
    this.canvas.height = Math.max(100, Math.round(height));
    this.ctx = this.canvas.getContext('2d');

    this.engine = new VisualFXEngine();
  }

  update(properties = {}) {
    const changed = super.update(properties);
    const { width, height } = this.properties;
    if (width && height && (this.canvas.width !== Math.round(width) || this.canvas.height !== Math.round(height))) {
      this.canvas.width = Math.max(100, Math.round(width));
      this.canvas.height = Math.max(100, Math.round(height));
    }
    return changed;
  }

  render(scene, data = {}) {
    if (!this.canvas || !this.ctx || !this.engine) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const effects = this.properties.effects || [];
    if (effects.length > 0) {
      this.engine.render(this.ctx, this.canvas.width, this.canvas.height, effects, data);
    }

    const origin = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };

    if (scene && scene.renderToCanvas) {
      scene.renderToCanvas(this.canvas, this.properties, origin);
    }
  }
}
