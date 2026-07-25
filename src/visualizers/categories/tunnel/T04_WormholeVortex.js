/**
 * T04_WormholeVortex.js
 * Wormhole Vortex
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'tunnel-wormhole',
    name: 'WormholeVortex',
    displayName: 'Wormhole Vortex',
    description: 'A spiraling vortex that sucks you in',
    category: 'Tunnel',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["tunnel","vortex","wormhole"],
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
    const { audio, state, config, viewport, elapsedTime, deltaTime } = context;
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
    
    // Average mid frequencies for vortex speed
    let sum = 0;
    for(let i=10; i<20; i++) sum += state.smoothedData[i] || 0;
    const energy = sum / 10 / 255;
    
    if (!state.rotation) state.rotation = 0;
    state.rotation += (1.0 + energy * 5 * (gain||1)) * (deltaTime || 0.016);
    
    ctx.strokeStyle = color || '#ff5500';
    ctx.lineWidth = 2;
    
    const lines = 12;
    const depth = 200;
    
    for (let l = 0; l < lines; l++) {
        const baseAngle = (l / lines) * Math.PI * 2 + state.rotation;
        
        ctx.beginPath();
        for (let i = 0; i < depth; i++) {
            // spiral equation
            const t = i / depth; // 0 to 1
            const r = Math.pow(t, 2) * (viewport.width); // flared outwards
            
            // Audio modulation on the radius
            const dataIdx = Math.floor(t * barCount) % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            const pulse = (val / 255) * 50 * (gain || 1.0) * t;
            
            const currentR = r + pulse;
            const angle = baseAngle + (t * Math.PI * 2); // twist
            
            const x = cx + Math.cos(angle) * currentR;
            const y = cy + Math.sin(angle) * currentR;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}
