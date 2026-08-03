/**
 * RenderContext.js
 * Immutable RenderContext Contract for Production Reference Engine v1.0.
 * 
 * RENDERER STRICTIONS:
 * - NO reading AudioContext directly
 * - NO reading currentTime from DOM / Window
 * - NO reading performance.now() / Date.now()
 * - NO direct raw unmodeled FFT reading
 */

export function createRenderContext({ canvas, ctx, viewport, timeline, audioState, config } = {}) {
  return Object.freeze({
    canvas: canvas || null,
    ctx: ctx || null,
    viewport: Object.freeze({
      width: viewport?.width || canvas?.width || 1920,
      height: viewport?.height || canvas?.height || 1080,
      pixelRatio: viewport?.pixelRatio || 1
    }),
    timeline: Object.freeze({
      timestamp: Number(timeline?.timestamp || 0),
      frameIndex: Math.floor((timeline?.timestamp || 0) * (timeline?.fps || 60)),
      duration: Number(timeline?.duration || 30),
      fps: Number(timeline?.fps || 60)
    }),
    audioState: Object.freeze(audioState || {}),
    config: Object.freeze(config || {})
  });
}
