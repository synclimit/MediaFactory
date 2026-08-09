/**
 * CanvasKitPrimitiveRenderer.js
 * MF-4000 Pure Primitive Rasterizer for Production Export (CanvasKit / Skia)
 * Receives GeometryPrimitive[] and rasterizes directly onto SkCanvas with ZERO geometry math.
 */

function parseSkColor(CanvasKit, hexStr, opacity = 1.0) {
  const c = (hexStr || '#AB55F7').replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 171;
  const g = parseInt(c.substring(2, 4), 16) || 85;
  const b = parseInt(c.substring(4, 6), 16) || 247;
  const a = Math.round((opacity !== undefined ? opacity : 1.0) * 255);
  return CanvasKit.Color(r, g, b, a);
}

export function renderCanvasKitPrimitives(CanvasKit, skCanvas, primitives = [], clearCanvas = true, viewport = { width: 1920, height: 1080 }) {
  if (!CanvasKit || !skCanvas || !primitives) return;

  if (clearCanvas) {
    const bgPaint = new CanvasKit.Paint();
    bgPaint.setColor(CanvasKit.Color(0, 0, 0, 0));
    bgPaint.setBlendMode(CanvasKit.BlendMode.Src);
    skCanvas.drawRect([0, 0, viewport.width || 1920, viewport.height || 1080], bgPaint);
    bgPaint.delete();
  }

  let drawRectCount = 0;
  let drawPathCount = 0;
  let drawCircleCount = 0;
  let drawArcCount = 0;

  for (let i = 0; i < primitives.length; i++) {
    const p = primitives[i];
    if (!p || !p.type) continue;

    const paint = new CanvasKit.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(CanvasKit.PaintStyle.Fill);
    paint.setColor(parseSkColor(CanvasKit, p.fillColor || '#AB55F7', p.opacity));

    if (p.type === 'rect') {
      drawRectCount++;
      if (p.cornerRadius && p.cornerRadius > 0 && typeof CanvasKit.RRectXY === 'function') {
        const rect = [p.x, p.y, p.x + p.width, p.y + p.height];
        const rrect = CanvasKit.RRectXY(rect, p.cornerRadius, p.cornerRadius);
        skCanvas.drawRRect(rrect, paint);
      } else {
        skCanvas.drawRect([p.x, p.y, p.x + p.width, p.y + p.height], paint);
      }
    } else if (p.type === 'arc' || p.type === 'circle') {
      if (p.type === 'arc') drawArcCount++;
      else drawCircleCount++;
      const cx = p.cx || p.x || 0;
      const cy = p.cy || p.y || 0;
      const radius = p.radius || 10;
      skCanvas.drawCircle(cx, cy, radius, paint);
    } else if (p.type === 'path' && Array.isArray(p.points) && p.points.length > 0) {
      drawPathCount++;
      const path = new CanvasKit.Path();
      path.moveTo(p.points[0].x, p.points[0].y);
      for (let pt = 1; pt < p.points.length; pt++) {
        path.lineTo(p.points[pt].x, p.points[pt].y);
      }
      skCanvas.drawPath(path, paint);
      path.delete();
    }

    paint.delete();
  }

  if (global._currentFrameIndex === 100) {
    console.log('=== [RUNTIME DEBUG FRAME 100 - CANVASKIT RENDERER] ===');
    console.log('5. Primitives Input to CanvasKit:', primitives.length);
    console.log('6. CanvasKit Rendered Counts -> drawRect:', drawRectCount, '| drawPath:', drawPathCount, '| drawCircle:', drawCircleCount, '| drawArc:', drawArcCount);
  }
}
