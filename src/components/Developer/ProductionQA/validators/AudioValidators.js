import { QAValidatorBase } from './QAValidatorBase.js';
import { beatEngine } from '../../../../services/audio/BeatEngine.js';

export class AudioEngineValidator extends QAValidatorBase {
  constructor() {
    super('Audio Engine');
  }
  async execute(config) {
    // There is no monolithic AudioDSP class, it's a collection of pure DSP modules.
    // Audio engine requires AudioContext for end-to-end tests.
    return this.notExecuted('Requires active AudioContext and stream source');
  }
}

export class BeatEngineValidator extends QAValidatorBase {
  constructor() {
    super('Beat Engine', ['Audio Engine']);
  }
  async execute(config) {
    // BeatEngine is a realtime singleton and cannot be unit-tested with a dummy buffer synchronously.
    return this.notExecuted('Requires active realtime audio stream');
  }
}

export class BeatCacheValidator extends QAValidatorBase {
  constructor() {
    super('Beat Cache', ['Beat Engine']);
  }
  async execute(config) {
    // If we cannot perform a real cache lookup right now, we must not fake it.
    return this.notExecuted('Requires active cache backend connection');
  }
}

export class MusicalFeelValidator extends QAValidatorBase {
  constructor() {
    super('Musical Feel', ['Beat Engine']);
  }
  async execute(config) {
    return this.notExecuted('Requires active audio stream for Musical Feel analysis');
  }
}

export const audioValidators = [
  new AudioEngineValidator(),
  new BeatEngineValidator(),
  new BeatCacheValidator(),
  new MusicalFeelValidator()
];
