/**
 * CanvasKitDrawVisualizer.js
 * Single Engine Shared Visualizer Drawing Module (MF-3000 CanvasKit Architecture)
 * Direct 1:1 CanvasKit API Port of production drawVisualizer.js algorithm.
 */

// Module helper for hex parsing outside function body
function parseHexColor(CanvasKit, hexStr) {
  const c = (hexStr || '#AB55F7').replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 171;
  const g = parseInt(c.substring(2, 4), 16) || 85;
  const b = parseInt(c.substring(4, 6), 16) || 247;
  return CanvasKit.Color(r, g, b, 255);
}

const PLUGIN_MAPPING = {
  'bars-classic-vertical': 'bar',
  'bars-staggered-center': 'bar',
  'bars-mirror': 'bar',
  'bars-split-dual': 'bar',
  'bars-rounded-pill': 'bar',
  'Vertical': 'bar',
  'Staggered': 'bar',
  'Mirror': 'bar',
  'Split': 'bar',
  'Rounded': 'bar',
  'bars': 'bar',
  'bar': 'bar'
};

export function resolvePluginShape(pluginId, rawShape) {
  if (pluginId && PLUGIN_MAPPING[pluginId]) {
    return PLUGIN_MAPPING[pluginId];
  }
  if (rawShape && PLUGIN_MAPPING[rawShape]) {
    return PLUGIN_MAPPING[rawShape];
  }
  if (rawShape === 'bar') {
    return 'bar';
  }

  const target = pluginId || rawShape || 'unknown';
  console.warn(`[CanvasKitDrawVisualizer] Unsupported visualizer plugin '${target}'. Using documented fallback shape ('bar').`);
  return 'bar';
}

export function drawCanvasKitVisualizer(CanvasKit, canvas, dataArray, config = {}, width = 1920, height = 1080, clearCanvas = true) {
  if (!CanvasKit || !canvas || !dataArray || width === 0 || height === 0) return;

  if (clearCanvas) {
    const bgPaint = new CanvasKit.Paint();
    bgPaint.setColor(CanvasKit.Color(0, 0, 0, 0)); // Transparent alpha layer
    bgPaint.setBlendMode(CanvasKit.BlendMode.Src);
    canvas.drawRect([0, 0, width, height], bgPaint);
    bgPaint.delete();
  }

  const cx = width / 2;
  const cy = height / 2;

  const rawShape = config?.shape ?? config?.geometry?.shape ?? config?.visualizerStyle ?? 'bar';
  const pluginId = config?.visualizerId || config?.pluginId;
  const effectiveShape = resolvePluginShape(pluginId, rawShape);

  const geometry = {
    shape: effectiveShape,
    thickness: config?.thickness ?? config?.geometry?.thickness ?? 4,
    spacing: config?.spacing ?? config?.geometry?.spacing ?? 2,
    rounded: config?.rounded ?? config?.geometry?.rounded ?? false,
    center: config?.center ?? config?.geometry?.center ?? false,
    mirror: config?.mirror ?? config?.geometry?.mirror ?? false,
    radius: config?.radius ?? config?.geometry?.radius ?? 100,
  };

  const appearance = {
    color: config?.color ?? config?.appearance?.color ?? '#00ffcc',
    glow: config?.glow ?? config?.appearance?.glow ?? 30,
    gradient: config?.gradient ?? config?.appearance?.gradient ?? 'None',
  };

  const gain = ((config?.fftGain ?? config?.audio?.fftGain ?? 100)) / 100;

  let baseColor = appearance.color || '#AB55F7';
  const c1 = config?.colorLeft || config?.color || '#AB55F7';
  const c2 = config?.colorRight || config?.colorLeft || config?.color || '#F59E0B';

  // Create horizontal gradient matching M4 & Live Editor
  const shader = CanvasKit.Shader.MakeLinearGradient(
    [0, 0], [width, 0],
    [parseHexColor(CanvasKit, c1), parseHexColor(CanvasKit, c2)],
    [0, 1],
    CanvasKit.TileMode.Clamp
  );

  const paint = new CanvasKit.Paint();
  paint.setShader(shader);
  paint.setStyle(CanvasKit.PaintStyle.Fill);
  paint.setAntiAlias(true);

  if (geometry.shape === 'bar') {
    const barWidth = geometry.thickness || 4;
    const spacing = geometry.spacing || 2;
    const step = barWidth + spacing;
    const totalWidth = dataArray.length * step;

    let startX = geometry.center ? (width - totalWidth) / 2 : 0;
    if (geometry.mirror) {
      startX = cx - totalWidth;
    }

    for (let i = 0; i < dataArray.length; i++) {
      const h = Math.max(2, (dataArray[i] / 255) * height * gain);
      const x = startX + i * step;

      if (geometry.center) {
        const y = cy - h / 2;
        if (geometry.rounded) {
          const rrect = CanvasKit.RRectXY([x, y, x + barWidth, y + h], barWidth / 2, barWidth / 2);
          canvas.drawRRect(rrect, paint);
          if (rrect && typeof rrect.delete === 'function') rrect.delete();
        } else {
          canvas.drawRect([x, y, x + barWidth, y + h], paint);
        }
        if (geometry.mirror) {
          const mx = width - (x - cx) - barWidth;
          if (geometry.rounded) {
            const rrect = CanvasKit.RRectXY([mx, y, mx + barWidth, y + h], barWidth / 2, barWidth / 2);
            canvas.drawRRect(rrect, paint);
            if (rrect && typeof rrect.delete === 'function') rrect.delete();
          } else {
            canvas.drawRect([mx, y, mx + barWidth, y + h], paint);
          }
        }
      } else {
        const y = height - h;
        if (geometry.rounded) {
          const rrect = CanvasKit.RRectXY([x, y, x + barWidth, y + h], barWidth / 2, barWidth / 2);
          canvas.drawRRect(rrect, paint);
          if (rrect && typeof rrect.delete === 'function') rrect.delete();
        } else {
          canvas.drawRect([x, y, x + barWidth, y + h], paint);
        }
        if (geometry.mirror) {
          const mx = width - x - barWidth;
          if (geometry.rounded) {
            const rrect = CanvasKit.RRectXY([mx, y, mx + barWidth, y + h], barWidth / 2, barWidth / 2);
            canvas.drawRRect(rrect, paint);
            if (rrect && typeof rrect.delete === 'function') rrect.delete();
          } else {
            canvas.drawRect([mx, y, mx + barWidth, y + h], paint);
          }
        }
      }
    }
  }

  paint.delete();
  shader.delete();
}

