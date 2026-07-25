/**
 * C04_DotMatrix.js
 * Dot Matrix Circle
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'circle-dot-matrix',
    name: 'DotMatrix',
    displayName: 'Dot Matrix Circle',
    description: 'Circular bars rendered as discrete dots radiating outwards',
    category: 'Circle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["circle","dots","matrix"],
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
    color: '#ff00aa',
    barCount: 64,
    barWidth: 4,
    radius: 150,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#ff00aa', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    radius: { type: 'range', min: 50, max: 500, default: 150, label: 'Radius' },
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
    const { color, barCount, barWidth, radius, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const r = radius || 100;
    const dotSpacing = barWidth + 4;
    const angleStep = (Math.PI * 2) / barCount;
    
    ctx.fillStyle = color || '#00ffcc';
    
    for (let i = 0; i < barCount; i++) {
        const val = state.smoothedData[i] || 0;
        const h = (val / 255) * (viewport.height / 3) * (gain || 1.0);
        const angle = i * angleStep;
        
        const numDots = Math.floor(h / dotSpacing);
        for (let j = 0; j < numDots; j++) {
            const dist = r + (j * dotSpacing);
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;
            
            ctx.beginPath();
            ctx.arc(x, y, barWidth/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
