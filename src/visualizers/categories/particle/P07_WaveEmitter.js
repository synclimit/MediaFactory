/**
 * P07_WaveEmitter.js
 * Wave Emitter
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-emitter',
    name: 'WaveEmitter',
    displayName: 'Wave Emitter',
    description: 'Particles emitted from the waveform line',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","wave","emitter"],
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
    
    const wave = audio.getWaveform() || new Uint8Array(256);
    
    const cy = viewport.height / 2;
    const step = viewport.width / (wave.length - 1);
    
    // Emit
    if (Math.random() > 0.2) {
        for(let i=0; i<3; i++) {
            const idx = Math.floor(Math.random() * wave.length);
            const val = wave[idx] || 128;
            const offset = ((val - 128) / 128) * (viewport.height / 3) * (gain || 1.0);
            
            state.particles.push({
                x: idx * step,
                y: cy + offset,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 100,
                life: 1.0
            });
        }
    }
    
    // Update and draw
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= (deltaTime || 0.016);
        
        if (p.life <= 0) {
            state.particles.splice(i, 1);
            continue;
        }
        
        p.x += p.vx * (deltaTime || 0.016);
        p.y += p.vy * (deltaTime || 0.016);
        p.vy += 50 * (deltaTime || 0.016); // slight gravity
        
        ctx.fillStyle = (color || '#00ffcc') + Math.floor(p.life * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
