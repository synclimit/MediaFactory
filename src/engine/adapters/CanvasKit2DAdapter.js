/**
 * CanvasKit2DAdapter.js
 * Canvas2D API Adapter Bridge for CanvasKit Skia Canvas.
 * 
 * Translates standard HTML5 Canvas2D Context methods (fillRect, lineTo, arc, fill, stroke)
 * to Skia CanvasKit Paint/Path calls via SVG path compilation.
 */

export class CanvasKit2DAdapter {
  constructor(CanvasKit, canvas) {
    this.CanvasKit = CanvasKit;
    this.canvas = canvas;
    this.svgCmds = [];

    this._fillStyle = '#00ffcc';
    this._strokeStyle = '#00ffcc';
    this._lineWidth = 1;
    this._globalAlpha = 1.0;

    this.fillPaint = new CanvasKit.Paint();
    this.fillPaint.setStyle(CanvasKit.PaintStyle.Fill);
    this.fillPaint.setAntiAlias(true);

    this.strokePaint = new CanvasKit.Paint();
    this.strokePaint.setStyle(CanvasKit.PaintStyle.Stroke);
    this.strokePaint.setAntiAlias(true);

    this._updatePaintColors();
  }

  set fillStyle(val) {
    this._fillStyle = val;
    this._updatePaintColors();
  }
  get fillStyle() { return this._fillStyle; }

  set strokeStyle(val) {
    this._strokeStyle = val;
    this._updatePaintColors();
  }
  get strokeStyle() { return this._strokeStyle; }

  set lineWidth(val) {
    this._lineWidth = val;
    this.strokePaint.setStrokeWidth(val);
  }
  get lineWidth() { return this._lineWidth; }

  set globalAlpha(val) {
    this._globalAlpha = val;
    this._updatePaintColors();
  }
  get globalAlpha() { return this._globalAlpha; }

  _parseColor(hexStr) {
    const c = (typeof hexStr === 'string' ? hexStr : '#00ffcc').replace('#', '');
    let r = 0, g = 255, b = 204, a = this._globalAlpha;
    if (c.length === 6) {
      r = parseInt(c.substring(0, 2), 16) || 0;
      g = parseInt(c.substring(2, 4), 16) || 255;
      b = parseInt(c.substring(4, 6), 16) || 204;
    }
    return this.CanvasKit.Color(r, g, b, a);
  }

  _updatePaintColors() {
    if (this.fillPaint) {
      this.fillPaint.setColor(this._parseColor(this._fillStyle));
    }
    if (this.strokePaint) {
      this.strokePaint.setColor(this._parseColor(this._strokeStyle));
    }
  }

  save() {
    this.canvas.save();
  }

  restore() {
    this.canvas.restore();
  }

  fillRect(x, y, width, height) {
    const rect = [x, y, x + width, y + height];
    this.canvas.drawRect(rect, this.fillPaint);
  }

  strokeRect(x, y, width, height) {
    const rect = [x, y, x + width, y + height];
    this.canvas.drawRect(rect, this.strokePaint);
  }

  beginPath() {
    this.svgCmds = [];
  }

  closePath() {
    this.svgCmds.push('Z');
  }

  moveTo(x, y) {
    this.svgCmds.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  lineTo(x, y) {
    this.svgCmds.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this.svgCmds.push(`Q ${cpx.toFixed(2)} ${cpy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  arc(cx, cy, radius, startAngle = 0, endAngle = Math.PI * 2) {
    if (radius <= 0) return;
    // Approximated arc using vertex points
    const step = Math.PI / 16;
    let first = true;
    for (let a = startAngle; a <= endAngle + 0.01; a += step) {
      const px = cx + Math.cos(a) * radius;
      const py = cy + Math.sin(a) * radius;
      if (first && this.svgCmds.length === 0) {
        this.svgCmds.push(`M ${px.toFixed(2)} ${py.toFixed(2)}`);
        first = false;
      } else {
        this.svgCmds.push(`L ${px.toFixed(2)} ${py.toFixed(2)}`);
      }
    }
  }

  fill() {
    if (this.svgCmds.length > 0) {
      const pathStr = this.svgCmds.join(' ');
      const skPath = this.CanvasKit.Path.MakeFromSVGString(pathStr);
      if (skPath) {
        this.canvas.drawPath(skPath, this.fillPaint);
        skPath.delete();
      }
    }
  }

  stroke() {
    if (this.svgCmds.length > 0) {
      const pathStr = this.svgCmds.join(' ');
      const skPath = this.CanvasKit.Path.MakeFromSVGString(pathStr);
      if (skPath) {
        this.canvas.drawPath(skPath, this.strokePaint);
        skPath.delete();
      }
    }
  }

  createLinearGradient(x0, y0, x1, y1) {
    return {
      addColorStop: (offset, color) => {
        this.fillStyle = color;
      }
    };
  }

  dispose() {
    this.svgCmds = [];
    if (this.fillPaint) {
      this.fillPaint.delete();
    }
    if (this.strokePaint) {
      this.strokePaint.delete();
    }
  }
}
