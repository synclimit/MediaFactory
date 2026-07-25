/**
 * M08_PulsingRunes.js
 * Pulsing Runes
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'mandala-runes',
    name: 'PulsingRunes',
    displayName: 'Pulsing Runes',
    description: 'Concentric circles of abstract geometric rune segments',
    category: 'Mandala',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["mandala","runes","segments"],
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
    ctx.lineWidth = thickness || 3;
    ctx.lineCap = 'square';
    
    ctx.save();
    ctx.translate(cx, cy);
    
    const rings = 5;
    for (let r = 1; r <= rings; r++) {
        const currentR = (radius || 50) * r;
        const segments = r * 8;
        const angleStep = (Math.PI * 2) / segments;
        
        ctx.save();
        ctx.rotate((elapsedTime || 0) * (r % 2 === 0 ? 0.3 : -0.3) / r);
        
        for (let s = 0; s < segments; s++) {
            const dataIdx = (r * s) % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            
            // Only draw segment if frequency is strong enough
            if (val > 100) {
                const pulse = (val / 255) * 10 * (gain || 1.0);
                const startAngle = s * angleStep;
                const endAngle = startAngle + (angleStep * 0.7); // Leave gap
                
                ctx.beginPath();
                ctx.arc(0, 0, currentR + pulse, startAngle, endAngle);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    ctx.restore();
}
