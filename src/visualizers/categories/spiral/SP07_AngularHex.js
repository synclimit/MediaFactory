/**
 * SP07_AngularHex.js
 * Angular Hex Spiral
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'spiral-hex',
    name: 'AngularHex',
    displayName: 'Angular Hex Spiral',
    description: 'A spiral built entirely out of sharp hexagonal angles',
    category: 'Spiral',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["spiral","hex","angular"],
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
    barCount: 64,
    thickness: 2,
    radius: 200,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
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
    ctx.lineWidth = thickness || 3;
    ctx.lineJoin = 'miter';
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.5);
    
    ctx.beginPath();
    const loops = 15;
    let currentR = 10;
    
    for (let i = 0; i < loops * 6; i++) { // 6 sides per hex
        const angle = i * (Math.PI / 3); // 60 degrees
        
        const dataIdx = i % barCount;
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 15 * (gain || 1.0);
        
        currentR += 5; // grow outward
        
        const x = Math.cos(angle) * (currentR + pulse);
        const y = Math.sin(angle) * (currentR + pulse);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}
