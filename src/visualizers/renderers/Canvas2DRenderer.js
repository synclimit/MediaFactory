import { IRenderer } from './IRenderer';

/**
 * Canvas2DRenderer.js
 * Core Canvas2D implementation of IRenderer.
 */
export class Canvas2DRenderer extends IRenderer {
    constructor(canvas) {
        super(canvas);
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.cx = 0;
        this.cy = 0;
    }

    initialize() {
        this.ctx = this.canvas.getContext('2d');
        this.resize(this.canvas.width, this.canvas.height);
    }

    beginFrame(context) {
        if (!this.ctx) return;
        if (this.ctx._originalStroke) {
            this.ctx.stroke = this.ctx._originalStroke;
            this.ctx._originalStroke = null;
        }
        if (this.ctx._originalFill) {
            this.ctx.fill = this.ctx._originalFill;
            this.ctx._originalFill = null;
        }
        if (this._hasSpatialTransform) {
            this.ctx.restore();
            this._hasSpatialTransform = false;
        }

        // Default clear
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.currentContext = context;
        const cfg = context?.config || this.currentConfig || {};
        this.currentConfig = cfg;

        // 1. Proportional Box Scaling + Spatial offsets around canvas center (cx, cy)
        // Note: Master Size (cfg.scale) is already applied by MediaFactoryRenderer via CSS transform: scale(effectiveScale).
        // To prevent double scaling AND ensure the spectrum inside automatically scales proportionally when the bounding box (width/height) is dragged in Live Composer:
        const baseScale = cfg.scale !== undefined ? Number(cfg.scale) : 1.0;
        const scaleX = cfg.scaleX !== undefined ? Number(cfg.scaleX) : baseScale;
        const scaleY = cfg.scaleY !== undefined ? Number(cfg.scaleY) : baseScale;
        const ratioX = baseScale > 0 ? scaleX / baseScale : 1.0;
        const ratioY = baseScale > 0 ? scaleY / baseScale : 1.0;

        const offsetX = (cfg.canvasOffsetX !== undefined ? Number(cfg.canvasOffsetX) : 0);
        const offsetY = (cfg.canvasOffsetY !== undefined ? Number(cfg.canvasOffsetY) : 0);

        // For non-bar visualizers (Mandala, Spiral, Circle, Waves, Particle, Ring, Geometry, Neon, etc.),
        // scale proportionally with the canvas dimensions (base design reference: 400px diameter).
        const autoBoxScale = !this.isBarRenderer ? (Math.min(this.width, this.height) / 400) : 1.0;

        const effectiveScaleX = autoBoxScale * ratioX;
        const effectiveScaleY = autoBoxScale * ratioY;

        if (Math.abs(effectiveScaleX - 1.0) > 0.001 || Math.abs(effectiveScaleY - 1.0) > 0.001 || offsetX !== 0 || offsetY !== 0) {
            this.ctx.save();
            this.ctx.translate(this.cx + offsetX, this.cy + offsetY);
            this.ctx.scale(effectiveScaleX, effectiveScaleY);
            this.ctx.translate(-this.cx, -this.cy);
            this._hasSpatialTransform = true;
        } else {
            this._hasSpatialTransform = false;
        }

        // 2. For non-bar renderers (Waves, Circles, Spirals, Mandalas, Particles, etc.), apply glow and gradient overrides
        if (!this.isBarRenderer) {
            const mode = cfg.colorMode || '2 Gradient';
            if (mode === 'Neon') {
                this.ctx.shadowBlur = 24;
                this.ctx.shadowColor = cfg.neonColor || '#00f3ff';
            } else if (cfg.bloom || cfg.fakeNeon) {
                this.ctx.shadowBlur = cfg.fakeNeon ? 16 : 10;
                this.ctx.shadowColor = cfg.color || '#AB55F7';
            } else {
                this.ctx.shadowBlur = 0;
            }

            if (mode === '2 Gradient' || mode === 'Gradient' || mode === '3 Gradient' || mode === 'Rainbow') {
                let grad;
                if (mode === '2 Gradient' || mode === 'Gradient') {
                    grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
                    grad.addColorStop(0, cfg.colorLeft || cfg.color || '#AB55F7');
                    grad.addColorStop(1, cfg.colorRight || '#F59E0B');
                } else if (mode === '3 Gradient') {
                    grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
                    grad.addColorStop(0, cfg.colorLeft || cfg.color || '#AB55F7');
                    grad.addColorStop(0.5, cfg.colorMid || '#06B6D4');
                    grad.addColorStop(1, cfg.colorRight || '#F59E0B');
                } else if (mode === 'Rainbow') {
                    grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
                    for (let i = 0; i <= 6; i++) {
                        grad.addColorStop(i / 6, `hsl(${(i * 60) % 360}, 100%, 55%)`);
                    }
                }
                if (grad) {
                    this.ctx._originalStroke = this.ctx.stroke;
                    this.ctx._originalFill = this.ctx.fill;
                    const ctxRef = this.ctx;
                    this.ctx.stroke = function(...args) {
                        ctxRef.strokeStyle = grad;
                        return ctxRef._originalStroke.apply(this, args);
                    };
                    this.ctx.fill = function(...args) {
                        ctxRef.fillStyle = grad;
                        return ctxRef._originalFill.apply(this, args);
                    };
                }
            }
        }
    }

    endFrame(context) {
        if (!this.ctx) return;
        if (this.ctx._originalStroke) {
            this.ctx.stroke = this.ctx._originalStroke;
            this.ctx._originalStroke = null;
        }
        if (this.ctx._originalFill) {
            this.ctx.fill = this.ctx._originalFill;
            this.ctx._originalFill = null;
        }
        if (this._hasSpatialTransform) {
            this.ctx.restore();
            this._hasSpatialTransform = false;
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.cx = width / 2;
        this.cy = height / 2;
        
        if (this.canvas.width !== width) this.canvas.width = width;
        if (this.canvas.height !== height) this.canvas.height = height;
    }

    dispose() {
        this.ctx = null;
    }

    /**
     * Helper to get the context for direct manipulation by pipelines
     */
    getContext() {
        return this.ctx;
    }
}
