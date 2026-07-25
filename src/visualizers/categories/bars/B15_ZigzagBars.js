/**
 * B15_ZigzagBars.js
 * Zigzag Bars
 */

export const metadata = {
    id: 'bars-zigzag',
    name: 'Zigzag Bars',
    displayName: 'Zigzag Bars',
    description: 'Bars arranged in a zigzag/chevron pattern rather than straight line',
    category: 'Bars',
    subcategory: 'Dynamic',
    difficulty: 'Medium',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['zigzag', 'angular', 'aggressive'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-17',
    updatedAt: '2026-07-17',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: ['glow', 'gradient']
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
    zigzagAmplitude: 150
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    zigzagAmplitude: { type: 'range', min: 0, max: 500, default: 150, label: 'Zigzag Depth' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { height } = viewport;
    const { barCount, barWidth, spacing, gain, color, zigzagAmplitude } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const layout = renderer.computeLinearLayout(barCount, barWidth, spacing, true);
    
    // W shape chevron
    for (let i = 0; i < barCount; i++) {
        const val = spectrum[i] / 255;
        const h = Math.max(2, val * height * gain * 0.5); // reduced gain since it's centered
        const x = layout.startX + i * layout.step;
        
        // Triangle wave for baseline
        const period = barCount / 2; // Two 'V's forming a 'W'
        const phase = (i / period) % 1.0;
        const baselineOffset = (Math.abs(phase - 0.5) * 2 - 0.5) * zigzagAmplitude;

        const cy = (height / 2) + baselineOffset;
        
        const y = cy - h; // Grow upwards from the chevron baseline

        renderer.drawBar({
            x, y, width: barWidth, height: h,
            color,
            rounded: false,
            outline: false
        });
    }
}

export function dispose(context) {}
