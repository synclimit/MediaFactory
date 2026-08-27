import Display from 'core/Display';
import Effect from 'core/Effect';
import EntityList from 'core/EntityList';
import Composer from 'graphics/Composer';
import { renderImageToCanvas } from '../utils/canvas';

const blendOptions = [
  'None',
  'Normal',
  null,
  'Darken',
  'Multiply',
  'Color Burn',
  'Linear Burn',
  null,
  'Lighten',
  'Screen',
  'Color Dodge',
  'Linear Dodge',
  null,
  'Overlay',
  'Soft Light',
  'Hard Light',
  'Vivid Light',
  'Linear Light',
  'Pin Light',
  'Hard Mix',
  null,
  'Difference',
  'Exclusion',
  'Subtract',
  'Divide',
  null,
  'Negation',
  'Phoenix',
  'Glow',
  'Reflect',
];

export default class Scene extends Display {
  static config = {
    name: 'Scene',
    description: 'Scene display.',
    type: 'display',
    label: 'Scene',

    defaultProperties: {
      blendMode: 'Normal',
      opacity: 1.0,
      mask: false,
      inverse: false,
      stencil: false,
    },
    controls: {
      blendMode: {
        label: 'Blending',
        type: 'select',
        items: blendOptions,
      },
      opacity: {
        label: 'Opacity',
        type: 'number',
        min: 0,
        max: 1.0,
        step: 0.01,
        withRange: true,
        withReactor: true,
      },
      mask: {
        label: 'Mask',
        type: 'toggle',
      },
      inverse: {
        label: 'Inverse',
        type: 'toggle',
        hidden: display => !display.properties.mask,
      },
    },
  };

  constructor(properties) {
    super(Scene, properties);

    this.stage = null;
    this.displays = new EntityList();
    this.effects = new EntityList();

    this.renderToCanvas = this.renderToCanvas.bind(this);
    this.renderToScene = this.renderToScene.bind(this);
    this.getSize = this.getSize.bind(this);
  }

  addToStage(stage) {
    this.composer = new Composer(stage.renderer);
  }

  removeFromStage() {
    this.displays.clear();
    this.effects.clear();
    this.composer.dispose();
  }

  getSize() {
    return this.composer.getSize();
  }

  setSize(width, height) {
    this.displays.forEach(display => {
      if (display.setSize) {
        display.setSize(width, height);
      }
    });

    this.effects.forEach(effect => {
      if (effect.setSize) {
        effect.setSize(width, height);
      }
    });

    this.composer.setSize(width, height);
  }

  getTarget(obj) {
    return obj instanceof Effect ? this.effects : this.displays;
  }

  getElementById(id) {
    return this.displays.getElementById(id) || this.effects.getElementById(id);
  }

  hasElement(obj) {
    return !!this.getElementById(obj.id);
  }

  addElement(obj, index) {
    if (!obj) {
      return;
    }

    const { renderToScene, renderToCanvas, getSize } = this;
    const scene = { renderToScene, renderToCanvas, getSize };

    const target = this.getTarget(obj);

    target.addElement(obj, index);

    obj.scene = this;

    if (obj.addToScene) {
      obj.addToScene(scene);
    }

    if (obj.setSize) {
      const { width, height } = this.stage.getSize();

      obj.setSize(width, height);
    }

    return obj;
  }

  removeElement(obj) {
    if (!this.hasElement(obj)) {
      return false;
    }

    const target = this.getTarget(obj);

    target.removeElement(obj);

    obj.scene = null;

    if (obj.removeFromScene) {
      obj.removeFromScene(this);
    }

    return true;
  }

  shiftElement(obj, spaces) {
    if (!this.hasElement(obj)) {
      return false;
    }

    const target = this.getTarget(obj);

    return target.shiftElement(obj, spaces);
  }

  renderToCanvas(image, props, origin) {
    renderImageToCanvas(this.stage.canvasBuffer.getContext(), image, props, origin);
  }

  renderToScene(scene, camera) {
    this.stage.webglBuffer.render(scene, camera);
  }

  toJSON() {
    const json = super.toJSON();
    const { displays, effects } = this;

    return {
      ...json,
      displays: displays.map(display => display.toJSON()),
      effects: effects.map(effect => effect.toJSON()),
    };
  }

  clear() {
    const {
      composer,
      stage: { canvasBuffer, webglBuffer },
    } = this;

    canvasBuffer.clear();
    webglBuffer.clear();
    composer.clearBuffer();
  }

