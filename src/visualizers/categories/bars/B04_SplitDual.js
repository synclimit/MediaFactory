/**
 * B04_SplitDual.js
 * Split Dual Bars
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'bars-split-dual',
    name: 'Split Dual',
    displayName: 'Split Dual Bars',
    description: 'Two separate bar groups on left and right. Bass on left, treble on right',
    category: 'Bars',
    subcategory: 'Split',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['split', 'frequency'],
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
    leftColor: '#ff0055',
    rightColor: '#00ffcc',
    barCount: 64, // Total, split into two 32-bar groups
    barWidth: 4,
    spacing: 2,
    groupSpacing: 40,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    leftColor: { type: 'color', default: '#ff0055', label: 'Bass Color' },
    rightColor: { type: 'color', default: '#00ffcc', label: 'Treble Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Total Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    groupSpacing: { type: 'range', min: 10, max: 200, default: 40, label: 'Center Gap' },
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
    const { barCount, barWidth, spacing, groupSpacing, gain, leftColor, rightColor, smoothing } = config;
    const cx = width / 2;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    
    // Smooth the incoming data
    MathUtils.smoothArray(spectrum, state.smoothedData, smoothing || 0.8);
    
    // Only take the portion of the spectrum requested
    const dataArray = state.smoothedData.subarray(0, barCount);
    
    const halfCount = Math.floor(dataArray.length / 2);
    const step = barWidth + spacing;
    const groupWidth = halfCount * step;

    // Left group (Bass)
    const startXLeft = cx - (groupSpacing / 2) - groupWidth;
    for (let i = 0; i < halfCount; i++) {
        const val = dataArray[i] / 255;
        const h = Math.max(2, val * height * gain);
        const x = startXLeft + i * step;
        const y = height - h;
        renderer.drawBar({ x, y, width: barWidth, height: h, color: leftColor });
    }

    // Right group (Treble)
    const startXRight = cx + (groupSpacing / 2);
    for (let i = 0; i < halfCount; i++) {
        // Higher frequencies on right, mapped starting from center
        const dataIdx = halfCount + i; 
        const val = dataArray[dataIdx] / 255;
        const h = Math.max(2, val * height * gain);
        const x = startXRight + i * step;
        const y = height - h;
        renderer.drawBar({ x, y, width: barWidth, height: h, color: rightColor });
    }
}

export function dispose(context) {}
