/**
 * B13_StackedMultiBand.js
 * Stacked Multi-Band Bars
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'bars-stacked-multi',
    name: 'StackedMultiBand',
    displayName: 'Stacked Multi-Band Bars',
    description: 'Bars split into colored frequency bands (low, mid, high)',
    category: 'Bars',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["stacked","multi-band","bars"],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
    package: 'core',
    license: 'MIT',
    visibility: 'public'
};

export const manifest = {
    requiredRenderer: 'BarsRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'reflection', 'gradient'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    barCount: 64,
    barWidth: 4,
    spacing: 2,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' }
};

export function initialize(context) {
    const { config, state } = context;
    state.smoothedData = new Float32Array(config.barCount);
}

export function update(context) {
}

export function render(context) {
    const { audio, state, config, viewport } = context;
    const { color, barCount, barWidth, spacing, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const step = barWidth + spacing;
    const totalWidth = barCount * step;
    const startX = (viewport.width - totalWidth) / 2;
    
    for (let i = 0; i < barCount; i++) {
        const val = state.smoothedData[i] || 0;
        const h = (val / 255) * viewport.height * (gain || 1.0);
        const x = startX + (i * step);
        const y = viewport.height - h;
        
        // Low
        const h1 = h * 0.33;
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(x, viewport.height - h1, barWidth, h1);
        
        // Mid
        const h2 = h * 0.33;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x, viewport.height - h1 - h2, barWidth, h2);
        
        // High
        const h3 = h * 0.34;
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(x, y, barWidth, h3);
    }
}
