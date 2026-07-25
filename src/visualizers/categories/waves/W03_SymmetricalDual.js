/**
 * W03_SymmetricalDual.js
 * Symmetrical Dual Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-symmetrical-dual',
    name: 'SymmetricalDual',
    displayName: 'Symmetrical Dual Wave',
    description: 'Mirrored waves radiating from the center line',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","symmetrical","dual"],
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
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.5);
    
    ctx.fillStyle = color || '#00ffcc';
    
    const cy = viewport.height / 2;
    const step = viewport.width / (rawData.length - 1);
    
    // Top half
    ctx.beginPath();
    ctx.moveTo(0, cy);
    for (let i = 0; i < rawData.length; i++) {
        const val = state.smoothedData[i] || 128;
        const offset = Math.abs((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        const x = i * step;
        ctx.lineTo(x, cy - offset);
    }
    
    // Bottom half (traverse backward to close path)
    for (let i = rawData.length - 1; i >= 0; i--) {
        const val = state.smoothedData[i] || 128;
        const offset = Math.abs((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        const x = i * step;
        ctx.lineTo(x, cy + offset);
    }
    
    ctx.closePath();
    ctx.fill();
}
