/**
 * Canvas2DPrimitiveRenderer.js
 * MF-4000 Pure Primitive Rasterizer for Live Preview (Canvas2D)
 * Receives GeometryPrimitive[] and rasterizes directly onto CanvasRenderingContext2D with zero geometry math.
 */

export function renderCanvas2DPrimitives(ctx, primitives = [], clearCanvas = true, viewport = { width: 1920, height: 1080 }) {
  if (!ctx || !primitives) return;

  if (clearCanvas) {
    ctx.clearRect(0, 0, viewport.width || 1920, viewport.height || 1080);
  }

  for (let i = 0; i < primitives.length; i++) {
    const p = primitives[i];
    if (!p || !p.type) continue;

    ctx.save();

    if (p.opacity !== undefined) {
      ctx.globalAlpha = p.opacity;
    }

    if (p.type === 'rect') {
      ctx.fillStyle = p.fillColor || '#AB55F7';
      if (p.cornerRadius && p.cornerRadius > 0 && typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, p.cornerRadius);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    } else if (p.type === 'arc' || p.type === 'circle') {
      ctx.beginPath();
      ctx.arc(p.cx || p.x, p.cy || p.y, p.radius || 10, p.startAngle || 0, p.endAngle || (Math.PI * 2));
      if (p.fillColor) {
        ctx.fillStyle = p.fillColor;
        ctx.fill();
      }
      if (p.strokeColor) {
        ctx.strokeStyle = p.strokeColor;
        ctx.lineWidth = p.strokeWidth || 1;
        ctx.stroke();
      }
    } else if (p.type === 'path' && Array.isArray(p.points) && p.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(p.points[0].x, p.points[0].y);
      for (let pt = 1; pt < p.points.length; pt++) {
        ctx.lineTo(p.points[pt].x, p.points[pt].y);
      }
      if (p.fillColor) {
        ctx.fillStyle = p.fillColor;
        ctx.fill();
      }
      if (p.strokeColor) {
        ctx.strokeStyle = p.strokeColor;
        ctx.lineWidth = p.strokeWidth || 1;
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
