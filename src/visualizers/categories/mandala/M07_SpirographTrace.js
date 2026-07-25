/**
 * M07_SpirographTrace.js
 * Spirograph Trace
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'mandala-spirograph',
    name: 'SpirographTrace',
    displayName: 'Spirograph Trace',
    description: 'Continuous line spirograph that morphs with the beat',
    category: 'Mandala',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["mandala","spirograph","line"],
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
    color: '#ffcc00',
    barCount: 64,
    thickness: 2,
    radius: 150,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#ffcc00', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    thickness: { type: 'range', min: 1, max: 20, default: 2, label: 'Thickness' },
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
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, barCount, thickness, radius, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 1;
    
    const R = radius || 150; 
    
    // Audio modulates the inner gear radius and pen offset
    const bass = (state.smoothedData[2] || 0) / 255;
    const mid = (state.smoothedData[10] || 0) / 255;
    
    const r = R * (0.3 + bass * 0.5 * (gain||1));
    const d = r * (0.5 + mid * 0.5 * (gain||1));
    
    ctx.save();
    ctx.translate(cx, cy);
    
    ctx.beginPath();
    const resolution = 200;
    const loops = 20;
    
    for (let i = 0; i <= resolution * loops; i++) {
        const theta = (i / resolution) * Math.PI * 2;
        
        // Hypotrochoid equations
        const x = (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta + (elapsedTime || 0));
        const y = (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta + (elapsedTime || 0));
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}
