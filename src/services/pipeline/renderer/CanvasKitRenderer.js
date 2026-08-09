/**
 * CanvasKitRenderer.js
 * MediaFactory V3 Master Export Renderer Engine
 * 
 * SPRINT 26 GOVERNANCE:
 * - Executes frame rendering 100% via ReferenceRenderPipeline -> Core Engine -> CanvasKit2DAdapter.
 * - Zero legacy drawing math exists in export pipeline.
 */

import { initCanvasKit } from './CanvasKitRuntime.js';
import { CanvasKit2DAdapter } from '../../../engine/adapters/CanvasKit2DAdapter.js';
import { referenceRenderPipeline } from '../../../engine/pipeline/ReferenceRenderPipeline.js';
import { createRenderContext } from '../../../engine/contracts/RenderContext.js';
import { AudioStateAdapter } from '../../../engine/adapters/AudioStateAdapter.js';
import crypto from 'crypto';

let ckInstance = null;
let isInitialized = false;
let persistentSurface = null;
let persistentSurfaceWidth = 0;
let persistentSurfaceHeight = 0;

/**
 * Synthesizes a pure deterministic FFT spectrum data array for a given frame index.
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
 * Renders a single deterministic frame into an uncompressed RGBA framebuffer via Core Engine.
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

  const canvas = persistentSurface.getCanvas();

  // Clear Surface with transparent background
  const bgPaint = new ckInstance.Paint();
  bgPaint.setColor(ckInstance.Color(0, 0, 0, 0));
  bgPaint.setBlendMode(ckInstance.BlendMode.Src);
  canvas.drawRect([0, 0, width, height], bgPaint);
  bgPaint.delete();

  const fftData = generateDeterministicFFT(frameIndex, frameCount, visualizerConfig.barCount || 64);
  const audioState = AudioStateAdapter.createFromFrame({ audio: { frequencies: fftData } });

  const defaultConfig = {
    visualizerId: 'bars-classic-vertical',
    barCount: 64,
    barWidth: 4,
    spacing: 2,
    colorLeft: '#00f2fe',
    colorRight: '#4facfe',
    ...visualizerConfig
  };

  const adapter = new CanvasKit2DAdapter(ckInstance, canvas);
  const renderContext = createRenderContext({
    canvas,
    ctx: adapter,
    viewport: { width, height, pixelRatio: 1 },
    timeline: { timestamp: frameIndex / 60, fps: 60, frameIndex },
    audioState,
    config: defaultConfig
  });

  // Execute Export Frame via ReferenceRenderPipeline -> Core Engine -> CanvasKit2DAdapter
  const pluginId = defaultConfig.visualizerId;
  referenceRenderPipeline
    .receiveContext(renderContext)
    .receiveAudioState(audioState)
    .resolvePlugin(pluginId)
    .preparePlugin();

  referenceRenderPipeline.currentPlugin.render(renderContext);
  adapter.dispose();

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
    diagnostics: { renderDurationMs, engineUsed: referenceRenderPipeline.currentPlugin.id }
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
