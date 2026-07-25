/**
 * R04_GlowingCore.js
 * Glowing Core Ring
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ring-glowing-core',
    name: 'GlowingCore',
    displayName: 'Glowing Core Ring',
    description: 'A thick neon ring with a bright glowing center',
    category: 'Ring',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["ring","glow","core"],
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
    const { audio, state, config, viewport } = context;
    const { color, barCount, thickness, radius, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    // Get average low frequency for the core
    let lowSum = 0;
    for (let i=0; i<5; i++) lowSum += (state.smoothedData[i] || 0);
    const lowAvg = lowSum / 5;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const baseR = radius || 150;
    
    const coreSize = (lowAvg / 255) * baseR * (gain || 1.0);
    
    // Core glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(coreSize / baseR, color || '#00ffcc');
    grad.addColorStop(1, '#00000000');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer Ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = thickness || 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color || '#00ffcc';
    
    ctx.beginPath();
    ctx.arc(cx, cy, baseR + (thickness||2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}
