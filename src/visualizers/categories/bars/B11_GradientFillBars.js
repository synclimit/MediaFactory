/**
 * B11_GradientFillBars.js
 * Gradient Fill Bars
 */

export const metadata = {
    id: 'bars-gradient-fill',
    name: 'Gradient Fill',
    displayName: 'Gradient Fill Bars',
    description: 'Each bar filled with a vertical gradient',
    category: 'Bars',
    subcategory: 'Modern',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['gradient', 'colorful'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-17',
    updatedAt: '2026-07-17',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: ['glow', 'reflection']
};

export const manifest = {
    requiredRenderer: 'BarsRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'reflection'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    colorStart: '#00ffff',
    colorEnd: '#ff00ff',
    barCount: 64,
    barWidth: 6,
    spacing: 2,
    gain: 1.0
};

export const schema = {
    colorStart: { type: 'color', default: '#00ffff', label: 'Bottom Color' },
    colorEnd: { type: 'color', default: '#ff00ff', label: 'Top Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 6, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { width, height } = viewport;
    const { barCount, barWidth, spacing, gain, colorStart, colorEnd } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const dataArray = spectrum.slice(0, barCount);
    const layout = renderer.computeLinearLayout(dataArray.length, barWidth, spacing, true);
    
    const ctx = renderer.getContext();
    
    // Create global vertical gradient
    const gradient = ctx.createLinearGradient(0, height, 0, height / 2);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const h = Math.max(2, val * height * gain);
        const x = layout.startX + i * layout.step;
        const y = height - h;

        renderer.drawBar({
            x, y, width: barWidth, height: h,
            color: gradient,
            rounded: false,
            outline: false
        });
    }
}

export function dispose(context) {}
