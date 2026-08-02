/**
 * FFmpegFrameProvider.js
 * MediaFactory V3 Production FFmpeg Export Consumer (MF-3004 Architecture)
 * Feeds raw 32-bit RGBA framebuffers from CanvasKitRenderer into FFmpeg stdin.
 */

import { createScheduler } from '../scheduler/RenderScheduler.js';

let exportScheduler = null;

/**
 * Initializes the FFmpeg frame provider and instance-based export scheduler.
 * @param {Object} [options={}] Initial configuration options
 */
export async function initialize(options = {}) {
  if (!exportScheduler) {
    exportScheduler = createScheduler({
      fps: options.fps || 30,
      frameCount: options.frameCount || 300,
      width: options.width || 1920,
      height: options.height || 1080,
      visualizerConfig: options.visualizerConfig || {}
    });
    await exportScheduler.initialize(options);
  }
  return true;
}

/**
 * Generates RGBA framebuffers sequentially for FFmpeg export.
 * FFmpeg is strictly a framebuffer consumer. Zero rendering math exists here.
 *
 * @param {Object} options Export options
 * @param {number} [options.startFrame=0] Start frame index
 * @param {number} [options.endFrame=30] End frame index (exclusive)
 * @param {number} [options.frameCount=300] Total timeline frame count
 * @param {number} [options.fps=30] Target framerate
 * @param {number} [options.width=1920] Target frame width
 * @param {number} [options.height=1080] Target frame height
 * @param {Object} [options.visualizerConfig={}] Visualizer configuration
 * @returns {AsyncGenerator<{ frameIndex: number, rgbaBuffer: Buffer, metadata: Object, verification: Object, diagnostics: Object }>}
 */
export async function* getFrameStream({
  startFrame = 0,
  endFrame = 30,
  frameCount = 300,
  fps = 30,
  width = 1920,
  height = 1080,
  visualizerConfig = {}
} = {}) {
  if (!exportScheduler) {
    await initialize({ fps, frameCount, width, height, visualizerConfig });
  }

  for (let f = startFrame; f < endFrame; f++) {
    // Request frame exclusively through instance-based exportScheduler
    const frameResult = await exportScheduler.requestFrame(f, {
      frameCount,
      width,
      height,
      visualizerConfig
    });

    yield {
      frameIndex: f,
      rgbaBuffer: frameResult.rgbaBuffer,
      metadata: frameResult.metadata,
      verification: frameResult.verification,
      diagnostics: frameResult.diagnostics
    };
  }
}

/**
 * Streams raw RGBA framebuffers directly into FFmpeg stdin stream.
 * 
 * @param {Object} options Pipeline options
 * @param {WritableStream} options.writableStream Destination FFmpeg stdin stream
 * @returns {Promise<{ totalFramesPiped: number, totalBytesPiped: number }>}
 */
export async function pipeToFFmpeg({
  writableStream,
  startFrame = 0,
  endFrame = 30,
  frameCount = 300,
  fps = 30,
  width = 1920,
  height = 1080,
  visualizerConfig = {}
} = {}) {
  let totalFramesPiped = 0;
  let totalBytesPiped = 0;

  for await (const frame of getFrameStream({ startFrame, endFrame, frameCount, fps, width, height, visualizerConfig })) {
    if (!writableStream || writableStream.destroyed) {
      break;
    }

    const canContinue = writableStream.write(frame.rgbaBuffer);
    totalFramesPiped++;
    totalBytesPiped += frame.rgbaBuffer.length;

    if (!canContinue) {
      await new Promise(resolve => writableStream.once('drain', resolve));
    }
  }

  return { totalFramesPiped, totalBytesPiped };
}

/**
 * Releases frame provider resources.
 */
export async function destroy() {
  if (exportScheduler) {
    await exportScheduler.destroy();
    exportScheduler = null;
  }
  return true;
}

