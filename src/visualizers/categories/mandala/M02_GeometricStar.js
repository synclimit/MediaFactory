/**
 * M02_GeometricStar.js
 * Geometric Star
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'mandala-star',
    name: 'GeometricStar',
    displayName: 'Geometric Star',
    description: 'Sharp, intersecting star geometries forming a mandala',
    category: 'Mandala',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["mandala","star","geometric"],
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
    const baseR = radius || 150;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 1;
    
    const points = 16;
    const angleStep = (Math.PI * 2) / points;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-(elapsedTime || 0) * 0.3);
    
    for (let layer = 1; layer <= 3; layer++) {
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const idx = i % points;
            const val = state.smoothedData[(idx * layer) % barCount] || 0;
            const pulse = (val / 255) * 50 * (gain || 1.0);
            
            const r = (baseR / layer) + pulse;
            // Alternate radius to create star points
            const currentR = (i % 2 === 0) ? r : r * 0.5;
            
            const x = Math.cos(i * angleStep) * currentR;
            const y = Math.sin(i * angleStep) * currentR;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
}
