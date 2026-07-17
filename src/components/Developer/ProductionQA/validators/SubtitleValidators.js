import { QAValidatorBase } from './QAValidatorBase.js';
import { whisperAnalysisManager } from '../../../../services/audio/subtitle/WhisperAnalysisManager.js';
import SubtitleParser from '../../../../services/subtitle/SubtitleParser.js';

export class WhisperValidator extends QAValidatorBase {
  constructor() {
    super('Whisper');
  }
  async execute(config) {
    if (!config.whisperEnabled) return this.notExecuted('Whisper disabled by QA config');
    
    try {
      const startTime = performance.now();
      // Test 1: Real whisper cache/backend using dummy audio hash. We expect it to try and fail or hit backend
      // But because NO MOCKS, we attempt real manager.
      // If the backend is off, it should throw or we can catch and fail/not executed.
      
      const doc = await whisperAnalysisManager.getSubtitleDocument('qa_dummy_hash', 'dummy_video_id', null, false);
      const executionTime = performance.now() - startTime;
      
      if (doc && doc.segments) {
         return this.pass(`Whisper executed in ${executionTime.toFixed(2)}ms`, { latencyMs: executionTime, segmentsCount: doc.segments.length });
      }
      return this.fail('Whisper returned invalid document');
    } catch (e) {
      if (e.message && e.message.includes('fallback')) {
         return this.notExecuted('Whisper backend unavailable (fallback triggered)');
      }
      return this.fail(`Exception: ${e.message}`);
    }
  }
}

export class SubtitleRuntimeValidator extends QAValidatorBase {
  constructor() {
    super('Subtitle Runtime', ['Whisper']);
  }
  async execute(config) {
    try {
      const sTime = performance.now();
      // Real code execution. Empty payload test.
      const doc = SubtitleParser.parse({ text: "test", words: [], segments: [] });
      const parseTime = performance.now() - sTime;
      
      if (doc) {
        return this.pass(`Subtitle parsed in ${parseTime.toFixed(2)}ms`, { latencyMs: parseTime });
      }
      return this.fail('SubtitleParser returned null');
    } catch (e) {
      return this.fail(`Exception: ${e.message}`);
    }
  }
}

export class SubtitleRendererValidator extends QAValidatorBase {
  constructor() {
    super('Subtitle Renderer', ['Subtitle Runtime']);
  }
  async execute(config) {
    return this.notExecuted('Requires active canvas rendering context');
  }
}

export const subtitleValidators = [
  new WhisperValidator(),
  new SubtitleRuntimeValidator(),
  new SubtitleRendererValidator()
];
