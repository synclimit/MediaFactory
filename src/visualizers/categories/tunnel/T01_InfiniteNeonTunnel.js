/**
 * T01_InfiniteNeonTunnel.js
 * Infinite Neon Tunnel
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'tunnel-neon',
    name: 'InfiniteNeonTunnel',
    displayName: 'Infinite Neon Tunnel',
    description: 'A classic infinite neon square tunnel that reacts to speed and bass',
    category: 'Tunnel',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["tunnel","neon","infinite"],
    version: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    barCount: 64,
    gain: 1.0,
    smoothing: 0.8
};

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime, elapsedTime } = context;
    const { color, barCount, gain } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let sum = 0;
    for(let i=0; i<10; i++) sum += rawData[i] || 0;
    const bass = sum / 10 / 255;
    
    if (!state.segments) {
        state.segments = [];
        for(let i=0; i<15; i++) {
            state.segments.push({ z: i * (1000/15) });
        }
    }
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const speed = 200 + (bass * 800 * (gain || 1.0));
    
    ctx.lineWidth = 2;
    
    for (let i = 0; i < state.segments.length; i++) {
        const seg = state.segments[i];
        seg.z -= speed * (deltaTime || 0.016);
        
        if (seg.z <= 1) {
            seg.z += 1000; // loop to back
        }
        
        const fov = 300;
        const scale = fov / seg.z;
        
        // Tilt tunnel slightly
        const offsetX = Math.sin((elapsedTime || 0) * 0.5 + (seg.z / 500)) * 50 * scale;
        const offsetY = Math.cos((elapsedTime || 0) * 0.3 + (seg.z / 500)) * 50 * scale;
        
        const w = 400 * scale;
        const h = 300 * scale;
        
        const x = cx + offsetX - w/2;
        const y = cy + offsetY - h/2;
        
        const alpha = Math.max(0, 1 - (seg.z / 1000));
        ctx.strokeStyle = (color || '#ff00aa') + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.stroke();
        
        // Draw connecting lines to next segment
        if (i > 0) {
            const next = state.segments[i-1];
            if (next.z < seg.z) {
                const ns = fov / next.z;
                const nx = cx + (Math.sin((elapsedTime || 0) * 0.5 + (next.z / 500)) * 50 * ns) - (400 * ns)/2;
                const ny = cy + (Math.cos((elapsedTime || 0) * 0.3 + (next.z / 500)) * 50 * ns) - (300 * ns)/2;
                
                ctx.beginPath();
                ctx.moveTo(x, y); ctx.lineTo(nx, ny);
                ctx.moveTo(x+w, y); ctx.lineTo(nx+(400*ns), ny);
                ctx.moveTo(x, y+h); ctx.lineTo(nx, ny+(300*ns));
                ctx.moveTo(x+w, y+h); ctx.lineTo(nx+(400*ns), ny+(300*ns));
                ctx.stroke();
            }
        }
    }
}
