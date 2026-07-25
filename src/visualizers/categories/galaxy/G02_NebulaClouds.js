/**
 * G02_NebulaClouds.js
 * Nebula Clouds
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'galaxy-nebula',
    name: 'NebulaClouds',
    displayName: 'Nebula Clouds',
    description: 'Audio-reactive perlin noise clouds forming a nebula',
    category: 'Galaxy',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["galaxy","nebula","clouds"],
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
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    // We will simulate nebula clouds using multiple overlapping large radial gradients
    // rather than full perlin noise to keep performance good on 2D canvas
    
    if (!state.clouds) {
        state.clouds = [];
        for(let i=0; i<15; i++) {
            state.clouds.push({
                x: Math.random() * viewport.width,
                y: Math.random() * viewport.height,
                r: Math.random() * 200 + 100,
                speedX: (Math.random() - 0.5) * 10,
                speedY: (Math.random() - 0.5) * 10,
                dataIdx: Math.floor(Math.random() * barCount)
            });
        }
    }
    
    ctx.globalCompositeOperation = 'screen';
    
    for (let i = 0; i < state.clouds.length; i++) {
        const c = state.clouds[i];
        const val = state.smoothedData[c.dataIdx] || 0;
        const energy = (val / 255) * (gain || 1.0);
        
        c.x += c.speedX * 0.016;
        c.y += c.speedY * 0.016;
        
        if (c.x < -c.r) c.x = viewport.width + c.r;
        if (c.x > viewport.width + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = viewport.height + c.r;
        if (c.y > viewport.height + c.r) c.y = -c.r;
        
        const currentR = c.r + energy * 100;
        
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, currentR);
        // Mix custom color and secondary colors
        const c1 = i % 2 === 0 ? (color || '#ff00aa') : '#00aaff';
        grad.addColorStop(0, c1 + '44'); // 25% opacity
        grad.addColorStop(1, '#00000000');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, currentR, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
}
