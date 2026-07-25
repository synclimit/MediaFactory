/**
 * G01_SpiralGalaxy.js
 * Spiral Galaxy
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'galaxy-spiral',
    name: 'SpiralGalaxy',
    displayName: 'Spiral Galaxy',
    description: 'A dense spiral galaxy that expands and pulses with music',
    category: 'Galaxy',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["galaxy","space","spiral"],
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
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    // Calculate global energy
    let sum = 0;
    for(let i=0; i<10; i++) sum += state.smoothedData[i] || 0;
    const energy = sum / 10 / 255;
    
    ctx.fillStyle = color || '#00ffcc';
    
    // Arms of galaxy
    const arms = 5;
    const starsPerArm = 200;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.1);
    
    for (let arm = 0; arm < arms; arm++) {
        const armPhase = (arm / arms) * Math.PI * 2;
        
        for (let i = 0; i < starsPerArm; i++) {
            const t = (i / starsPerArm); // 0 to 1
            const r = t * viewport.width * 0.6;
            
            // Logarithmic spiral angle
            const angle = armPhase + (t * Math.PI * 4);
            
            // Audio react
            const dataIdx = Math.floor(t * barCount) % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            const pulse = (val / 255) * 20 * (gain || 1.0);
            
            // Random scatter
            const scatterX = (Math.random() - 0.5) * (t * 100);
            const scatterY = (Math.random() - 0.5) * (t * 100);
            
            const x = Math.cos(angle) * (r + pulse) + scatterX;
            const y = Math.sin(angle) * (r + pulse) + scatterY;
            
            // Core is brighter and bigger
            const size = Math.max(1, (1 - t) * 4 + (val / 255) * 3);
            
            // Simulate 3D tilt
            const tiltY = y * 0.5;
            
            ctx.globalAlpha = 1.0 - t; // Fade out at edges
            ctx.fillRect(x, tiltY, size, size);
        }
    }
    
    // Core glow
    ctx.globalAlpha = 0.5 + energy * 0.5;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 + energy*50);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, color || '#00ffcc');
    grad.addColorStop(1, '#00000000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 150, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}
