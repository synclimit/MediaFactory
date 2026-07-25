/**
 * SP02_LogarithmicSwirl.js
 * Logarithmic Swirl
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'spiral-logarithmic',
    name: 'LogarithmicSwirl',
    displayName: 'Logarithmic Swirl',
    description: 'An exponential expanding swirl that gets thicker outwards',
    category: 'Spiral',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["spiral","logarithmic","swirl"],
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
    
    const coils = 4;
    const segmentsPerCoil = barCount;
    const totalSegments = coils * segmentsPerCoil;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 1.0);
    
    // Draw segmented so we can vary thickness
    for (let i = 0; i < totalSegments; i++) {
        const t1 = (i / totalSegments) * Math.PI * 2 * coils;
        const t2 = ((i+1) / totalSegments) * Math.PI * 2 * coils;
        
        // Logarithmic r = a * e^(b * theta)
        const a = 5;
        const b = 0.15;
        const baseR1 = a * Math.exp(b * t1);
        const baseR2 = a * Math.exp(b * t2);
        
        const dataIdx = i % barCount;
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * (baseR1 * 0.2) * (gain || 1.0); // pulse scales with radius
        
        const x1 = Math.cos(t1) * (baseR1 + pulse);
        const y1 = Math.sin(t1) * (baseR1 + pulse);
        const x2 = Math.cos(t2) * (baseR2 + pulse);
        const y2 = Math.sin(t2) * (baseR2 + pulse);
        
        ctx.strokeStyle = color || '#00ffcc';
        ctx.lineWidth = (thickness || 2) + (i / totalSegments) * 10; // gets thicker
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    ctx.restore();
}
