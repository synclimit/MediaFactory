/**
 * P02_RisingFireflies.js
 * Rising Fireflies
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-fireflies',
    name: 'RisingFireflies',
    displayName: 'Rising Fireflies',
    description: 'Glowing particles that float upwards, reacting to volume',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","fireflies","float"],
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
    color: '#ffffff',
    barCount: 64,
    gain: 1.0
};

export const schema = {
    color: { type: 'color', default: '#ffffff', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Intensity Multiplier' }
};

export function initialize(context) {
    const { state } = context;
    state.particles = null; 
}

export function update(context) {
}

export function render(context) {
    const { audio, state, config, viewport, deltaTime, elapsedTime } = context;
    const { color, barCount, gain } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    if (!state.particles) {
        state.particles = [];
        for(let i=0; i<150; i++) {
            state.particles.push({
                x: Math.random() * viewport.width,
                y: Math.random() * viewport.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 30 + 10,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    let sum = 0;
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    for(let i=0; i<rawData.length; i++) sum += rawData[i];
    const energy = (sum / rawData.length) / 255;
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = color || '#00ffcc';
    ctx.fillStyle = color || '#00ffcc';
    
    for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        
        // Float up
        p.y -= (p.speed + energy * 100 * (gain||1.0)) * (deltaTime || 0.016);
        // Sway sideways
        p.x += Math.sin((elapsedTime || 0) * 2 + p.phase) * 0.5;
        
        if (p.y < -10) {
            p.y = viewport.height + 10;
            p.x = Math.random() * viewport.width;
        }
        
        const currentSize = p.size * (1 + energy);
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}
