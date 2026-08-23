import CanvasDisplay from 'core/CanvasDisplay';
import { ParticleEngine } from 'visualizer/particles/ParticleEngine';

export const SHAPES = [
  'shape_circle',
  'shape_square',
  'shape_triangle',
  'shape_diamond',
  'shape_hexagon',
  'shape_star',
  'shape_heart',
  'shape_music_note',
  'shape_lightning',
  'shape_flame',
  'shape_snowflake',
  'shape_leaf',
  'shape_feather',
  'shape_bubble',
  'shape_droplet',
  'shape_crystal',
  'shape_pixel',
  'shape_ring',
];

export const FLOWS = [
  'flow_static',
  'flow_drift',
  'flow_float',
  'flow_rain',
  'flow_snow',
  'flow_wind_left',
  'flow_wind_right',
  'flow_swirl',
  'flow_spiral',
  'flow_orbit',
  'flow_explosion',
  'flow_implosion',
  'flow_starfield',
  'flow_pulse',
  'flow_wave',
  'flow_fountain',
];

export const TRAILS = [
  'trail_none',
  'trail_fade',
  'trail_glow',
  'trail_light',
  'trail_smoke',
  'trail_fire',
  'trail_energy',
  'trail_rainbow',
  'trail_dotted',
  'trail_pixel',
];

export const BLEND_MODES = ['Normal', 'Screen', 'Multiply', 'Add', 'Overlay'];

export default class ParticleDisplay extends CanvasDisplay {
  static config = {
    name: 'ParticleDisplay',
    description: 'Full-screen 2D & procedural particle system with customizable shapes, flows, trails, and beat reactivity.',
    type: 'display',
    label: 'Particle System',
    defaultProperties: {
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      shape: 'shape_circle',
      flow: 'flow_float',
      trail: 'trail_none',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      opacity: 100,
      blendMode: 'Screen',
      count: 50,
      scale: 1.0,
      randomScale: true,
      rotation: 0,
      randomRotation: true,
      speed: 1.0,
      beatReactive: true,
    },
  };

  constructor(properties = {}) {
    super(ParticleDisplay, properties);
    const { width = 1920, height = 1080 } = this.properties;

    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
    } else {
      this.canvas = new OffscreenCanvas(width, height);
    }
    this.canvas.width = Math.max(100, Math.round(width));
    this.canvas.height = Math.max(100, Math.round(height));
    this.ctx = this.canvas.getContext('2d');

    this.engine = new ParticleEngine();
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
    this.engine.draw(this.ctx, this.canvas.width, this.canvas.height, this.properties, data);

    const origin = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };

    if (scene && scene.renderToCanvas) {
      scene.renderToCanvas(this.canvas, this.properties, origin);
    }
  }
}
