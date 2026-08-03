/**
 * CanvasKitRenderer.js
 * MediaFactory V3 Production Master Loop Renderer Engine (MF-3002 Architecture)
 * Combines CanvasKitRuntime and CanvasKitDrawVisualizer into a single deterministic 1080p frame rendering engine.
 * Features persistent Skia Surface allocation to prevent WASM heap fragmentation during long render sequences.
 */

import { initCanvasKit } from './CanvasKitRuntime.js';
import { drawCanvasKitVisualizer } from './CanvasKitDrawVisualizer.js';
import crypto from 'crypto';

let ckInstance = null;
let isInitialized = false;
let persistentSurface = null;
let persistentSurfaceWidth = 0;
let persistentSurfaceHeight = 0;

/**
 * Synthesizes a pure deterministic FFT spectrum data array for a given frame index.
 * Isolate from system clock or random state.
 */
function generateDeterministicFFT(frameIndex = 0, frameCount = 300, barCount = 256) {
  const data = new Uint8Array(barCount);
  const normalizedLoopTime = (frameIndex % frameCount) / frameCount;
  const tAngle = normalizedLoopTime * Math.PI * 2;

  for (let i = 0; i < barCount; i++) {
    const freqNorm = i / barCount;
    const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const barSeed = barPhase - Math.floor(barPhase);
    
    const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
    const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
    const oct3 = Math.sin(tAngle * 13 + freqNorm * 31.42 + barSeed * 1.57);
    const oct4 = Math.cos(tAngle * 47.12);
    
    const spike = Math.pow(Math.max(0, Math.sin(tAngle * 19 + i * 3.14)), 8);
    const fastJitter = Math.sin(tAngle * 41 + i * 7.89) * 25;
    const envelope = Math.exp(-freqNorm * 2.2);
    
    const rawVal = (0.35 * oct1 + 0.3 * oct2 + 0.2 * oct3 + 0.15 * oct4 + 0.4 * spike) * envelope;
    const baseHeight = 35 + Math.abs(rawVal) * 190 + fastJitter;
    data[i] = Math.min(255, Math.max(15, Math.floor(baseHeight)));
  }
  return data;
}

/**
 * Initializes the master renderer runtime ONCE.
 * Reuses the initialized WASM runtime for all subsequent frame renders.
 * @returns {Promise<Object>} CanvasKit WASM instance
 */
export async function initialize() {
  if (isInitialized && ckInstance) {
    return ckInstance;
  }

  ckInstance = await initCanvasKit();
  isInitialized = true;
  return ckInstance;
}

/**
 * Renders a single deterministic frame into an uncompressed RGBA framebuffer.
 * Returns ONLY { rgbaBuffer, metadata, verification, diagnostics }.
 * ZERO Skia objects (Surface, Canvas, Paint, Image) leak outside.
 * 
 * @param {Object} options Rendering options
 * @param {number} [options.frameIndex=0] Integer index of frame to render
 * @param {number} [options.frameCount=300] Total frame count in sequence
 * @param {number} [options.width=1920] Target frame width in pixels
 * @param {number} [options.height=1080] Target frame height in pixels
 * @param {Object} [options.visualizerConfig={}] Visualizer appearance configuration
 * @returns {Promise<{ rgbaBuffer: Buffer, metadata: Object, verification: Object, diagnostics: Object }>}
 */
