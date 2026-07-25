/**
 * 3D01_FloatingIslands.js
 * 3D Floating Islands
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: '3d-islands',
    name: 'FloatingIslands',
    displayName: '3D Floating Islands',
    description: 'Low-poly 3D islands floating and bobbing to the music',
    category: '3D',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["3d","islands","lowpoly"],
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
    
    if (!state.islands) {
        state.islands = [];
        for(let i=0; i<10; i++) {
            state.islands.push({
                x: (Math.random() - 0.5) * 800,
                y: (Math.random() - 0.5) * 200,
                z: Math.random() * 800 + 200,
                freqIdx: Math.floor(Math.random() * barCount)
            });
        }
    }
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const time = elapsedTime || 0;
    
    // Sort by Z for fake depth
    state.islands.sort((a, b) => b.z - a.z);
    
    ctx.lineWidth = 1;
    
    for (let i = 0; i < state.islands.length; i++) {
        const isl = state.islands[i];
        
        // Very slow rotation
        const newX = isl.x * Math.cos(deltaTime * 0.1) - isl.z * Math.sin(deltaTime * 0.1);
        const newZ = isl.x * Math.sin(deltaTime * 0.1) + isl.z * Math.cos(deltaTime * 0.1);
        isl.x = newX;
        isl.z = Math.max(1, newZ);
        
        const val = state.smoothedData[isl.freqIdx] || 0;
        const bounce = (val / 255) * 100 * (gain || 1.0);
        
        const fov = 400;
        const scale = fov / isl.z;
        
        const px = cx + isl.x * scale;
        const py = cy + (isl.y - bounce + Math.sin(time + isl.freqIdx)*20) * scale;
        
        const size = 50 * scale;
        
        // Draw an upside down pyramid (island)
        ctx.fillStyle = '#222222';
        ctx.strokeStyle = color || '#00ffcc';
        
        ctx.beginPath();
        ctx.moveTo(px - size, py);
        ctx.lineTo(px + size, py);
        ctx.lineTo(px, py + size*1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Top surface
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(px - size, py);
        ctx.lineTo(px, py - size*0.3);
        ctx.lineTo(px + size, py);
        ctx.lineTo(px, py + size*0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}
