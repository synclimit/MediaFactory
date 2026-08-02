/**
 * CanvasKitRuntime.js
 * MediaFactory V3 Production Single Engine Renderer Foundation (MF-3000 Architecture)
 * Encapsulates Google Skia WebAssembly (CanvasKit) runtime lifecycle and 1080p frame rasterization.
 */

import CanvasKitInit from 'canvaskit-wasm';
import crypto from 'crypto';

let canvasKitInstance = null;
let initPromise = null;

/**
 * Initializes the singleton CanvasKit WASM runtime instance.
 * CanvasKit initializes ONLY ONCE and reuses the WASM runtime for subsequent renders.
 * @returns {Promise<Object>} CanvasKit API object
 */
export async function initCanvasKit() {
  if (canvasKitInstance) {
    return canvasKitInstance;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const startTime = Date.now();
      const instance = await CanvasKitInit();
      canvasKitInstance = instance;
      const durationMs = Date.now() - startTime;
      console.log(`[CanvasKitRuntime] WASM runtime initialized in ${durationMs}ms.`);
      return instance;
    })();
  }

  return initPromise;
}

/**
 * Renders a single deterministic 1080p POC frame into raw RGBA and PNG buffers.
 * All internal CanvasKit objects (Surface, Canvas, Paint, Image) are created and
 * disposed internally, exposing ONLY stable outputs.
 * 
 * @param {Object} options Rendering options
 * @param {number} [options.width=1920] Target frame width
 * @param {number} [options.height=1080] Target frame height
 * @returns {Promise<{ rgbaBuffer: Buffer, pngBuffer: Buffer, metadata: Object }>}
 */
export async function renderPOCFrame({ width = 1920, height = 1080 } = {}) {
  const startTime = Date.now();
  const CanvasKit = await initCanvasKit();

  const surface = CanvasKit.MakeSurface(width, height);
  if (!surface) {
    throw new Error(`[CanvasKitRuntime] Failed to allocate Skia Surface (${width}x${height}).`);
  }

  const canvas = surface.getCanvas();

  // 1. Render Background (#111216)
  const bgPaint = new CanvasKit.Paint();
  bgPaint.setColor(CanvasKit.Color(17, 18, 22, 255));
  canvas.drawRect(CanvasKit.XYWHRect(0, 0, width, height), bgPaint);
  bgPaint.delete();

  // 2. Render Gradient Rect (Purple #AB55F7 to Gold #F59E0B)
  const c1 = CanvasKit.Color(171, 85, 247, 255);
  const c2 = CanvasKit.Color(245, 158, 11, 255);
  const shader = CanvasKit.Shader.MakeLinearGradient(
    [0, 0],
    [width, 0],
    [c1, c2],
    [0, 1],
    CanvasKit.TileMode.Clamp
  );

  const rectPaint = new CanvasKit.Paint();
  rectPaint.setShader(shader);
  rectPaint.setStyle(CanvasKit.PaintStyle.Fill);
  canvas.drawRect(CanvasKit.XYWHRect(360, 300, 1200, 200), rectPaint);
  rectPaint.delete();
  shader.delete();

  // 3. Render Circle (Teal #00FFCC)
  const circlePaint = new CanvasKit.Paint();
  circlePaint.setColor(CanvasKit.Color(0, 255, 204, 255));
  circlePaint.setAntiAlias(true);
  canvas.drawCircle(960, 680, 80, circlePaint);
  circlePaint.delete();

  // 4. Render Text String
  const textPaint = new CanvasKit.Paint();
  textPaint.setColor(CanvasKit.Color(255, 255, 255, 255));
  const font = new CanvasKit.Font(null, 40);
  canvas.drawText("MediaFactory V3 — CanvasKit Foundation POC (MF-3000)", 360, 820, textPaint, font);
  textPaint.delete();
  font.delete();

  // Flush surface commands and capture snapshot
  surface.flush();
  const image = surface.makeImageSnapshot();

  // Extract raw 32-bit RGBA pixel buffer (width * height * 4 = 8,294,400 bytes)
  const imageInfo = {
    width,
    height,
    colorType: CanvasKit.ColorType.RGBA_8888,
    alphaType: CanvasKit.AlphaType.Unpremul,
    colorSpace: CanvasKit.ColorSpace.SRGB
  };

  const rawPixels = image.readPixels(0, 0, imageInfo);
  const rgbaBuffer = Buffer.from(rawPixels || new Uint8Array(width * height * 4));

  // Encode PNG buffer for audit verification
  const pngBytes = image.encodeToBytes();
  const pngBuffer = Buffer.from(pngBytes);

  // Properly dispose WASM resources
  image.delete();
  surface.delete();

  const renderDurationMs = Date.now() - startTime;
  const sha256 = crypto.createHash('sha256').update(rgbaBuffer).digest('hex');

  const metadata = {
    timestamp: new Date().toISOString(),
    renderer: "MediaFactory V3 CanvasKit Single Engine",
    canvasSize: `${width}x${height}`,
    width,
    height,
    stride: width * 4,
    bufferSizeBytes: rgbaBuffer.length,
    pixelFormat: "RGBA32",
    renderDurationMs,
    sha256
  };

  return {
    rgbaBuffer,
    pngBuffer,
    metadata
  };
}
