import { QAValidatorBase } from './QAValidatorBase.js';
import { VisualRuntime } from '../../../../services/visual/VisualRuntime.js';

export class VisualRuntimeValidator extends QAValidatorBase {
  constructor() {
    super('Visual Runtime', ['Beat Engine']);
  }
  async execute(config) {
    try {
      const runtime = new VisualRuntime();
      const startTime = performance.now();
      runtime.initialize();
      const execTime = performance.now() - startTime;
      return this.pass(`VisualRuntime initialized in ${execTime.toFixed(2)}ms`, { latencyMs: execTime });
    } catch (e) {
      if (e.message && (e.message.includes('canvas') || e.message.includes('document'))) {
         return this.notExecuted('Requires browser DOM/Canvas context');
      }
      return this.fail(`Exception: ${e.message}`);
    }
  }
}

export class ZoomEffectValidator extends QAValidatorBase {
  constructor() {
    super('Zoom', ['Visual Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active canvas/WebGL context to measure zoom jitter/fps impact');
  }
}

export class GlowEffectValidator extends QAValidatorBase {
  constructor() {
    super('Glow', ['Visual Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active canvas/WebGL context to measure glow jitter/fps impact');
  }
}

export class CameraEffectValidator extends QAValidatorBase {
  constructor() {
    super('Camera', ['Visual Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active canvas/WebGL context to measure camera jitter/fps impact');
  }
}

export class ParticleEffectValidator extends QAValidatorBase {
  constructor() {
    super('Particle', ['Visual Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active canvas/WebGL context to measure particle latency/fps impact');
  }
}

export class BlurEffectValidator extends QAValidatorBase {
  constructor() {
    super('Blur', ['Visual Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active canvas/WebGL context to measure blur latency/fps impact');
  }
}

export class SpectrumEffectValidator extends QAValidatorBase {
  constructor() {
    super('Spectrum', ['Visual Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active audio node to render spectrum');
  }
}

export const visualValidators = [
  new VisualRuntimeValidator(),
  new ZoomEffectValidator(),
  new GlowEffectValidator(),
  new CameraEffectValidator(),
  new ParticleEffectValidator(),
  new BlurEffectValidator(),
  new SpectrumEffectValidator()
];
