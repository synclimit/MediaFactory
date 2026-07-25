/**
 * B12_FrequencyTerrainBars.js
 * Frequency Terrain
 */

export const metadata = {
    id: 'bars-frequency-terrain',
    name: 'Frequency Terrain',
    displayName: 'Frequency Terrain',
    description: 'Bars rendered as a filled polygon area chart (like mountain terrain)',
    category: 'Bars',
    subcategory: 'Landscape',
    difficulty: 'Medium',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['terrain', 'mountain', 'smooth'],
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
    requiredRenderer: 'Canvas2DRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'gradient'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffaa',
    barCount: 64,
    gain: 1.0,
    fillOpacity: 0.5
};

export const schema = {
    color: { type: 'color', default: '#00ffaa', label: 'Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Resolution' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    fillOpacity: { type: 'range', min: 0.0, max: 1.0, default: 0.5, step: 0.1, label: 'Fill Opacity' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { width, height } = viewport;
    const { barCount, gain, color, fillOpacity } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const dataArray = spectrum.slice(0, barCount);
    const ctx = renderer.getContext();

    const step = width / (dataArray.length - 1);
    
    ctx.beginPath();
    ctx.moveTo(0, height);

    const points = [];
    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        const x = i * step;
        const y = height - (val * height * gain);
        points.push({x, y});
    }

    // Bezier curve interpolation for smooth mountains
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
    }
    // Line to the last point
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(width, height);
    ctx.closePath();

    // Fill
    ctx.globalAlpha = fillOpacity;
    ctx.fillStyle = color;
    ctx.fill();

    // Stroke line on top
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
}

export function dispose(context) {}
