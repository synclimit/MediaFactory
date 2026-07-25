/**
 * W10_Ribbon3D.js
 * Ribbon 3D Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-ribbon-3d',
    name: 'Ribbon3D',
    displayName: 'Ribbon 3D Wave',
    description: 'A wavy ribbon folding over itself with a 3D effect',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","ribbon","3d"],
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
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, thickness, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getWaveform() || new Uint8Array(256);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.6);
    
    const cy = viewport.height / 2;
    const step = viewport.width / (rawData.length - 1);
    
    // Base wave
    ctx.beginPath();
    for (let i = 0; i < rawData.length; i++) {
        const val = state.smoothedData[i] || 128;
        const offset = ((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        const x = i * step;
        const y = cy + offset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 2;
    ctx.stroke();
    
    // Ribbon overlap (offset by sine wave based on time)
    ctx.beginPath();
    for (let i = 0; i < rawData.length; i++) {
        const val = state.smoothedData[i] || 128;
        const offset = ((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        const ribbonFold = Math.sin((elapsedTime || 0) * 2 + i * 0.1) * 15;
        const x = i * step;
        const y = cy + offset + ribbonFold;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#ffffff88'; // semi transparent white highlight
    ctx.lineWidth = (thickness || 2) * 0.8;
    ctx.stroke();
}
