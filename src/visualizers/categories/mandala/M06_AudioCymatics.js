/**
 * M06_AudioCymatics.js
 * Audio Cymatics
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'mandala-cymatics',
    name: 'AudioCymatics',
    displayName: 'Audio Cymatics',
    description: 'Simulates cymatic sand patterns formed by resonance',
    category: 'Mandala',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["mandala","cymatics","resonance"],
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
    const baseR = radius || 200;
    
    ctx.fillStyle = color || '#00ffcc';
    
    const points = 1000;
    
    // Average energy to determine "frequency mode"
    let sum = 0;
    for (let i=0; i<10; i++) sum += state.smoothedData[i] || 0;
    const energy = sum / 10 / 255;
    
    const m = 3 + Math.floor(energy * 5); // resonance nodes
    const n = 2 + Math.floor(energy * 3);
    
    ctx.save();
    ctx.translate(cx, cy);
    
    for (let i = 0; i < points; i++) {
        // Chladni plate approximation
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        
        // Chladni equation
        const z = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
        
        // If near node line (z approx 0), draw particle
        if (Math.abs(z) < 0.1) {
            const px = x * baseR * (1 + energy * (gain || 1.0));
            const py = y * baseR * (1 + energy * (gain || 1.0));
            ctx.fillRect(px, py, thickness || 2, thickness || 2);
        }
    }
    
    ctx.restore();
}
