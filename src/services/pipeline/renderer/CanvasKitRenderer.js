/**
 * CanvasKitRenderer.js
 * MediaFactory V3 Master Export Renderer Engine
 *
 * SINGLE ENGINE PARITY (MF-3000 Architecture):
 * - Export now uses the SAME VisualizerPipeline + visualizerRegistryV3 as the preview
 *   (Visualizer3Renderer.jsx). This is the single engine.
 * - Rendering is done on an OffscreenCanvas at 1920×1080, then pixels are blitted
 *   to the Skia surface for FFmpeg output.
 * - generateDeterministicFFT is the SHARED audio source for both export and idle preview.
 */

import { initCanvasKit } from './CanvasKitRuntime.js';
import { VisualizerPipeline } from '../../../visualizers/v3/pipeline/VisualizerPipeline.js';

// Auto-register V3 plugins (same set as Visualizer3Renderer.jsx)
import '../../../visualizers/v3/plugins/SpectrumBarsPlugin.js';
import '../../../visualizers/v3/plugins/CircularPulsePlugin.js';
import '../../../visualizers/v3/plugins/CyberpunkWaveformPlugin.js';
import '../../../visualizers/v3/plugins/ParticleOrbitPlugin.js';

import { BeatEngine } from '../../../visualizers/v3/audio/BeatEngine.js';
import crypto from 'crypto';

let ckInstance = null;
let isInitialized = false;
let persistentSurface = null;
let persistentSurfaceWidth = 0;
let persistentSurfaceHeight = 0;

// Shared BeatEngine instance for AudioState construction
const beatEngineInstance = new BeatEngine();

/**
 * SHARED DETERMINISTIC FFT GENERATOR
 * This is the single source of truth for audio data in both export and idle preview.
 * Preview (Visualizer3Renderer.jsx) uses the identical copy of this function.
 * DO NOT diverge these formulas — they must stay in sync.
 *
 * @param {number} frameIndex  Integer frame index (0-based)
 * @param {number} frameCount  Total frame count in timeline
 * @param {number} barCount    Number of frequency bins
 * @returns {Float32Array}     Normalized frequencies [0.0, 1.0]
 */
function generateDeterministicFFT(frameIndex = 0, frameCount = 300, barCount = 64) {
  const data = new Float32Array(barCount);
  const normalizedLoopTime = (frameIndex % frameCount) / frameCount;
  const tAngle = normalizedLoopTime * Math.PI * 2;

  for (let i = 0; i < barCount; i++) {
    const freqNorm = i / barCount;
    const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const barSeed = barPhase - Math.floor(barPhase);

    const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
    const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
    const envelope = Math.exp(-freqNorm * 2.2);

    const rawVal = (0.5 * oct1 + 0.5 * oct2) * envelope;
    data[i] = Math.min(1.0, Math.max(0.05, Math.abs(rawVal)));
  }
  return data;
}

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
 *
 * SINGLE ENGINE: Uses VisualizerPipeline (V3) on an OffscreenCanvas at native resolution,
 * then blits pixels into the Skia surface. This is the same engine path as the preview.
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

  // Allocate or reuse persistent Skia Surface
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

  const skCanvas = persistentSurface.getCanvas();

  // Clear surface with transparent background
  const bgPaint = new ckInstance.Paint();
  bgPaint.setColor(ckInstance.Color(0, 0, 0, 0));
  bgPaint.setBlendMode(ckInstance.BlendMode.Src);
  skCanvas.drawRect([0, 0, width, height], bgPaint);
  bgPaint.delete();

  // --- SINGLE ENGINE: Render via VisualizerPipeline on OffscreenCanvas ---
  // This is the identical pipeline path used by Visualizer3Renderer.jsx in preview.
  const barCount = visualizerConfig.barCount || 64;
  const fftData = generateDeterministicFFT(frameIndex, frameCount, barCount);
  const timestamp = frameIndex / 60;

  // Build AudioState compatible with V3 plugins
  const rawWave = new Uint8Array(barCount);
  let audioState = beatEngineInstance.processFrame(timestamp, fftData, rawWave, 44100);
  audioState = audioState ? { ...audioState, frequencies: fftData } : { frequencies: fftData };

  // Resolve plugin mode from config (same logic as Visualizer3Renderer)
  const resolveMode = (cfg) => {
    const mode = cfg.mode || cfg.pluginId || cfg.visualizerId || 'spectrum-bars';
    const mStr = String(mode).toLowerCase();
    if (mStr.includes('wave') || mStr.includes('cyberpunk')) return 'cyberpunk-waveform';
    if (mStr.includes('particle') || mStr.includes('orbit')) return 'particle-orbit';
    if (mStr.includes('circular') || mStr.includes('circle') || mStr.includes('pulse')) return 'circular-pulse';
    return 'spectrum-bars';
  };
  const pluginMode = resolveMode(visualizerConfig);

  const mergedConfig = {
    colorLeft: visualizerConfig.colorLeft || '#00f2fe',
    colorRight: visualizerConfig.colorRight || '#4facfe',
    colorMid: visualizerConfig.colorMid || '#06B6D4',
    barCount,
    ...visualizerConfig
  };

  // Create OffscreenCanvas at native resolution — same size as Skia surface
  const offscreen = new OffscreenCanvas(width, height);
  VisualizerPipeline.renderPipelineFrame(offscreen, timestamp, audioState, pluginMode, mergedConfig);

  // Read pixels from OffscreenCanvas and blit to Skia surface
  const offCtx = offscreen.getContext('2d');
  const imageData = offCtx.getImageData(0, 0, width, height);
  const skImage = ckInstance.MakeImage(
    { width, height, colorType: ckInstance.ColorType.RGBA_8888, alphaType: ckInstance.AlphaType.Unpremul, colorSpace: ckInstance.ColorSpace.SRGB },
    imageData.data,
    width * 4
  );
  if (skImage) {
    skCanvas.drawImage(skImage, 0, 0);
    skImage.delete();
  }
  // --- End SINGLE ENGINE block ---

  persistentSurface.flush();
  const image = persistentSurface.makeImageSnapshot();

  const imageInfo = {
    width,
    height,
    colorType: ckInstance.ColorType.RGBA_8888,
    alphaType: ckInstance.AlphaType.Unpremul,
    colorSpace: ckInstance.ColorSpace.SRGB
  };

  const destPixels = new Uint8Array(width * height * 4);
  const rawPixels = image.readPixels(0, 0, imageInfo) || destPixels;
  const rgbaBuffer = Buffer.from(rawPixels.buffer, rawPixels.byteOffset, rawPixels.byteLength);

  image.delete();

  const renderDurationMs = Date.now() - startTime;
  const sha256 = crypto.createHash('sha256').update(rgbaBuffer).digest('hex');

  return {
    rgbaBuffer,
    metadata: { frameIndex, width, height, stride: width * 4, pixelFormat: 'RGBA32' },
    verification: { sha256 },
    diagnostics: { renderDurationMs, engineUsed: `VisualizerPipeline/V3/${pluginMode}` }
  };
}

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

