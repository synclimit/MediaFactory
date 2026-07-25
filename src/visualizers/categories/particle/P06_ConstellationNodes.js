/**
 * P06_ConstellationNodes.js
 * Constellation Nodes
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-constellation',
    name: 'ConstellationNodes',
    displayName: 'Constellation Nodes',
    description: 'Floating nodes that connect with lines based on audio proximity',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","nodes","network"],
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
        const count = 60;
        for(let i=0; i<count; i++) {
            state.particles.push({
                x: Math.random() * viewport.width,
                y: Math.random() * viewport.height,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50
            });
        }
    }
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    const energy = (rawData[10] || 0) / 255;
    
    const maxDist = 100 + (energy * 100 * (gain || 1.0));
    
    // Update
    for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        p.x += p.vx * (deltaTime || 0.016);
        p.y += p.vy * (deltaTime || 0.016);
        
        if (p.x < 0 || p.x > viewport.width) p.vx *= -1;
        if (p.y < 0 || p.y > viewport.height) p.vy *= -1;
    }
    
    // Draw connections
    ctx.lineWidth = 1;
    for (let i = 0; i < state.particles.length; i++) {
        const p1 = state.particles[i];
        for (let j = i + 1; j < state.particles.length; j++) {
            const p2 = state.particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < maxDist) {
                const alpha = 1.0 - (dist / maxDist);
                ctx.strokeStyle = (color || '#00ffcc') + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
    
    // Draw nodes
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < state.particles.length; i++) {
        ctx.fillRect(state.particles[i].x - 1.5, state.particles[i].y - 1.5, 3, 3);
    }
}
