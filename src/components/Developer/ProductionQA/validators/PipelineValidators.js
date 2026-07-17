import { QAValidatorBase } from './QAValidatorBase.js';
import { RenderPipeline } from '../../../../services/pipeline/RenderPipeline.js';
import { FrameComposer } from '../../../../services/pipeline/FrameComposer.js';

export class TimelineValidator extends QAValidatorBase {
  constructor() {
    super('Timeline', ['Project System', 'Asset Manager']);
  }
  async execute(config) {
    return this.notExecuted('Requires initialized UI context and state');
  }
}

export class ProjectSystemValidator extends QAValidatorBase {
  constructor() {
    super('Project System');
  }
  async execute(config) {
    const startTime = performance.now();
    // In an actual scenario, load the qa_project
    const executionTime = performance.now() - startTime;
    return this.notExecuted('Requires active workspace context');
  }
}

export class AssetManagerValidator extends QAValidatorBase {
  constructor() {
    super('Asset Manager', ['Project System']);
  }
  async execute(config) {
    return this.notExecuted('Requires file system access/browser file handle');
  }
}

export class FrameComposerValidator extends QAValidatorBase {
  constructor() {
    super('Frame Composer', ['Timeline', 'Subtitle Renderer', 'Visual Runtime']);
  }
  async execute(config) {
    try {
      const composer = new FrameComposer();
      return this.pass('Frame Composer initialized', { state: 'initialized' });
    } catch (e) {
      if (e.message && e.message.includes('DOM')) {
        return this.notExecuted('Requires canvas DOM element');
      }
      return this.fail(`Exception: ${e.message}`);
    }
  }
}

export class RenderPipelineValidator extends QAValidatorBase {
  constructor() {
    super('Render Pipeline', ['Frame Composer']);
  }
  async execute(config) {
    try {
      const pipeline = new RenderPipeline();
      return this.pass('Render Pipeline instance created', { instantiated: true });
    } catch(e) {
      return this.fail(`Exception: ${e.message}`);
    }
  }
}

export class OutputManagerValidator extends QAValidatorBase {
  constructor() {
    super('Output Manager', ['Render Pipeline']);
  }
  async execute(config) {
    return this.notExecuted('Requires writable directory handle in browser');
  }
}

export class FFmpegValidator extends QAValidatorBase {
  constructor() {
    super('FFmpeg', ['Hardware Detector']);
  }
  async execute(config) {
    if (!config.exportEnabled) return this.notExecuted('Export disabled by QA config');
    return this.notExecuted('Requires WASM FFmpeg context to be loaded in browser environment');
  }
}

export class ExportManagerValidator extends QAValidatorBase {
  constructor() {
    super('Export Manager', ['Output Manager', 'FFmpeg']);
  }
  async execute(config) {
    if (!config.exportEnabled) return this.notExecuted('Export disabled by QA config');
    return this.notExecuted('Requires active FFmpeg export job');
  }
}

export const pipelineValidators = [
  new ProjectSystemValidator(),
  new AssetManagerValidator(),
  new TimelineValidator(),
  new FrameComposerValidator(),
  new RenderPipelineValidator(),
  new OutputManagerValidator(),
  new FFmpegValidator(),
  new ExportManagerValidator()
];
