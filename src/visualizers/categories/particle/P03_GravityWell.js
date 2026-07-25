/**
 * P03_GravityWell.js
 * Gravity Well
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-gravity',
    name: 'GravityWell',
    displayName: 'Gravity Well',
    description: 'Particles sucked into the center, speed controlled by bass',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","gravity","vortex"],
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
        for(let i=0; i<300; i++) {
            state.particles.push({
                angle: Math.random() * Math.PI * 2,
                dist: Math.random() * viewport.width,
                speed: Math.random() * 50 + 10
            });
        }
    }
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    const bass = (rawData[2] || 0) / 255;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.fillStyle = color || '#00ffcc';
    
    const pullSpeed = 50 + (bass * 400 * (gain||1.0));
    
    for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        
        p.dist -= (p.speed + pullSpeed) * (deltaTime || 0.016);
        p.angle += 0.02; // spiral in
        
        if (p.dist < 10) {
            p.dist = Math.max(viewport.width, viewport.height);
            p.angle = Math.random() * Math.PI * 2;
        }
        
        const x = cx + Math.cos(p.angle) * p.dist;
        const y = cy + Math.sin(p.angle) * p.dist;
        
        // Stretch based on speed
        const stretch = 1 + (pullSpeed / 100);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.angle);
        ctx.fillRect(-stretch, -1, stretch*2, 2);
        ctx.restore();
    }
}
