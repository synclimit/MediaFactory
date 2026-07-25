/**
 * W06_BrokenGlitch.js
 * Broken Glitch Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-broken-glitch',
    name: 'BrokenGlitch',
    displayName: 'Broken Glitch Wave',
    description: 'Waveform that periodically jumps and fragments',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","glitch","broken"],
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
    color: '#00ffcc',
    thickness: 2,
    gain: 1.0,
    smoothing: 0.5
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    thickness: { type: 'range', min: 1, max: 20, default: 2, label: 'Thickness' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    smoothing: { type: 'range', min: 0, max: 0.99, default: 0.5, step: 0.01, label: 'Smoothing' }
};

export function initialize(context) {
    const { config, state } = context;
    state.smoothedData = null; // initialized in render when length is known
}

export function update(context) {
}

export function render(context) {
    const { audio, state, config, viewport } = context;
    const { color, thickness, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getWaveform() || new Uint8Array(256);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.2); // Low smoothing for glitch
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 2;
    
    const cy = viewport.height / 2;
    const step = viewport.width / (rawData.length - 1);
    
    for (let i = 0; i < rawData.length - 1; i++) {
        const val = state.smoothedData[i] || 128;
        const offset = ((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        let x = i * step;
        let y = cy + offset;
        
        if (Math.random() > 0.98) {
            y += (Math.random() - 0.5) * 50;
            x += (Math.random() - 0.5) * 20;
            ctx.strokeStyle = Math.random() > 0.5 ? '#ff0055' : '#00ffff';
        } else {
            ctx.strokeStyle = color || '#00ffcc';
        }
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        const nextVal = state.smoothedData[i+1] || 128;
        const nextOffset = ((nextVal - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        ctx.lineTo((i+1) * step, cy + nextOffset);
        ctx.stroke();
    }
}
