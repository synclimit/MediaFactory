/**
 * RenderContext.js
 * Immutable RenderContext Contract Factory for Visualizer 2 Engine.
 */

export function createRenderContext({
  canvas,
  ctx,
  viewport = { width: 1920, height: 1080, pixelRatio: 1 },
  timeline = { timestamp: 0, frameIndex: 0, duration: 30, fps: 60 },
  audioState = {},
  config = {}
}) {
  return Object.freeze({
    canvas,
    ctx,
    viewport: Object.freeze({ ...viewport }),
    timeline: Object.freeze({ ...timeline }),
    audioState: Object.freeze({ ...audioState }),
    config: Object.freeze({ ...config })
  });
}
