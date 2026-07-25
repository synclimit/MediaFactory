/**
 * N02_LaserGrid.js
 * Laser Grid
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'neon-grid',
    name: 'LaserGrid',
    displayName: 'Laser Grid',
    description: 'A scrolling 3D wireframe terrain floor',
    category: 'Neon',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["neon","grid","synthwave"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ffcc', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, elapsedTime, deltaTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    if (!state.offset) state.offset = 0;
    
    const bass = (state.smoothedData[2] || 0) / 255;
    const speed = 200 + (bass * 500 * (gain || 1.0));
    
    state.offset += speed * (deltaTime || 0.016);
    if (state.offset > 50) state.offset -= 50;
    
    const cx = viewport.width / 2;
    const cy = viewport.height * 0.7; // horizon lower down
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = 1.5;
    
    // Draw horizontal lines (depth)
    for (let i = 1; i <= 20; i++) {
        const z = i * 50 - state.offset;
        const fov = 300;
        const scale = fov / Math.max(1, z);
        
        const y = cy + (200 * scale);
        
        // fade far away
        const alpha = Math.max(0, 1 - (z / 1000));
        ctx.strokeStyle = (color || '#00ffcc') + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(viewport.width, y);
        ctx.stroke();
    }
    
    // Draw vertical lines (perspective)
    ctx.strokeStyle = color || '#00ffcc';
    for (let x = -10; x <= 10; x++) {
        const startX = cx + (x * 100);
        
        ctx.beginPath();
        ctx.moveTo(cx, cy); // horizon point
        
        // calculate end point
        const fov = 300;
        const scale = fov / 100;
        const endY = cy + (200 * scale);
        const endX = cx + (startX - cx) * scale * 5;
        
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}
