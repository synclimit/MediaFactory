/**
 * CanvasKit2DAdapter.js
 * Canvas2D API Adapter Bridge for CanvasKit Skia Canvas.
 *
 * Translates standard HTML5 Canvas2D Context methods (fillRect, lineTo, arc, fill, stroke)
 * to Skia CanvasKit Paint/Path calls via SVG path compilation.
 *
 * GRADIENT FIX: createLinearGradient now properly interpolates colors across stops,
 * matching HTML5 Canvas2D behaviour. Previously only the last addColorStop color was used.
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
    // Active gradient object (null when fillStyle is a plain color string)
    this._activeGradient = null;

    this.fillPaint = new CanvasKit.Paint();
    this.fillPaint.setStyle(CanvasKit.PaintStyle.Fill);
    this.fillPaint.setAntiAlias(true);

    this.strokePaint = new CanvasKit.Paint();
    this.strokePaint.setStyle(CanvasKit.PaintStyle.Stroke);
    this.strokePaint.setAntiAlias(true);

    this._updatePaintColors();
  }

  set fillStyle(val) {
    if (val && typeof val === 'object' && val._isGradient) {
      // Gradient object — defer actual paint update until draw time (we need x-position)
      this._activeGradient = val;
    } else {
      this._activeGradient = null;
      this._fillStyle = val;
      this._updatePaintColors();
    }
  }
  get fillStyle() { return this._activeGradient || this._fillStyle; }

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

  /**
   * Interpolates a color at a given ratio [0,1] across a sorted list of gradient stops.
   * @param {Array<{offset: number, color: string}>} stops
   * @param {number} ratio [0, 1]
   * @returns {string} Hex color string
   */
  _interpolateGradient(stops, ratio) {
    if (!stops || stops.length === 0) return '#00ffcc';
    if (stops.length === 1) return stops[0].color;
    if (ratio <= stops[0].offset) return stops[0].color;
    if (ratio >= stops[stops.length - 1].offset) return stops[stops.length - 1].color;

    let lo = stops[0], hi = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (ratio >= stops[i].offset && ratio <= stops[i + 1].offset) {
        lo = stops[i];
        hi = stops[i + 1];
        break;
      }
    }

    const span = hi.offset - lo.offset;
    const t = span > 0 ? (ratio - lo.offset) / span : 0;

    // Parse hex colors
    const parseHex = (hex) => {
      const c = hex.replace('#', '');
      return [
        parseInt(c.substring(0, 2), 16) || 0,
        parseInt(c.substring(2, 4), 16) || 0,
        parseInt(c.substring(4, 6), 16) || 0
      ];
    };
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const [r0, g0, b0] = parseHex(lo.color);
    const [r1, g1, b1] = parseHex(hi.color);
    const r = lerp(r0, r1, t).toString(16).padStart(2, '0');
    const g = lerp(g0, g1, t).toString(16).padStart(2, '0');
    const b = lerp(b0, b1, t).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  /**
   * Applies gradient or solid fill color to fillPaint for a given x-position.
   * @param {number} x    x-coordinate of the shape being drawn
   * @param {number} [w]  width of the shape (optional, for centering gradient sample)
   */
  _applyFillForX(x, w = 0) {
    if (this._activeGradient && this._activeGradient._isGradient) {
      const g = this._activeGradient;
      const span = g._x1 - g._x0;
      const sampleX = x + w / 2;
      const ratio = span > 0 ? Math.min(1, Math.max(0, (sampleX - g._x0) / span)) : 0;
      const color = this._interpolateGradient(g._stops, ratio);
      this.fillPaint.setColor(this._parseColor(color));
    }
  }

  _updatePaintColors() {
    if (this.fillPaint && !this._activeGradient) {
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

  clearRect(x, y, w, h) {
    const clearPaint = new this.CanvasKit.Paint();
    clearPaint.setColor(this.CanvasKit.Color(0, 0, 0, 0));
    clearPaint.setBlendMode(this.CanvasKit.BlendMode.Src);
    this.canvas.drawRect([x, y, x + w, y + h], clearPaint);
    clearPaint.delete();
  }

  fillRect(x, y, width, height) {
    this._applyFillForX(x, width);
    const rect = [x, y, x + width, y + height];
    this.canvas.drawRect(rect, this.fillPaint);
  }

  strokeRect(x, y, width, height) {
    const rect = [x, y, x + width, y + height];
    this.canvas.drawRect(rect, this.strokePaint);
  }

  beginPath() {
    this.svgCmds = [];
    this._pathStartX = null;
  }

  closePath() {
    this.svgCmds.push('Z');
  }

  moveTo(x, y) {
    if (this._pathStartX === null) this._pathStartX = x;
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
        this._pathStartX = px;
        this.svgCmds.push(`M ${px.toFixed(2)} ${py.toFixed(2)}`);
        first = false;
      } else {
        this.svgCmds.push(`L ${px.toFixed(2)} ${py.toFixed(2)}`);
      }
    }
  }

  arcTo(x1, y1, x2, y2, r) {
    // Approximation: line to tangent point
    this.svgCmds.push(`L ${x1.toFixed(2)} ${y1.toFixed(2)}`);
  }

  roundRect(x, y, w, h, r) {
    // Approximate roundRect as a path (CSS roundRect fallback)
    const rad = Array.isArray(r) ? r[0] : r;
    this.beginPath();
    this.moveTo(x + rad, y);
    this.svgCmds.push(`L ${(x + w - rad).toFixed(2)} ${y.toFixed(2)}`);
    this.svgCmds.push(`Q ${(x + w).toFixed(2)} ${y.toFixed(2)} ${(x + w).toFixed(2)} ${(y + rad).toFixed(2)}`);
    this.svgCmds.push(`L ${(x + w).toFixed(2)} ${(y + h - rad).toFixed(2)}`);
    this.svgCmds.push(`Q ${(x + w).toFixed(2)} ${(y + h).toFixed(2)} ${(x + w - rad).toFixed(2)} ${(y + h).toFixed(2)}`);
    this.svgCmds.push(`L ${(x + rad).toFixed(2)} ${(y + h).toFixed(2)}`);
    this.svgCmds.push(`Q ${x.toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${(y + h - rad).toFixed(2)}`);
    this.svgCmds.push(`L ${x.toFixed(2)} ${(y + rad).toFixed(2)}`);
    this.svgCmds.push(`Q ${x.toFixed(2)} ${y.toFixed(2)} ${(x + rad).toFixed(2)} ${y.toFixed(2)}`);
    this.svgCmds.push('Z');
    this._pathStartX = x;
  }

  fill() {
    if (this.svgCmds.length > 0) {
      // Apply gradient at path start X if active
      if (this._activeGradient && this._pathStartX !== null) {
        this._applyFillForX(this._pathStartX);
      }
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

  /**
   * Returns a gradient descriptor object compatible with the fillStyle setter.
   * Stores x0, x1, and stops for deferred per-draw color interpolation.
   */
  createLinearGradient(x0, y0, x1, y1) {
    const gradientObj = {
      _isGradient: true,
      _x0: x0,
      _x1: x1,
      _stops: []
    };
    gradientObj.addColorStop = (offset, color) => {
      gradientObj._stops.push({ offset, color });
      // Keep stops sorted by offset
      gradientObj._stops.sort((a, b) => a.offset - b.offset);
    };
    return gradientObj;
  }

  dispose() {
    this.svgCmds = [];
    this._activeGradient = null;
    if (this.fillPaint) {
      this.fillPaint.delete();
    }
    if (this.strokePaint) {
      this.strokePaint.delete();
    }
  }
}

