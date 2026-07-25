/**
 * R03_DashedAudio.js
 * Dashed Audio Ring
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-dashed',
    name: 'DashedAudio',
    displayName: 'Dashed Audio Ring',
    description: 'A single ring made of dashed line segments that react to audio',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","dashed","segment"],
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
    const baseR = radius || 200;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 4;
    ctx.lineCap = 'round';
    
    const segments = 32;
    const angleStep = (Math.PI * 2) / segments;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.5); // slow spin
    
    for (let i = 0; i < segments; i++) {
        const dataIdx = Math.floor((i / segments) * barCount);
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 50 * (gain || 1.0);
        
        const currentR = baseR + pulse;
        const startAngle = i * angleStep;
        const endAngle = startAngle + (angleStep * 0.6); // 60% solid, 40% gap
        
        ctx.beginPath();
        ctx.arc(0, 0, currentR, startAngle, endAngle);
        ctx.stroke();
    }
    ctx.restore();
}
