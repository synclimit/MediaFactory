/**
 * SP06_HypnoticTunnel.js
 * Hypnotic Tunnel Spiral
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'spiral-tunnel',
    name: 'HypnoticTunnel',
    displayName: 'Hypnotic Tunnel Spiral',
    description: 'Creates a 3D tunnel illusion using spinning spirals',
    category: 'Spiral',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["spiral","tunnel","3d"],
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
    
    const time = elapsedTime || 0;
    
    const drawSpiral = (offset, colorStr, width) => {
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = width;
        ctx.beginPath();
        const coils = 8;
        const points = 300;
        for (let i = 0; i <= points; i++) {
            const t = (i / points) * Math.PI * 2 * coils;
            const r = Math.pow((i / points), 2) * viewport.width; // exponential for perspective
            
            const dataIdx = i % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            const pulse = (val / 255) * 20 * (gain || 1.0);
            
            const x = cx + Math.cos(t + offset) * (r + pulse);
            const y = cy + Math.sin(t + offset) * (r + pulse);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };
    
    drawSpiral(time * 2, color || '#00ffcc', thickness || 4);
    drawSpiral(time * 2 + Math.PI, '#0055ff', (thickness || 4) / 2);
}
