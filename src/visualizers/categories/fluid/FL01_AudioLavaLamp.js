/**
 * FL01_AudioLavaLamp.js
 * Audio Lava Lamp
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'fluid-lava',
    name: 'AudioLavaLamp',
    displayName: 'Audio Lava Lamp',
    description: 'Simulates lava lamp blobs that rise and merge when bass hits',
    category: 'Fluid',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["fluid","lava","lamp"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#ff0055', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    const bass = (rawData[2] || 0) / 255;
    
    if (!state.blobs) {
        state.blobs = [];
        for(let i=0; i<8; i++) {
            state.blobs.push({
                x: Math.random() * viewport.width,
                y: Math.random() * viewport.height,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                r: Math.random() * 50 + 30
            });
        }
    }
    
    // Add heat on bass
    const heat = bass * 200 * (gain || 1.0);
    
    ctx.globalCompositeOperation = 'screen';
    
    for (let i = 0; i < state.blobs.length; i++) {
        const b = state.blobs[i];
        
        b.vy -= (heat * deltaTime || 0); // rise when hot
        b.vy += 20 * (deltaTime || 0.016); // gravity
        
        b.x += b.vx * (deltaTime || 0.016);
        b.y += b.vy * (deltaTime || 0.016);
        
        // Bounce off walls
        if (b.x < 0) { b.x = 0; b.vx *= -1; }
        if (b.x > viewport.width) { b.x = viewport.width; b.vx *= -1; }
        if (b.y < -100) { b.y = viewport.height + 100; b.vy = -10; }
        if (b.y > viewport.height + 100) { b.y = -100; b.vy = 10; }
        
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, color || '#ff0055');
        grad.addColorStop(1, '#00000000');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
}
