import { Canvas2DRenderer } from '../Canvas2DRenderer';

/**
 * BarsRenderer.js
 * Specialized rendering abstraction for Bar-type visualizers.
 * Provides high-level APIs for drawing frequency bars.
 */
export class BarsRenderer extends Canvas2DRenderer {
    constructor(canvas) {
        super(canvas);
        this.isBarRenderer = true;
    }

    /**
     * Draws a single bar.
     * @param {Object} options
     * @param {number} options.x - X position
     * @param {number} options.y - Y position
     * @param {number} options.width - Width of the bar
     * @param {number} options.height - Height of the bar
     * @param {boolean} [options.rounded=false] - Whether to use rounded corners
     * @param {string|CanvasGradient} [options.color] - Fill color
     * @param {boolean} [options.outline=false] - If true, strokes instead of fills
     */
    drawBar({ x, y, width, height, rounded = false, color = '#ffffff', outline = false, index }) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const cfg = this.currentConfig || this.currentContext?.config || {};

        const effectiveWidth = (this.layoutBarWidth && (width === cfg.barWidth || width === 4 || width === 6 || width === 8 || !width || width < this.layoutBarWidth)) ? this.layoutBarWidth : width;

        const barTotal = this.layoutBarCount || cfg.barCount || 64;
        const barIdx = index !== undefined ? index : (this.layoutBarIndex || 0);
        if (index === undefined && this.layoutBarIndex !== undefined) {
            this.layoutBarIndex++;
        }

        let validColor = color;
        const mode = cfg.colorMode || '2 Gradient';
        
        // Flag gradient
        const isGradient = mode === '2 Gradient' || mode === 'Gradient' || mode === '3 Gradient' || mode === 'Rainbow';

        if (mode === 'Solid' || mode === 'Solid Color') {
            validColor = cfg.colorLeft || cfg.color || '#AB55F7';
        } else if (mode === '2 Gradient' || mode === 'Gradient') {
            const t = barTotal > 1 ? barIdx / (barTotal - 1) : 0;
            const c1 = cfg.colorLeft || cfg.color || '#AB55F7';
            const c2 = cfg.colorRight || '#F59E0B';
            validColor = this.interpolateHexColor(c1, c2, t);
        } else if (mode === '3 Gradient') {
            const t = barTotal > 1 ? barIdx / (barTotal - 1) : 0;
            const c1 = cfg.colorLeft || cfg.color || '#AB55F7';
            const c2 = cfg.colorMid || '#06B6D4';
            const c3 = cfg.colorRight || '#F59E0B';
            if (t <= 0.5) {
                validColor = this.interpolateHexColor(c1, c2, t * 2);
            } else {
                validColor = this.interpolateHexColor(c2, c3, (t - 0.5) * 2);
            }
        } else if (mode === 'Rainbow') {
            validColor = `hsl(${(barIdx * (360 / Math.max(1, barTotal))) % 360}, 100%, 55%)`;
        } else if (mode === 'Neon') {
            validColor = cfg.neonColor || '#00f3ff';
        } else if (!validColor || validColor === 'Dynamic Color' || typeof validColor !== 'string') {
            validColor = '#00ffcc';
        }

        // FEATURE FLAG: Visualizer Batching
        const enableBatching = window.__M3_FEATURE_FLAGS?.enableVisualizerBatching ?? true;

        if (enableBatching && !isGradient) {
            // State-based Path2D Batching
            const stateKey = `${validColor}_${outline}_${rounded}_${mode}_${cfg.bloom}_${cfg.fakeNeon}_${cfg.outerGlow}_${cfg.outerGlowColor}_${cfg.outerGlowThickness}`;
            
            if (this._batchStateKey !== stateKey) {
                this.flushBatch();
                this._batchStateKey = stateKey;
                this._batchPath = new Path2D();
                this._batchProps = { validColor, outline, rounded, mode, cfg };
            }
            
            if (rounded) {
                this._batchPath.roundRect(x, y, effectiveWidth, height, effectiveWidth / 2);
            } else {
                this._batchPath.rect(x, y, effectiveWidth, height);
            }
            
            // Flush immediately if it is the last bar in the sequence
            if (barIdx >= barTotal - 1) {
                this.flushBatch();
            }
            return;
        }

        // LEGACY BEHAVIOUR (For Gradients or when flag is false)
        this.flushBatch(); // Ensure no pending paths overlap out of order

        ctx.save();
        if (cfg.bloom || cfg.fakeNeon || mode === 'Neon') {
            ctx.shadowBlur = mode === 'Neon' ? 24 : (cfg.fakeNeon ? 16 : 10);
            ctx.shadowColor = validColor;
        } else {
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }

