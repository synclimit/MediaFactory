/**
 * B02_StaggeredCenter.js
 * Staggered Center Bars
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'bars-staggered-center',
    name: 'Staggered Center',
    displayName: 'Staggered Center Bars',
    description: 'Bars extend from vertical center, growing both up and down symmetrically',
    category: 'Bars',
    subcategory: 'Symmetric',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['symmetric', 'centered', 'trap'],
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
    barCount: 64,
    barWidth: 6,
    spacing: 3,
    gain: 1.0,
    smoothing: 0.8
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 6, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 3, label: 'Spacing' },
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
    const cy = height / 2;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    
    // Smooth the incoming data
    MathUtils.smoothArray(spectrum, state.smoothedData, smoothing || 0.8);
    
    // Only take the portion of the spectrum requested
    const dataArray = state.smoothedData.subarray(0, barCount);

    const layout = renderer.computeLinearLayout(dataArray.length, barWidth, spacing, true);
    
    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const h = Math.max(2, val * height * gain);
        const x = layout.startX + i * layout.step;
        const y = cy - h / 2;

        renderer.drawBar({
            x, y, width: barWidth, height: h,
            color,
            rounded: false,
            outline: false
        });
    }
}

export function dispose(context) {}
