/**
 * GEO01_PolygonalWeb.js
 * Polygonal Web
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'geometry-web',
    name: 'PolygonalWeb',
    displayName: 'Polygonal Web',
    description: 'A dynamic 3D web of interconnected polygons',
    category: 'Geometry',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["geometry","polygon","web"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ffcc', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = 1;
    
    const points = 16;
    const rings = 5;
    const baseR = 50;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.2);
    
    // Draw concentric polygons
    for (let r = 1; r <= rings; r++) {
        const ringDataIdx = Math.floor((r / rings) * barCount) % barCount;
        const val = state.smoothedData[ringDataIdx] || 0;
        const pulse = (val / 255) * 50 * (gain || 1.0);
        
        const currentR = baseR * r + pulse * r;
        
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const x = Math.cos(angle) * currentR;
            const y = Math.sin(angle) * currentR;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // Draw connecting spokes
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // Find outer ring pos
        const outerVal = state.smoothedData[Math.floor(barCount - 1)] || 0;
        const outerPulse = (outerVal / 255) * 50 * (gain || 1.0);
        const maxR = baseR * rings + outerPulse * rings;
        
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * maxR, Math.sin(angle) * maxR);
    }
    ctx.stroke();
    ctx.restore();
}
