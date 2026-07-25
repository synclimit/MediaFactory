/**
 * B03_MirrorBars.js
 * Mirror Bars (Symmetrical)
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'bars-mirror',
    name: 'Mirror Bars',
    displayName: 'Mirror Bars',
    description: 'Left half mirrors right half. Spectrum duplicated and flipped horizontally',
    category: 'Bars',
    subcategory: 'Symmetric',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['symmetric', 'mirror'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-17',
    updatedAt: '2026-07-17',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: ['glow', 'reflection', 'gradient']
};

export const manifest = {
    requiredRenderer: 'BarsRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'reflection', 'gradient'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    barCount: 32, // Note: uses 32 bars per side, rendering 64 total
    barWidth: 4,
    spacing: 2,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    barCount: { type: 'range', min: 8, max: 128, default: 32, step: 8, label: 'Bands (Per Side)' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
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
    const { barCount, barWidth, spacing, gain, color, smoothing } = config;
    const cx = width / 2;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    
    // Smooth the incoming data
    MathUtils.smoothArray(spectrum, state.smoothedData, smoothing || 0.8);
    
    // Only take the portion of the spectrum requested
    const dataArray = state.smoothedData.subarray(0, barCount);

    const step = barWidth + spacing;

    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const h = Math.max(2, val * height * gain);
        
        // Right side (moves right from center)
        const xR = cx + (i * step);
        const yR = height - h;
        
        // Left side (mirrored, moves left from center)
        const xL = cx - ((i + 1) * step);
        const yL = height - h;

        renderer.drawBar({ x: xR, y: yR, width: barWidth, height: h, color });
        renderer.drawBar({ x: xL, y: yL, width: barWidth, height: h, color });
    }
}

export function dispose(context) {}
