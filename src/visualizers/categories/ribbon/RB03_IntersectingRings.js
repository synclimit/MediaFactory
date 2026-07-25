/**
 * RB03_IntersectingRings.js
 * Intersecting Ribbon Rings
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ribbon-rings',
    name: 'IntersectingRings',
    displayName: 'Intersecting Ribbon Rings',
    description: 'Multiple ribbons orbiting in 3D rings',
    category: 'Ribbon',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["ribbon","rings","orbit"],
    version: '1.0.0'
};

export const defaultConfig = {
    color: '#ff00aa',
    barCount: 64,
    gain: 1.0,
    smoothing: 0.8
};

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
    const time = elapsedTime || 0;
    
    ctx.lineWidth = 1.5;
    
    const rings = 3;
    const points = 100;
    
    for (let r = 0; r < rings; r++) {
        ctx.strokeStyle = r % 2 === 0 ? (color || '#00ffcc') : '#ff00aa';
        
        ctx.save();
        ctx.translate(cx, cy);
        
        // Rotate the entire ring in 3D space (simulated)
        ctx.rotate(time * (0.5 + r * 0.2));
        ctx.scale(1, 0.3 + (r * 0.2)); // tilt
        
        for (let i = 0; i < points; i++) {
            const t = i / points;
            const angle = t * Math.PI * 2;
            
            const dataIdx = Math.floor(t * barCount) % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            const pulse = (val / 255) * 60 * (gain || 1.0);
            
            const radius = 200 + (r * 50) + pulse;
            const ribbonWidth = 20 + (val / 255) * 40; // width based on audio
            
            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle) * (radius + ribbonWidth);
            const y2 = Math.sin(angle) * (radius + ribbonWidth);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();
    }
}
