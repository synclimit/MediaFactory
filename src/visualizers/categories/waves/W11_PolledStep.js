/**
 * W11_PolledStep.js
 * Polled Step Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-polled-step',
    name: 'PolledStep',
    displayName: 'Polled Step Wave',
    description: 'Blocky staircase/step wave',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","step","blocky"],
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
    
    const cy = viewport.height / 2;
    const stepSize = 10; // group pixels into blocks of 10
    const stepX = (viewport.width / rawData.length) * stepSize;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 2;
    ctx.beginPath();
    
    for (let i = 0; i < rawData.length; i += stepSize) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < stepSize && i+j < rawData.length; j++) {
            sum += state.smoothedData[i+j] || 128;
            count++;
        }
        const avgVal = sum / count;
        const offset = ((avgVal - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        
        const x = (i / stepSize) * stepX;
        const y = cy + offset;
        
        if (i === 0) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + stepX, y);
        } else {
            ctx.lineTo(x, y); // drop down to new Y
            ctx.lineTo(x + stepX, y); // horizontal across
        }
    }
    ctx.stroke();
}
