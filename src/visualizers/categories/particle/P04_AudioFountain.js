/**
 * P04_AudioFountain.js
 * Audio Fountain
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-fountain',
    name: 'AudioFountain',
    displayName: 'Audio Fountain',
    description: 'Particles shoot up from the bottom and fall with gravity',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","fountain","gravity"],
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
    
    if (!state.particles) state.particles = [];
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    
    // Spawn particles based on frequencies
    const activeBands = 32;
    const spacing = viewport.width / activeBands;
    
    for (let i=0; i<activeBands; i++) {
        const dataIdx = Math.floor((i / activeBands) * barCount);
        const val = rawData[dataIdx] || 0;
        
        if (val > 150 && Math.random() > 0.5) {
            const x = (i * spacing) + (spacing / 2);
            const force = (val / 255) * 500 * (gain || 1.0);
            
            state.particles.push({
                x: x,
                y: viewport.height,
                vx: (Math.random() - 0.5) * 50,
                vy: -force - (Math.random() * 100),
                color: (i % 2 === 0) ? (color || '#00ffcc') : '#ffffff'
            });
        }
    }
    
    const gravity = 800;
    
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        
        p.vy += gravity * (deltaTime || 0.016);
        p.x += p.vx * (deltaTime || 0.016);
        p.y += p.vy * (deltaTime || 0.016);
        
        if (p.y > viewport.height) {
            state.particles.splice(i, 1);
            continue;
        }
        
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    }
}