export async function renderFrame({
  frameIndex = 0,
  frameCount = 300,
  width = 1920,
  height = 1080,
  visualizerConfig = {}
} = {}) {
  const startTime = Date.now();

  if (!isInitialized || !ckInstance) {
    await initialize();
  }

  // Allocate or reuse persistent Skia Surface to prevent WASM heap fragmentation
  if (!persistentSurface || persistentSurfaceWidth !== width || persistentSurfaceHeight !== height) {
    if (persistentSurface) {
      persistentSurface.delete();
    }
    persistentSurface = ckInstance.MakeSurface(width, height);
    if (!persistentSurface) {
      throw new Error(`[CanvasKitRenderer] Failed to allocate Skia Surface (${width}x${height}).`);
    }
    persistentSurfaceWidth = width;
    persistentSurfaceHeight = height;
  }

  const canvas = persistentSurface.getCanvas();
  const fftFrame = sharedAudioAnalysisEngine.getFrame('export_session', frameIndex, frameCount);
  const fftData = fftFrame.spectrum;

  const defaultConfig = {
    shape: 'bar',
    thickness: 4,
    spacing: 2,
    center: true,
    mirror: false,
    colorLeft: '#AB55F7',
    colorRight: '#F59E0B',
    fftGain: 100,
    ...visualizerConfig
  };

  // Passive Standby AudioState & RenderContext construction for Sprint 03 (PASS-THROUGH ONLY - Legacy drawCanvasKitVisualizer remains 100% active)
  const passiveAudioState = AudioStateAdapter.createFromFrame({ audio: { frequencies: fftData } });
  const passiveRenderContext = RenderContextAdapter.createFromFrame({
    metadata: { frameNumber: frameIndex, currentTime: frameIndex / 60, fps: 60 },
    engineStates: { audioState: passiveAudioState, audio: { frequencies: fftData } }
  }, { canvas, width, height, config: defaultConfig });

  const sessionId = global._exportSessionId || 'NO_SESSION_ID';
  const pipelineType = global._isGuiPipeline ? '[GUI PIPELINE]' : '[TEST PIPELINE]';
  console.log(`=== ${pipelineType} BREAKPOINT: CanvasKitRenderer.renderFrame() ===`);
  console.log(`Export Session ID : ${sessionId}`);
  console.log(`Frame Index       : ${frameIndex}`);

  global._currentFrameIndex = frameIndex;
  // Render visualizer frame onto persistent Skia surface (Legacy Active Pipeline)
  drawCanvasKitVisualizer(ckInstance, canvas, fftData, defaultConfig, width, height, true, frameIndex);

  persistentSurface.flush();
  const image = persistentSurface.makeImageSnapshot();

  // Extract raw 32-bit RGBA pixel buffer
  const imageInfo = {
    width,
    height,
    colorType: ckInstance.ColorType.RGBA_8888,
    alphaType: ckInstance.AlphaType.Unpremul,
    colorSpace: ckInstance.ColorSpace.SRGB
  };

  const destPixels = new Uint8Array(width * height * 4);
  const rawPixels = image.readPixels(0, 0, imageInfo, destPixels) || destPixels;
  const rgbaBuffer = Buffer.from(rawPixels.buffer, rawPixels.byteOffset, rawPixels.byteLength);

  // Dispose snapshot image immediately
  image.delete();

  const renderDurationMs = Date.now() - startTime;
  const sha256 = crypto.createHash('sha256').update(rgbaBuffer).digest('hex');

  const mem = process.memoryUsage();
  const heapUsedMB = Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100;
  const rssMB = Math.round((mem.rss / (1024 * 1024)) * 100) / 100;

  return {
    rgbaBuffer,

    metadata: {
      frameIndex,
      width,
      height,
      stride: width * 4,
      pixelFormat: 'RGBA32'
    },

    verification: {
      sha256
    },

    diagnostics: {
      renderDurationMs,
      heapUsedMB,
      rssMB,
      canvasKitVersion: '0.39.1 (Google Skia WASM)'
    }
  };
}

/**
 * Terminates the renderer runtime lifecycle and cleans up state.
 * @returns {Promise<boolean>}
 */
export async function destroyRenderer() {
  if (persistentSurface) {
    persistentSurface.delete();
    persistentSurface = null;
    persistentSurfaceWidth = 0;
    persistentSurfaceHeight = 0;
  }
  isInitialized = false;
  ckInstance = null;
  return true;
}
