/**
 * C05_GlitchSegment.js
 * Glitch Segment Circle
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'circle-glitch-segment',
    name: 'GlitchSegment',
    displayName: 'Glitch Segment Circle',
    description: 'Broken/glitchy segments forming an erratic circle',
    category: 'Circle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["circle","glitch","segment"],
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
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.4); // less smooth for glitch
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const r = radius || 150;
    const angleStep = (Math.PI * 2) / barCount;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = barWidth;
    
    for (let i = 0; i < barCount; i++) {
        const val = state.smoothedData[i] || 0;
        const h = (val / 255) * (viewport.height / 3) * (gain || 1.0);
        const angle = i * angleStep;
        
        const inner = r + (Math.random() > 0.8 ? (Math.random()-0.5)*20 : 0);
        const outer = inner + h;
        
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        
        if (Math.random() > 0.95) {
            ctx.strokeStyle = Math.random() > 0.5 ? '#ff0055' : '#00ffff';
            ctx.lineTo(cx + Math.cos(angle+0.1) * outer, cy + Math.sin(angle+0.1) * outer);
        } else {
            ctx.strokeStyle = color || '#00ffcc';
            ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        }
        ctx.stroke();
    }
}
