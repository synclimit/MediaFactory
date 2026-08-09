/**
 * RenderContext.js [Visualizer 3 Core Contract]
 * Single Source of Truth Render Parameter Contract.
 * 
 * Guarantees immutability and complete isolation for visualizer renderers.
 */

export function createRenderContext({ canvas, ctx, viewport, timeline, audioState, config = {} }) {
  if (!canvas || !ctx) {
    throw new Error('[RenderContext] Canvas and 2D context are required');
  }

  const frozenViewport = Object.freeze({
    width: viewport?.width || canvas.width || 1920,
    height: viewport?.height || canvas.height || 1080,
    pixelRatio: viewport?.pixelRatio || 1
  });

  const frozenTimeline = Object.freeze({
    timestamp: typeof timeline?.timestamp === 'number' ? timeline.timestamp : 0,
    frameIndex: typeof timeline?.frameIndex === 'number' ? timeline.frameIndex : 0,
    duration: typeof timeline?.duration === 'number' ? timeline.duration : 0,
    fps: typeof timeline?.fps === 'number' ? timeline.fps : 60
  });

  const frozenConfig = Object.freeze({ ...config });

  const renderContext = {
    canvas,
    ctx,
    viewport: frozenViewport,
    timeline: frozenTimeline,
    audioState: audioState || null,
    config: frozenConfig
  };

  return Object.freeze(renderContext);
}
