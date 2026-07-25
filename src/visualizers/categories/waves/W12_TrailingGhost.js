/**
 * W12_TrailingGhost.js
 * Trailing Ghost Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-trailing-ghost',
    name: 'TrailingGhost',
    displayName: 'Trailing Ghost Wave',
    description: 'Fading persistence trailing wave',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","ghost","trailing"],
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
    
    if (!state.history) {
        state.history = [];
    }
    state.history.unshift(new Float32Array(state.smoothedData));
    if (state.history.length > 20) state.history.pop();
    
    const cy = viewport.height / 2;
    const step = viewport.width / (rawData.length - 1);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw from oldest to newest
    for (let row = state.history.length - 1; row >= 0; row--) {
        const rowData = state.history[row];
        const opacity = 1.0 - (row / 20);
        
        ctx.strokeStyle = (color || '#00ffcc') + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = (thickness || 2) * (1 + row * 0.1); // gets thicker as it fades
        
        ctx.beginPath();
        for (let i = 0; i < rowData.length; i++) {
            const val = rowData[i] || 128;
            const offset = ((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
            const x = i * step;
            const y = cy + offset;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}
