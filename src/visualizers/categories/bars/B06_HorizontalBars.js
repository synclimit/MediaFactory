/**
 * B06_HorizontalBars.js
 * Horizontal Bars
 */

export const metadata = {
    id: 'bars-horizontal',
    name: 'Horizontal Bars',
    displayName: 'Horizontal Bars',
    description: 'Bars extending horizontally from left edge',
    category: 'Bars',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['horizontal', 'side'],
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
    supportedEffects: ['glow', 'gradient'],
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
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Width Multiplier' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { width, height } = viewport;
    const { barCount, barWidth, spacing, gain, color } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const dataArray = spectrum.slice(0, barCount);

    const step = barWidth + spacing;
    const totalHeight = dataArray.length * step;
    const startY = (height / 2) - (totalHeight / 2);
    
    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const w = Math.max(2, val * width * gain);
        const y = startY + i * step;
        const x = 0; // Start from left edge

        renderer.drawBar({
            x, y, width: w, height: barWidth,
            color,
            rounded: false,
            outline: false
        });
    }
}

export function dispose(context) {}
