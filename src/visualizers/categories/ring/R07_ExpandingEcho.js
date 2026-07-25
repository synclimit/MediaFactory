/**
 * R07_ExpandingEcho.js
 * Expanding Echo Rings
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-expanding-echo',
    name: 'ExpandingEcho',
    displayName: 'Expanding Echo Rings',
    description: 'Rings that spawn on beats and expand outward',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","echo","expand"],
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
    color: '#00ccff',
    barCount: 64,
    thickness: 2,
    radius: 200,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ccff', label: 'Color' },
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
    const { audio, state, config, viewport, elapsedTime, deltaTime } = context;
    const { color, barCount, thickness, gain } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    const bass = (rawData[2] || 0) / 255;
    
    if (!state.rings) state.rings = [];
    if (!state.lastBeat) state.lastBeat = 0;
    
    // Spawn ring on bass peak
    if (bass > 0.7 && (elapsedTime - state.lastBeat) > 0.3) {
        state.rings.push({ r: 10, alpha: 1.0, speed: 100 + (bass * 200 * (gain||1)) });
        state.lastBeat = elapsedTime;
    }
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    // Update and draw rings
    for (let i = state.rings.length - 1; i >= 0; i--) {
        const ring = state.rings[i];
        ring.r += ring.speed * (deltaTime || 0.016);
        ring.alpha -= 1.0 * (deltaTime || 0.016);
        
        if (ring.alpha <= 0) {
            state.rings.splice(i, 1);
            continue;
        }
        
        ctx.strokeStyle = (color || '#00ffcc') + Math.floor(ring.alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = thickness || 2;
        
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.stroke();
    }
}
