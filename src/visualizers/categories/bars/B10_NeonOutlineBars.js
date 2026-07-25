/**
 * B10_NeonOutlineBars.js
 * Neon Outline Bars
 */

export const metadata = {
    id: 'bars-neon-outline',
    name: 'Neon Outline',
    displayName: 'Neon Outline Bars',
    description: 'Only the outline of bars is drawn, with neon glow effect',
    category: 'Bars',
    subcategory: 'Synthwave',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ['neon', 'synthwave', 'outline'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-17',
    updatedAt: '2026-07-17',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: ['glow'] // Usually we use native shadowBlur here for the core effect
};

export const manifest = {
    requiredRenderer: 'BarsRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['reflection'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#ff00ff',
    barCount: 64,
    barWidth: 6,
    spacing: 4,
    gain: 1.0,
    glowIntensity: 15
};

export const schema = {
    color: { type: 'color', default: '#ff00ff', label: 'Neon Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 6, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 4, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    glowIntensity: { type: 'range', min: 0, max: 50, default: 15, label: 'Glow Blur' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { width, height } = viewport;
    const { barCount, barWidth, spacing, gain, color, glowIntensity } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const dataArray = spectrum.slice(0, barCount);
    const layout = renderer.computeLinearLayout(dataArray.length, barWidth, spacing, true);
    
    const ctx = renderer.getContext();
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = color;
    ctx.lineWidth = 2;

    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const h = Math.max(2, val * height * gain);
        const x = layout.startX + i * layout.step;
        const y = height - h - 10;

        renderer.drawBar({
            x, y, width: barWidth, height: h,
            color,
            rounded: false,
            outline: true
        });
    }

    // Reset shadow
    ctx.shadowBlur = 0;
}

export function dispose(context) {}
