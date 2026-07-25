/**
 * P01_ExplosionBurst.js
 * Explosion Burst
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-burst',
    name: 'ExplosionBurst',
    displayName: 'Explosion Burst',
    description: 'Particles explode outwards on strong beats',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","explosion","burst"],
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
    const bass = (rawData[2] || 0) / 255;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    // Spawn on beat
    if (bass > 0.8 && Math.random() > 0.5) {
        const count = Math.floor(bass * 100);
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 200 + 50) * (gain || 1.0);
            state.particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: Math.random() > 0.5 ? (color || '#00ffcc') : '#ffffff'
            });
        }
    }
    
    ctx.lineCap = 'round';
    
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= (deltaTime || 0.016) * 1.5;
        
        if (p.life <= 0) {
            state.particles.splice(i, 1);
            continue;
        }
        
        const oldX = p.x;
        const oldY = p.y;
        p.x += p.vx * (deltaTime || 0.016);
        p.y += p.vy * (deltaTime || 0.016);
        
        ctx.strokeStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 2 + (p.life * 2);
        
        ctx.beginPath();
        ctx.moveTo(oldX, oldY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
}
