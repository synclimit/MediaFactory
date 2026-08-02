/**
 * RenderScheduler.js
 * MediaFactory V3 Instance-Based Playback State Scheduler (MF-3006R Architecture)
 * Orchestrates frame requests, playback clock, and timeline progression per consumer instance.
 * ZERO rendering logic, FFT math, Canvas2D, or Skia APIs exist in this module.
 */

import { initialize as initRenderer, renderFrame } from '../renderer/CanvasKitRenderer.js';

/**
 * Instance class managing local playback state for a single consumer.
 */
export class RenderSchedulerInstance {
  constructor(options = {}) {
    this._isInitialized = false;
    this._isPlaying = false;
    this._currentFrame = options.currentFrame || 0;
    this._currentTimeSec = options.currentTimeSec || 0;
    this._fps = options.fps || 30;
    this._frameCount = options.frameCount || 300;
    this._width = options.width || 1920;
    this._height = options.height || 1080;
    this._visualizerConfig = options.visualizerConfig || {};
  }

  /**
   * Initializes the scheduler instance and ensures the singleton master renderer is initialized.
   * @param {Object} options Configuration overrides
   */
  async initialize(options = {}) {
    if (!this._isInitialized) {
      await initRenderer();
      this._isInitialized = true;
    }

    if (options.fps) this._fps = options.fps;
    if (options.frameCount) this._frameCount = options.frameCount;
    if (options.width) this._width = options.width;
    if (options.height) this._height = options.height;
    if (options.visualizerConfig) this._visualizerConfig = options.visualizerConfig;

    return this.getPlaybackState();
  }

  /**
   * Starts playback state progression.
   */
  play() {
    this._isPlaying = true;
    return this.getPlaybackState();
  }

  /**
   * Pauses playback state progression.
   */
  pause() {
    this._isPlaying = false;
    return this.getPlaybackState();
  }

  /**
   * Stops playback state progression and resets clock to frame 0.
   */
  stop() {
    this.pause();
    this._currentFrame = 0;
    this._currentTimeSec = 0;
    return this.getPlaybackState();
  }

  /**
   * Seeks to a specific frame index on this instance's timeline.
   * @param {number} targetFrame Target integer frame index
   */
  seek(targetFrame = 0) {
    const boundedFrame = Math.max(0, Math.min(Math.floor(targetFrame), this._frameCount - 1));
    this._currentFrame = boundedFrame;
    this._currentTimeSec = boundedFrame / this._fps;
    return this.getPlaybackState();
  }

  /**
   * Requests a frame from the master renderer for this scheduler instance.
   * Internally invokes ONLY CanvasKitRenderer.renderFrame().
   * 
   * @param {number} [targetFrameIndex] Optional frame index override. If omitted, uses local currentFrame.
   * @param {Object} [overrideOptions] Optional configuration overrides.
   * @returns {Promise<{ rgbaBuffer: Buffer, metadata: Object, verification: Object, diagnostics: Object }>}
   */
  async requestFrame(targetFrameIndex, overrideOptions = {}) {
    if (!this._isInitialized) {
      await this.initialize(overrideOptions);
    }

    const frameToRender = typeof targetFrameIndex === 'number'
      ? Math.max(0, Math.min(Math.floor(targetFrameIndex), (overrideOptions.frameCount || this._frameCount) - 1))
      : this._currentFrame;

    this._currentFrame = frameToRender;
    this._currentTimeSec = frameToRender / this._fps;

    const targetWidth = overrideOptions.width || this._width;
    const targetHeight = overrideOptions.height || this._height;
    const targetFrameCount = overrideOptions.frameCount || this._frameCount;
    const targetConfig = overrideOptions.visualizerConfig || this._visualizerConfig;

    // Request frame exclusively from singleton master renderer
    return await renderFrame({
      frameIndex: frameToRender,
      frameCount: targetFrameCount,
      width: targetWidth,
      height: targetHeight,
      visualizerConfig: targetConfig
    });
  }

  /**
   * Returns current local playback state and timeline metrics for this instance.
   */
  getPlaybackState() {
    return {
      isInitialized: this._isInitialized,
      isPlaying: this._isPlaying,
      currentFrame: this._currentFrame,
      currentTimeSec: this._currentTimeSec,
      fps: this._fps,
      frameCount: this._frameCount,
      width: this._width,
      height: this._height
    };
  }

  /**
   * Releases scheduler instance state.
   */
  async destroy() {
    this.stop();
    this._isInitialized = false;
    this._currentFrame = 0;
    this._currentTimeSec = 0;
    return true;
  }
}

/**
 * Creates and returns a new independent Playback State Scheduler instance.
 * @param {Object} [options={}] Initial scheduler options
 * @returns {RenderSchedulerInstance}
 */
export function createScheduler(options = {}) {
  return new RenderSchedulerInstance(options);
}

let _defaultScheduler = null;

/**
 * Backward-compatible helper function exporting requestFrame for single-call invocation.
 */
export async function requestFrame(targetFrameIndex, overrideOptions = {}) {
  if (!_defaultScheduler) {
    _defaultScheduler = createScheduler();
  }
  return await _defaultScheduler.requestFrame(targetFrameIndex, overrideOptions);
}
