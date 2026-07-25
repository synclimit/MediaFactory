/**
 * B07_DotMatrixBars.js
 * Dot Matrix Bars
 */

export const metadata = {
    id: 'bars-dot-matrix',
    name: 'Dot Matrix',
    displayName: 'Dot Matrix Bars',
    description: 'Each bar is made of stacked dots/circles instead of solid rectangles',
    category: 'Bars',
    subcategory: 'Hardware',
    difficulty: 'Medium',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ['dot matrix', 'led', 'hardware'],
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
    dimColor: '#003322', // Color for unlit LEDs
    barCount: 32,
    dotSize: 6,
    dotSpacing: 2,
    gain: 1.0
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Lit Color' },
    dimColor: { type: 'color', default: '#003322', label: 'Unlit Color' },
    barCount: { type: 'range', min: 16, max: 128, default: 32, step: 8, label: 'Bands' },
    dotSize: { type: 'range', min: 2, max: 20, default: 6, label: 'Dot Size' },
    dotSpacing: { type: 'range', min: 0, max: 10, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Sensitivity' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { width, height } = viewport;
    const { barCount, dotSize, dotSpacing, gain, color, dimColor } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const dataArray = spectrum.slice(0, barCount);

    const stepX = dotSize + dotSpacing;
    const stepY = dotSize + dotSpacing;
    const totalWidth = dataArray.length * stepX;
    const startX = (width / 2) - (totalWidth / 2);
    
    // Calculate how many dots fit vertically
    const maxDots = Math.floor(height / stepY);

    const ctx = renderer.getContext();

    for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 255;
        // Number of lit dots
        const litDots = Math.floor(val * maxDots * gain);
        const x = startX + i * stepX + (dotSize/2);

        for (let j = 0; j < maxDots; j++) {
            const y = height - (j * stepY) - (dotSize/2);
            
            ctx.beginPath();
            ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
            
            if (j < litDots) {
                ctx.fillStyle = color;
                ctx.fill();
            } else {
                ctx.fillStyle = dimColor;
                ctx.fill();
            }
        }
    }
}

export function dispose(context) {}
