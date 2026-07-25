/**
 * M04_FractalBranches.js
 * Fractal Branches
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'mandala-fractal',
    name: 'FractalBranches',
    displayName: 'Fractal Branches',
    description: 'Branching tree-like fractal mandala',
    category: 'Mandala',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["mandala","fractal","branches"],
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
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineCap = 'round';
    
    const branches = 8;
    const angleStep = (Math.PI * 2) / branches;
    
    // Recursive draw function
    const drawBranch = (x, y, len, angle, depth, dataIdx) => {
        if (depth === 0) return;
        
        const val = state.smoothedData[dataIdx % barCount] || 0;
        const pulseLen = len + ((val / 255) * 20 * (gain || 1.0));
        
        const endX = x + Math.cos(angle) * pulseLen;
        const endY = y + Math.sin(angle) * pulseLen;
        
        ctx.lineWidth = depth * (thickness || 1);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        const spread = 0.5 + Math.sin(elapsedTime || 0) * 0.2;
        drawBranch(endX, endY, len * 0.7, angle - spread, depth - 1, dataIdx + 1);
        drawBranch(endX, endY, len * 0.7, angle + spread, depth - 1, dataIdx + 2);
    };
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.2);
    
    for (let i = 0; i < branches; i++) {
        drawBranch(0, 0, (radius || 100) * 0.5, i * angleStep, 4, i);
    }
    ctx.restore();
}
