/**
 * B16_ReflectedFloorBars.js
 * Reflected Floor Bars
 */

export const metadata = {
    id: 'bars-reflected-floor',
    name: 'Reflected Floor',
    displayName: 'Reflected Floor Bars',
    description: 'Standard bars with a faded reflection below, like standing on a glossy floor',
    category: 'Bars',
    subcategory: 'Premium',
    difficulty: 'Medium',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['reflection', 'glossy', 'premium'],
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
    color: '#ffffff',
    barCount: 64,
    barWidth: 4,
    spacing: 2,
    gain: 1.0,
    reflectionOpacity: 0.4
};

export const schema = {
    color: { type: 'color', default: '#ffffff', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 4, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    reflectionOpacity: { type: 'range', min: 0.0, max: 1.0, default: 0.4, step: 0.05, label: 'Reflection Strength' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { height } = viewport;
    const { barCount, barWidth, spacing, gain, color, reflectionOpacity } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const layout = renderer.computeLinearLayout(barCount, barWidth, spacing, true);
    const ctx = renderer.getContext();
    
    const floorY = height * 0.7; // Floor is at 70% height

    for (let i = 0; i < barCount; i++) {
        const val = spectrum[i] / 255;
        const h = Math.max(2, val * (height * 0.5) * gain);
        const x = layout.startX + i * layout.step;
        
        // Main bar
        renderer.drawBar({
            x, y: floorY - h, width: barWidth, height: h,
            color,
            rounded: false,
            outline: false
        });

        // Reflection bar
        ctx.save();
        // Create a linear gradient for the reflection to fade out
        const grad = ctx.createLinearGradient(0, floorY, 0, floorY + h);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.globalAlpha = reflectionOpacity;
        renderer.drawBar({
            x, y: floorY, width: barWidth, height: h,
            color: grad,
            rounded: false,
            outline: false
        });
        ctx.restore();
    }
}

export function dispose(context) {}
