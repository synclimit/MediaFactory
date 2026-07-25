/**
 * R08_GlitchedWireframe.js
 * Glitched Wireframe Ring
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-glitch-wire',
    name: 'GlitchedWireframe',
    displayName: 'Glitched Wireframe Ring',
    description: 'A digital wireframe ring that glitches and distorts',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","glitch","wireframe"],
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
    const { audio, state, config, viewport } = context;
    const { color, barCount, thickness, radius, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.3); // Low smoothing
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const r = radius || 200;
    const segments = 32;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 2;
    
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const dataIdx = Math.floor((i / segments) * barCount) % barCount;
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 100 * (gain || 1.0);
        
        const t = (i / segments) * Math.PI * 2;
        
        // Glitch offset
        let glitchX = 0; let glitchY = 0;
        if (Math.random() > 0.9) {
            glitchX = (Math.random() - 0.5) * 50;
            glitchY = (Math.random() - 0.5) * 50;
            ctx.strokeStyle = Math.random() > 0.5 ? '#ff00aa' : (color || '#00ffcc');
        } else {
            ctx.strokeStyle = color || '#00ffcc';
        }
        
        const x = cx + Math.cos(t) * (r + pulse) + glitchX;
        const y = cy + Math.sin(t) * (r + pulse) + glitchY;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}
