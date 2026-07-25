/**
 * TR01_WireframeMountains.js
 * Wireframe Mountains
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'terrain-mountains',
    name: 'WireframeMountains',
    displayName: 'Wireframe Mountains',
    description: 'A 3D scrolling landscape where the mountains are formed by audio frequencies',
    category: 'Terrain',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["terrain","mountains","3d"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ffcc', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    // We maintain a history of spectra to draw a scrolling terrain
    if (!state.history) state.history = [];
    
    const bass = (state.smoothedData[2] || 0) / 255;
    const speed = 1000 + (bass * 1000 * (gain || 1.0));
    
    if (!state.offsetY) state.offsetY = 0;
    state.offsetY += speed * (deltaTime || 0.016);
    
    // Every time we move forward a certain amount, push a new row
    const rowSpacing = 40;
    if (state.offsetY > rowSpacing) {
        state.offsetY = 0;
        // Copy current spectrum
        state.history.unshift(new Float32Array(state.smoothedData));
        if (state.history.length > 30) state.history.pop(); // Max rows visible
    }
    
    const cx = viewport.width / 2;
    const horizonY = viewport.height * 0.3;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = 1;
    
    // To make it look like a 3D terrain, we project each row from back to front
    // Back rows are drawn first to handle fake depth/overlap
    for (let r = state.history.length - 1; r >= 0; r--) {
        const rowData = state.history[r];
        const z = r * rowSpacing - state.offsetY;
        
        // Don't draw if behind camera
        if (z < 1) continue;
        
        const fov = 400;
        const scale = fov / z;
        
        const y = horizonY + (200 * scale);
        
        // Fade far away
        const alpha = Math.max(0, Math.min(1, 1 - (z / (30 * rowSpacing))));
        
        // We draw the landscape as a filled shape to hide lines behind it
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = (color || '#00ffcc') + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        
        ctx.beginPath();
        
        // Start from bottom left screen
        const screenWidthScale = viewport.width * 2; // Make it wider than screen
        
        for (let i = 0; i <= barCount; i++) {
            const val = rowData[i] || 0;
            // Map i to x position
            const t = (i / barCount) - 0.5; // -0.5 to 0.5
            const x3d = t * screenWidthScale;
            
            // Height based on audio (mostly low/mid frequencies in center)
            const h = (val / 255) * 150 * (gain || 1.0);
            
            const px = cx + (x3d * scale);
            const py = y - (h * scale);
            
            if (i === 0) {
                ctx.moveTo(px, viewport.height + 100); // bottom left
                ctx.lineTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
            
            if (i === barCount) {
                ctx.lineTo(px, viewport.height + 100); // bottom right
            }
        }
        
        ctx.fill(); // hide things behind
        ctx.stroke(); // draw wireframe
    }
}