  render(data) {
    const {
      composer,
      displays,
      effects,
      stage: { canvasBuffer, webglBuffer },
      renderToScene,
      renderToCanvas,
      getSize,
    } = this;

    this.clear();
    this.updateReactors(data);

    const scene = { renderToScene, renderToCanvas, getSize };

    if (displays.length > 0 || effects.length > 0) {
      const bgPasses = [];
      const fgPasses = [];

      // Check for active Intro / Outro sequence
      let introDisplay = null;
      let outroDisplay = null;

      for (let i = 0; i < displays.length; i++) {
        const d = displays[i];
        if (!d || !d.enabled) continue;
        const name = (d.name || d.displayName || d.constructor?.name || '').toLowerCase();
        if (name.includes('intro')) {
          introDisplay = d;
        } else if (name.includes('outro')) {
          outroDisplay = d;
        }
      }

      const player = window.__ASTROFOX_CORE__?.player;
      const curTime = (data && data.currentTime !== undefined)
        ? data.currentTime
        : (player?.getCurrentTime ? player.getCurrentTime() : 0);

      const trackDur = (window.playlistTracks && window.activeSelectedTrackIndex !== undefined)
        ? (window.playlistTracks[window.activeSelectedTrackIndex]?.duration || 0)
        : 0;
      const totalDuration = (trackDur > 0) ? trackDur : (player?.getDuration ? player.getDuration() : 60) || 60;

      let introGateAlpha = 1.0;
      if (introDisplay) {
        const props = introDisplay.properties || {};
        const isPara = (props.introStyle === 'Paragraph (Text)');
        const paraCount = Math.max(1, Math.min(3, parseInt(props.paragraphCount) || 1));
        const paraDur = Math.max(1.0, parseFloat(props.paragraphDuration) || 5.0);
        const rawDur = typeof props.introDuration === 'string' ? parseFloat(props.introDuration) : (props.introDuration || 3.0);
        const introDuration = isPara ? (paraCount * paraDur) : Math.max(1, rawDur || 3.0);

        if (curTime <= introDuration) {
          const transDur = Math.min(0.8, introDuration * 0.25);
          if (curTime < (introDuration - transDur)) {
            introGateAlpha = 0.0;
          } else {
            const transProg = (curTime - (introDuration - transDur)) / transDur;
            introGateAlpha = 0.5 * (1.0 - Math.cos(transProg * Math.PI));
          }
        }
      }

      let outroGateAlpha = 1.0;
      if (outroDisplay) {
        const props = outroDisplay.properties || {};
        const isPara = (props.introStyle === 'Paragraph (Text)');
        const paraCount = Math.max(1, Math.min(3, parseInt(props.paragraphCount) || 1));
        const paraDur = Math.max(1.0, parseFloat(props.paragraphDuration) || 5.0);
        const rawDur = typeof props.introDuration === 'string' ? parseFloat(props.introDuration) : (props.introDuration || 5.0);
        const outroDuration = isPara ? (paraCount * paraDur) : Math.max(1, rawDur || 5.0);
        const startOutro = Math.max(0, totalDuration - outroDuration);

        if (curTime >= startOutro) {
          const transDur = Math.min(0.8, outroDuration * 0.25);
          if (curTime < startOutro + transDur) {
            const transProg = (curTime - startOutro) / transDur;
            outroGateAlpha = 0.5 * (1.0 + Math.cos(transProg * Math.PI));
          } else {
            outroGateAlpha = 0.0;
          }
        }
      }

      const isPlaying = player?.isPlaying ? player.isPlaying() : false;
      const isEditorInspectingViz = (typeof window !== 'undefined' && window.activeCategory === 'visualizer');
      const isEditorInspectingParticle = (typeof window !== 'undefined' && window.activeCategory === 'particle');
      const isEditorInspectingOverlay = (typeof window !== 'undefined' && window.activeCategory === 'overlay');

      const gateAlpha = Math.min(introGateAlpha, outroGateAlpha);

      displays.forEach(display => {
        if (display.enabled) {
          const name = (display.name || display.displayName || display.constructor?.name || '').toLowerCase();
          const isBg = (name === 'imagedisplay' || name === 'image' || name === 'shaderbackgrounddisplay' || name === 'cayaturbackgrounddisplay');
          const isIntroOrOutro = name.includes('intro') || name.includes('outro');
          const isViz = name.includes('spectrum') || name.includes('soundwave') || name.includes('wave') || name.includes('visualizer') || name.includes('harmonics');
          const isParticle = name.includes('particle') || name.includes('geometry') || name.includes('candle');
          const isOverlay = name.includes('overlay');

          const isInspected = (
            (isViz && isEditorInspectingViz) ||
            (isParticle && isEditorInspectingParticle) ||
            (isOverlay && isEditorInspectingOverlay)
          );

          // For foreground visualizers, particles, lyrics, text, overlays:
          // Suppress during intro/outro when playing or not actively inspected in editor
          let effGateAlpha = gateAlpha;
          if (!isBg && !isIntroOrOutro) {
            if (!isPlaying && isInspected) {
              effGateAlpha = 1.0;
            } else if (effGateAlpha <= 0.001) {
              return;
            }
          }

          let origOpacity = undefined;
          if (!isBg && !isIntroOrOutro && effGateAlpha < 0.999) {
            if (display.properties && display.properties.opacity !== undefined) {
              origOpacity = display.properties.opacity;
              display.properties.opacity = origOpacity * effGateAlpha;
            }
          }

          display.updateReactors(data);
          display.render(scene, data);

          if (origOpacity !== undefined && display.properties) {
            display.properties.opacity = origOpacity;
          }

          if (display.pass) {
            if (isBg) {
              bgPasses.push(display.pass);
            } else {
              fgPasses.push(display.pass);
            }
          }
        }
      });

      // Layer Order:
      // 1. Background Passes (ImagePass / Video Backgrounds)
      // 2. WebGL 3D Pass (Particles & 3D Geometry directly on top of Background)
      // 3. Canvas 2D Pass (Visualizer Spectrum, Waves, Text)
      // 4. Foreground Passes
      // 5. Post-processing Effect Passes
      const passes = [
        ...bgPasses,
        webglBuffer.pass,
        canvasBuffer.pass,
        ...fgPasses,
      ];

      effects.forEach(effect => {
        if (effect.enabled) {
          effect.updateReactors(data);
          effect.render(scene, data);

          if (effect.pass) {
            passes.push(effect.pass);
          }
        }
      });

      composer.render(passes);
    }

    return composer.inputBuffer;
  }
}
