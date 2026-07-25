/**
 * EXP01_FractalNoise.js
 * Fractal Noise
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'experimental-fractal',
    name: 'FractalNoise',
    displayName: 'Fractal Noise',
    description: 'A chaotic mathematical fractal heavily distorted by audio',
    category: 'Experimental',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["experimental","fractal","math"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#ff00ff', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let energy = 0;
    for(let i=0; i<10; i++) energy += rawData[i] || 0;
    energy = (energy / 10) / 255;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const time = elapsedTime || 0;
    
    ctx.strokeStyle = color || '#ff00ff';
    ctx.lineWidth = 1;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    const maxIters = 5;
    
    const drawFractal = (r, angle, depth) => {
        if (depth === 0) return;
        
        const nextR = r * (0.6 + energy * 0.2 * (gain||1));
        const x = Math.cos(angle) * nextR;
        const y = Math.sin(angle) * nextR;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(x, y);
        
        const split = 1.0 + Math.sin(time) * 0.5;
        drawFractal(nextR, angle - split, depth - 1);
        drawFractal(nextR, angle + split, depth - 1);
        
        ctx.restore();
    };
    
    const branches = 6;
    for(let i=0; i<branches; i++) {
        drawFractal(100, (i/branches) * Math.PI * 2 + time * 0.5, maxIters);
    }
    
    ctx.restore();
}
