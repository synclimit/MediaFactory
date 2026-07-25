/**
 * R10_Torus3D.js
 * 3D Torus Ring
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-torus',
    name: 'Torus3D',
    displayName: '3D Torus Ring',
    description: 'A 3D donut/torus constructed from frequency rings',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","3d","torus"],
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
    const majorR = radius || 200;
    const minorR = 50;
    
    ctx.strokeStyle = (color || '#00ffcc') + 'aa';
    ctx.lineWidth = thickness || 1;
    
    const slices = 24;
    const angleStep = (Math.PI * 2) / slices;
    
    const time = elapsedTime || 0;
    
    for (let i = 0; i < slices; i++) {
        const t = i * angleStep + time;
        const dataIdx = Math.floor((i / slices) * barCount);
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 30 * (gain || 1.0);
        
        const xOffset = Math.cos(t) * majorR;
        const yOffset = Math.sin(t) * (majorR * 0.5); // Perspective tilt
        
        const currentMinorR = minorR + pulse;
        
        ctx.beginPath();
        // Draw vertical slice of the torus
        ctx.ellipse(cx + xOffset, cy + yOffset, currentMinorR, currentMinorR * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}
