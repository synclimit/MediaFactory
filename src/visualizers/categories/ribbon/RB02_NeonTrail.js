/**
 * RB02_NeonTrail.js
 * Neon Trail Ribbon
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ribbon-neon-trail',
    name: 'NeonTrail',
    displayName: 'Neon Trail Ribbon',
    description: 'A bright neon ribbon trail that leaves a fading echo',
    category: 'Ribbon',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["ribbon","neon","trail"],
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
    
    if (!state.history) state.history = [];
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const time = elapsedTime || 0;
    
    // Average energy for amplitude
    let sum = 0;
    for(let i=0; i<10; i++) sum += state.smoothedData[i] || 0;
    const energy = sum / 10 / 255;
    
    const amp = 100 + (energy * 300 * (gain || 1.0));
    
    // Compute current head position (Lissajous curve)
    const headX = cx + Math.sin(time * 1.3) * (viewport.width * 0.4);
    const headY = cy + Math.sin(time * 2.1) * amp;
    
    // Add to history
    state.history.unshift({ x: headX, y: headY, e: energy });
    
    // Cap history length
    const maxHistory = 100;
    if (state.history.length > maxHistory) state.history.pop();
    
    // Draw history as a ribbon
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 0; i < state.history.length - 1; i++) {
        const pt1 = state.history[i];
        const pt2 = state.history[i+1];
        
        const alpha = 1.0 - (i / maxHistory);
        const width = 2 + (pt1.e * 20); // thicker when loud
        
        ctx.strokeStyle = (color || '#ff00aa') + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = width;
        
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
        
        // Draw inner hot core
        ctx.strokeStyle = '#ffffff' + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = width * 0.3;
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
    }
}
