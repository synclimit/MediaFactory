/**
 * drawVisualizer.js
 * Single Engine Shared Visualizer Drawing Module (MF-3000 Architecture)
 * Shared between Live Editor Preview (M3PreviewCanvas.jsx) and Export Pipeline.
 */

export function drawVisualizer(ctx, dataArray, config = {}, width = 1920, height = 1080, clearCanvas = true) {
  if (!ctx || !dataArray || width === 0 || height === 0) return;

  if (clearCanvas) {
    ctx.clearRect(0, 0, width, height);
  }

  const cx = width / 2;
  const cy = height / 2;

  const geometry = {
    shape: config?.shape ?? config?.geometry?.shape ?? 'bar',
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
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  baseColor = grad;

  ctx.shadowBlur = appearance.glow || 0;
  ctx.shadowColor = c1;
  ctx.fillStyle = baseColor;
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = geometry.thickness || 4;
  ctx.lineCap = geometry.rounded ? 'round' : 'butt';

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
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, barWidth / 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, h);
        }
        if (geometry.mirror) {
          const mx = width - (x - cx) - barWidth;
          if (geometry.rounded) {
            ctx.beginPath();
            ctx.roundRect(mx, y, barWidth, h, barWidth / 2);
            ctx.fill();
          } else {
            ctx.fillRect(mx, y, barWidth, h);
          }
        }
      } else {
        const y = height - h;
        if (geometry.rounded) {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, [barWidth / 2, barWidth / 2, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, h);
        }
        if (geometry.mirror) {
          const mx = width - x - barWidth;
          if (geometry.rounded) {
            ctx.beginPath();
            ctx.roundRect(mx, y, barWidth, h, [barWidth / 2, barWidth / 2, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(mx, y, barWidth, h);
          }
        }
      }
    }
  }
}
