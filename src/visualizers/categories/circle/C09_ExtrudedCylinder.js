/**
 * C09_ExtrudedCylinder.js
 * 3D Extruded Cylinder
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'circle-3d-cylinder',
    name: 'ExtrudedCylinder',
    displayName: '3D Extruded Cylinder',
    description: 'A pseudo-3D cylinder ring',
    category: 'Circle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["circle","3d","cylinder"],
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
    color: '#ff00aa',
    barCount: 64,
    barWidth: 4,
    radius: 150,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#ff00aa', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
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
    const { audio, state, config, viewport } = context;
    const { color, barCount, barWidth, radius, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const r = radius || 150;
    const angleStep = (Math.PI * 2) / barCount;
    
    // Base ring
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = color || '#00ffcc';
    ctx.strokeStyle = color || '#00ffcc';
    
    for (let i = 0; i < barCount; i++) {
        const val = state.smoothedData[i] || 0;
        const h = (val / 255) * (viewport.height / 3) * (gain || 1.0);
        const angle = i * angleStep;
        
        const x1 = cx + Math.cos(angle) * r;
        const y1 = cy + Math.sin(angle) * r;
        
        // Extrude up slightly
        const extrudeX = x1;
        const extrudeY = y1 - h;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(extrudeX, extrudeY);
        ctx.stroke();
        
        // draw cap
        ctx.beginPath();
        ctx.arc(extrudeX, extrudeY, barWidth/2, 0, Math.PI * 2);
        ctx.fill();
    }
}
