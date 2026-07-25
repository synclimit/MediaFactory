/**
 * SP08_ParticleSwarm.js
 * Particle Swarm Spiral
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'spiral-swarm',
    name: 'ParticleSwarm',
    displayName: 'Particle Swarm Spiral',
    description: 'Thousands of tiny particles swirling in a spiral formation',
    category: 'Spiral',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["spiral","particle","swarm"],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
    package: 'core',
    license: 'MIT',
    visibility: 'public'
};

export const manifest = {
    requiredRenderer: 'Canvas2DRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'reflection', 'gradient'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    barCount: 64,
    thickness: 2,
    radius: 200,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    thickness: { type: 'range', min: 1, max: 20, default: 2, label: 'Thickness' },
    radius: { type: 'range', min: 50, max: 500, default: 200, label: 'Radius' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    smoothing: { type: 'range', min: 0, max: 0.99, default: 0.8, step: 0.01, label: 'Smoothing' }
};

export function initialize(context) {
    const { config, state } = context;
    state.smoothedData = null; 
}

export function update(context) {
}

export function render(context) {
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, barCount, thickness, radius, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.fillStyle = color || '#00ffcc';
    
    const particles = 1000;
    const time = elapsedTime || 0;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    for (let i = 0; i < particles; i++) {
        // Pseudo-random but deterministic position
        const seed = i * 137.5; 
        const t = (i / particles) * Math.PI * 2 * 10; // 10 coils
        const baseR = (i / particles) * (viewport.width / 2);
        
        const dataIdx = i % barCount;
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 40 * (gain || 1.0);
        
        // Add swirling motion
        const currentAngle = t + time * (1.0 - (i/particles)*0.8); // center spins faster
        
        const x = Math.cos(currentAngle) * (baseR + pulse);
        const y = Math.sin(currentAngle) * (baseR + pulse);
        
        ctx.fillRect(x, y, thickness || 2, thickness || 2);
    }
    ctx.restore();
}
