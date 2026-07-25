/**
 * M03_KaleidoscopeHex.js
 * Kaleidoscope Hex
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'mandala-kaleidoscope',
    name: 'KaleidoscopeHex',
    displayName: 'Kaleidoscope Hex',
    description: 'Hexagonal kaleidoscope patterns reflecting inward',
    category: 'Mandala',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["mandala","kaleidoscope","hex"],
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
    const maxR = radius || 200;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 2;
    
    const sides = 6;
    const angleStep = (Math.PI * 2) / sides;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((elapsedTime || 0) * 0.5);
    
    const layers = 6;
    for (let l = 1; l <= layers; l++) {
        const layerR = (maxR / layers) * l;
        const offsetAngle = (elapsedTime || 0) * (l % 2 === 0 ? 0.2 : -0.2);
        
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const dataIdx = (i * l) % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            const pulse = (val / 255) * 30 * (gain || 1.0);
            
            const currentR = layerR + pulse;
            const angle = (i * angleStep) + offsetAngle;
            
            const x = Math.cos(angle) * currentR;
            const y = Math.sin(angle) * currentR;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw connecting spokes
        for (let i = 0; i < sides; i++) {
            const angle = (i * angleStep) + offsetAngle;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * layerR, Math.sin(angle) * layerR);
            ctx.stroke();
        }
    }
    ctx.restore();
}
