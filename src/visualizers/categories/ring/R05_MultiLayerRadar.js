/**
 * R05_MultiLayerRadar.js
 * Multi-layer Radar
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-radar',
    name: 'MultiLayerRadar',
    displayName: 'Multi-layer Radar',
    description: 'Radar-like sweeping rings',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","radar","sweep"],
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
    
    // Base grids
    ctx.strokeStyle = (color || '#00ffcc') + '44';
    ctx.lineWidth = 1;
    for(let r = 50; r <= 300; r+= 50) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Sweeper
    const angle = (elapsedTime || 0) * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    
    const grad = ctx.createConicGradient(0, 0, 0);
    grad.addColorStop(0, (color || '#00ffcc') + '88');
    grad.addColorStop(0.1, '#00000000');
    grad.addColorStop(1, '#00000000');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 300, 0, Math.PI * 2);
    ctx.fill();
    
    // Reactive Blips
    const bass = (state.smoothedData[2] || 0) / 255;
    if (bass > 0.6) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(150, 0, 5 + (bass * 10 * (gain||1)), 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}
