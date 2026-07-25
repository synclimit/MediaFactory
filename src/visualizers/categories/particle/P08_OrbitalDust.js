/**
 * P08_OrbitalDust.js
 * Orbital Dust
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-orbital',
    name: 'OrbitalDust',
    displayName: 'Orbital Dust',
    description: 'Dust particles orbiting a central point, reacting to audio',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","orbit","dust"],
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
        for(let i=0; i<400; i++) {
            state.particles.push({
                angle: Math.random() * Math.PI * 2,
                dist: Math.random() * 300 + 50,
                baseSpeed: (Math.random() * 2 + 0.5) * (Math.random() > 0.5 ? 1 : -1)
            });
        }
    }
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    const energy = (rawData[5] || 0) / 255; // low-mid energy
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.fillStyle = color || '#00ffcc';
    
    const boost = energy * 5 * (gain || 1.0);
    
    for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        
        // speed up based on energy
        const currentSpeed = p.baseSpeed * (1 + boost);
        p.angle += currentSpeed * (deltaTime || 0.016);
        
        // orbit radius expands slightly with energy
        const currentDist = p.dist * (1 + (energy * 0.2));
        
        const x = cx + Math.cos(p.angle) * currentDist;
        const y = cy + Math.sin(p.angle) * currentDist;
        
        ctx.fillRect(x, y, 2, 2);
    }
}
