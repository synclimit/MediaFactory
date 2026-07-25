/**
 * W08_OverlappingMulti.js
 * Overlapping Multi-Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-overlapping-multi',
    name: 'OverlappingMulti',
    displayName: 'Overlapping Multi-Wave',
    description: 'Multiple waves trailing each other with different colors',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","multi","overlap"],
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
    if (!state.history) {
        state.history = [];
    }
    state.history.unshift(new Uint8Array(rawData));
    if (state.history.length > 3) state.history.pop(); // Keep 3 frames
    
    const cy = viewport.height / 2;
    const step = viewport.width / (rawData.length - 1);
    
    const colors = [color || '#00ffcc', '#ff00aa', '#0044ff'];
    
    ctx.lineWidth = thickness || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let h = state.history.length - 1; h >= 0; h--) {
        const layerData = state.history[h];
        ctx.strokeStyle = colors[h % colors.length];
        
        ctx.beginPath();
        for (let i = 0; i < layerData.length; i++) {
            const val = layerData[i] || 128;
            const offset = ((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
            const x = i * step;
            const y = cy + offset;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}
