/**
 * R02_OrbitingHalos.js
 * Orbiting Halos
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-orbiting-halos',
    name: 'OrbitingHalos',
    displayName: 'Orbiting Halos',
    description: 'Interlocking halos that orbit and pulse',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","orbit","halo"],
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
    
    ctx.lineWidth = thickness || 3;
    
    // Lows, Mids, Highs
    const bands = [
        { color: '#ff3366', speed: 1.0, dataIdx: 2 },
        { color: '#ffcc00', speed: 1.5, dataIdx: Math.floor(barCount/2) },
        { color: '#00ffcc', speed: 2.0, dataIdx: barCount - 2 }
    ];
    
    bands.forEach((band, i) => {
        const val = state.smoothedData[band.dataIdx] || 0;
        const pulse = (val / 255) * (radius || 100) * (gain || 1.0);
        const currentR = (radius || 100) + (i * 50) + pulse;
        
        const angle = (elapsedTime || 0) * band.speed;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        ctx.strokeStyle = band.color;
        ctx.beginPath();
        // Elliptical orbit effect
        ctx.ellipse(0, 0, currentR, currentR * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });
}
