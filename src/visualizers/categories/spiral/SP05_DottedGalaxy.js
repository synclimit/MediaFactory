/**
 * SP05_DottedGalaxy.js
 * Dotted Spiral Galaxy
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'spiral-galaxy',
    name: 'DottedGalaxy',
    displayName: 'Dotted Spiral Galaxy',
    description: 'A spiral made of glowing dots that pulse to the beat',
    category: 'Spiral',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["spiral","galaxy","dots"],
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
    
    ctx.fillStyle = color || '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.shadowColor = color || '#00ffcc';
    
    const arms = 4;
    const dotsPerArm = barCount;
    
    ctx.save();
    ctx.translate(cx, cy);
    const rotSpeed = context.rhythmSpeed ? Math.max(0.5, context.rhythmSpeed) : 1.0;
    ctx.rotate(-(elapsedTime || 0) * 0.25);
    
    for (let arm = 0; arm < arms; arm++) {
        const armPhase = (arm / arms) * Math.PI * 2;
        
        for (let i = 0; i < dotsPerArm; i++) {
            const val = state.smoothedData[i] || 0;
            const pulse = (val / 255) * (gain || 1.0);
            
            const t = (i / dotsPerArm) * Math.PI * 2 * 2; // 2 coils
            const baseR = (i / dotsPerArm) * (viewport.width / 2.5) * (1 + pulse * 0.15 * rotSpeed);
            
            const x = Math.cos(t + armPhase) * baseR;
            const y = Math.sin(t + armPhase) * baseR;
            
            const dotSize = (thickness || 3) + (pulse * 10) * Math.min(rotSpeed, 2.5);
            
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
    ctx.shadowBlur = 0;
}
