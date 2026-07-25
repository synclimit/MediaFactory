/**
 * C01_RadialBars.js
 * Basic Radial Bars
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'circle-radial-bars',
    name: 'Radial Bars',
    displayName: 'Radial Bars',
    description: 'Bars forming a circle facing outward',
    category: 'Circle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['circle', 'radial', 'bars'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: ['glow']
};

export const manifest = {
    requiredRenderer: 'BarsRenderer', // Reusing Canvas2D base
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    barCount: 64,
    barWidth: 4,
    radius: 100,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    radius: { type: 'range', min: 20, max: 500, default: 100, label: 'Inner Radius' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' }
};

export function initialize(context) {
    const { config, state } = context;
    state.smoothedData = new Float32Array(config.barCount);
}

export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport, state } = context;
    const { width, height } = viewport;
    const { color, barCount, barWidth, radius, gain, smoothing } = config;
    const cx = width / 2;
    const cy = height / 2;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    MathUtils.smoothArray(spectrum, state.smoothedData, smoothing || 0.8);
    
    const dataArray = state.smoothedData.subarray(0, barCount);
    
    const ctx = renderer.getContext();
    if (!ctx) return;

    ctx.fillStyle = color;
    
    const angleStep = (Math.PI * 2) / dataArray.length;

    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const h = Math.max(2, val * (height / 2) * gain);
        
        const angle = i * angleStep;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Draw outward
        renderer.drawBar({
            x: -barWidth / 2, 
            y: radius, 
            width: barWidth, 
            height: h,
            color,
            rounded: false
        });
        
        ctx.restore();
    }
}
