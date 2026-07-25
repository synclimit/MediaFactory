/**
 * P05_DataStream.js
 * Data Stream
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-stream',
    name: 'DataStream',
    displayName: 'Data Stream',
    description: 'Horizontal stream of binary/data particles',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","data","stream"],
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
    const { audio, state, config, viewport, deltaTime } = context;
    const { color, barCount, gain } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    if (!state.particles) {
        state.particles = [];
        for(let i=0; i<100; i++) {
            state.particles.push({
                x: Math.random() * viewport.width,
                y: Math.random() * viewport.height,
                speed: Math.random() * 200 + 100,
                char: Math.random() > 0.5 ? '0' : '1'
            });
        }
    }
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let sum = 0;
    for(let i=0; i<rawData.length; i++) sum += rawData[i];
    const energy = (sum / rawData.length) / 255;
    
    ctx.fillStyle = color || '#00ffcc';
    ctx.font = '12px monospace';
    
    const boost = energy * 500 * (gain || 1.0);
    
    for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        
        p.x += (p.speed + boost) * (deltaTime || 0.016);
        
        if (p.x > viewport.width + 10) {
            p.x = -10;
            p.y = Math.random() * viewport.height;
            p.char = Math.random() > 0.5 ? '0' : '1';
        }
        
        if (energy > 0.5 && Math.random() > 0.9) {
            p.char = Math.random() > 0.5 ? '0' : '1'; // glitch char
        }
        
        ctx.fillText(p.char, p.x, p.y);
    }
}
