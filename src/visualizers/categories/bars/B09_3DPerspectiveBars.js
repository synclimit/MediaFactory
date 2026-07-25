/**
 * B09_3DPerspectiveBars.js
 * 3D Perspective Bars
 */

export const metadata = {
    id: 'bars-3d-perspective',
    name: '3D Perspective',
    displayName: '3D Perspective Bars',
    description: 'Bars rendered with fake 3D perspective — appears to recede into distance',
    category: 'Bars',
    subcategory: '3D',
    difficulty: 'Medium',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ['3d', 'perspective', 'depth'],
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
    color: '#ffcc00',
    barCount: 32,
    baseWidth: 10,
    spacing: 5,
    gain: 1.0,
    perspectiveFactor: 0.05
};

export const schema = {
    color: { type: 'color', default: '#ffcc00', label: 'Color' },
    barCount: { type: 'range', min: 8, max: 64, default: 32, step: 8, label: 'Bands' },
    baseWidth: { type: 'range', min: 2, max: 30, default: 10, label: 'Front Width' },
    spacing: { type: 'range', min: 0, max: 20, default: 5, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    perspectiveFactor: { type: 'range', min: 0.01, max: 0.2, default: 0.05, step: 0.01, label: 'Depth Curve' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { width, height } = viewport;
    const { barCount, baseWidth, spacing, gain, color, perspectiveFactor } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const dataArray = spectrum.slice(0, barCount);
    const cx = width / 2;

    const ctx = renderer.getContext();
    
    // Draw back-to-front for proper overlapping
    for (let i = dataArray.length - 1; i >= 0; i--) {
        const val = dataArray[i] / 255;
        
        // Z-index from 0 (front) to N (back)
        const z = i;
        const scale = 1 / (1 + z * perspectiveFactor);
        
        const w = baseWidth * scale;
        const h = Math.max(2, val * height * gain * scale);
        
        // Isometric offset
        const xOffset = z * (baseWidth + spacing) * 0.7;
        const yOffset = z * (baseWidth + spacing) * -0.3;
        
        const x = cx - (w / 2) + xOffset - (dataArray.length * (baseWidth + spacing) * 0.35);
        const y = height - h + yOffset - 50; // shift up a bit
        
        // Darken based on depth
        ctx.globalAlpha = Math.max(0.2, scale);

        renderer.drawBar({
            x, y, width: w, height: h,
            color,
            rounded: false,
            outline: false
        });
        
        ctx.globalAlpha = 1.0;
    }
}

export function dispose(context) {}