        ctx.fillStyle = validColor;
        ctx.strokeStyle = validColor;
        
        if (rounded) {
            ctx.beginPath();
            ctx.roundRect(x, y, effectiveWidth, height, effectiveWidth / 2);
            if (outline) ctx.stroke();
            else ctx.fill();
        } else {
            if (outline) ctx.strokeRect(x, y, effectiveWidth, height);
            else ctx.fillRect(x, y, effectiveWidth, height);
        }

        if (cfg.outerGlow) {
            const outerColor = cfg.outerGlowColor || '#BD0F0F';
            const outerThick = cfg.outerGlowThickness !== undefined ? Number(cfg.outerGlowThickness) : 3;
            ctx.save();
            ctx.strokeStyle = outerColor;
            ctx.lineWidth = outerThick;
            ctx.shadowColor = outerColor;
            ctx.shadowBlur = outerThick * 4;
            if (rounded) {
                ctx.beginPath();
                ctx.roundRect(x, y, effectiveWidth, height, effectiveWidth / 2);
                ctx.stroke();
            } else {
                ctx.strokeRect(x, y, effectiveWidth, height);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    flushBatch() {
        if (!this._batchPath || !this._batchProps || !this.ctx) return;
        
        const ctx = this.ctx;
        const { validColor, outline, rounded, mode, cfg } = this._batchProps;
        
        ctx.save();
        if (cfg.bloom || cfg.fakeNeon || mode === 'Neon') {
            ctx.shadowBlur = mode === 'Neon' ? 24 : (cfg.fakeNeon ? 16 : 10);
            ctx.shadowColor = validColor;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = validColor;
        ctx.strokeStyle = validColor;
        
        if (outline) {
            ctx.stroke(this._batchPath);
        } else {
            ctx.fill(this._batchPath);
        }

        if (cfg.outerGlow) {
            const outerColor = cfg.outerGlowColor || '#BD0F0F';
            const outerThick = cfg.outerGlowThickness !== undefined ? Number(cfg.outerGlowThickness) : 3;
            ctx.save();
            ctx.strokeStyle = outerColor;
            ctx.lineWidth = outerThick;
            ctx.shadowColor = outerColor;
            ctx.shadowBlur = outerThick * 4;
            ctx.stroke(this._batchPath);
            ctx.restore();
        }
        ctx.restore();
        
        this._batchPath = null;
        this._batchStateKey = null;
        this._batchProps = null;
    }

    endFrame(context) {
        this.flushBatch();
        super.endFrame(context);
    }

    interpolateHexColor(hex1, hex2, t) {
        try {
            const parse = (h) => {
                let clean = (h || '').replace('#', '');
                if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
                const num = parseInt(clean || '00ffcc', 16);
                return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
            };
            const [r1, g1, b1] = parse(hex1 || '#AB55F7');
            const [r2, g2, b2] = parse(hex2 || '#F59E0B');
            const clampedT = Math.max(0, Math.min(1, t || 0));
            const r = Math.round(r1 + (r2 - r1) * clampedT);
            const g = Math.round(g1 + (g2 - g1) * clampedT);
            const b = Math.round(b1 + (b2 - b1) * clampedT);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        } catch (e) {
            return hex1 || '#00ffcc';
        }
    }

    /**
     * Helper to compute layout for a linear equalizer
     */
    computeLinearLayout(dataCount, barWidth, spacing, isCentered = false, autoFit = true) {
        this.layoutBarCount = dataCount;
        this.layoutBarIndex = 0;
        if (autoFit && this.width > 0 && dataCount > 0) {
            // Span across 94% of canvas width so reducing barCount widens/zooms the bars
            const availableWidth = this.width * 0.94;
            const step = availableWidth / dataCount;
            const computedSpacing = Math.max(1, Math.min(step * 0.22, 20));
            const computedBarWidth = Math.max(1, step - computedSpacing);
            const totalWidth = dataCount * step;
            const startX = (this.width - totalWidth) / 2 + (computedSpacing / 2);
            this.layoutBarWidth = computedBarWidth;
            return { step, totalWidth, startX, barWidth: computedBarWidth, spacing: computedSpacing };
        }
        const step = barWidth + spacing;
        const totalWidth = dataCount * step;
        const startX = isCentered ? this.cx - (totalWidth / 2) : 0;
        this.layoutBarWidth = barWidth;
        return { step, totalWidth, startX, barWidth, spacing };
    }
}
