/**
 * SP04_DoubleHelixDNA.js
 * Double Helix DNA
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'spiral-dna',
    name: 'DoubleHelixDNA',
    displayName: 'Double Helix DNA',
    description: 'Two intertwined spirals resembling DNA',
    category: 'Spiral',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["spiral","dna","helix"],
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
    
    const coils = 3;
    const totalSegments = 200;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.8);
    
    const drawHelix = (phaseOffset, colorStr) => {
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = thickness || 3;
        ctx.beginPath();
        for (let i = 0; i <= totalSegments; i++) {
            const t = (i / totalSegments) * Math.PI * 2 * coils;
            const baseR = (i / totalSegments) * (viewport.height / 2);
            
            const dataIdx = i % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            const pulse = (val / 255) * 30 * (gain || 1.0);
            
            const x = Math.cos(t + phaseOffset) * (baseR + pulse);
            const y = Math.sin(t + phaseOffset) * (baseR + pulse);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };
    
    drawHelix(0, color || '#00ffcc');
    drawHelix(Math.PI, '#ff00aa');
    
    ctx.restore();
}
