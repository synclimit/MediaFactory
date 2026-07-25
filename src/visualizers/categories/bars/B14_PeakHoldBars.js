/**
 * B14_PeakHoldBars.js
 * Peak Hold Bars
 */

export const metadata = {
    id: 'bars-peak-hold',
    name: 'Peak Hold',
    displayName: 'Peak Hold Bars',
    description: 'Standard bars with a thin line that marks the peak and slowly falls back down',
    category: 'Bars',
    subcategory: 'Hardware',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['peak', 'hold', 'vu', 'hardware'],
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
    peakColor: '#ffffff',
    barCount: 64,
    barWidth: 6,
    spacing: 2,
    gain: 1.0,
    gravity: 0.15
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Bar Color' },
    peakColor: { type: 'color', default: '#ffffff', label: 'Peak Line Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 6, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    gravity: { type: 'range', min: 0.01, max: 0.5, default: 0.15, step: 0.01, label: 'Peak Fall Speed' }
};

let peakData = [];

export function initialize(context) {
    peakData = new Array(256).fill(0);
}

export function update(context) {
    const { audio, config, deltaTime } = context;
    const { barCount, gravity } = config;
    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    
    // Falloff gravity is adjusted by deltaTime
    const fallAmount = gravity * (deltaTime * 60) * 255; 

    for (let i = 0; i < barCount; i++) {
        const val = spectrum[i];
        if (val >= peakData[i]) {
            peakData[i] = val; // Push up
        } else {
            peakData[i] = Math.max(0, peakData[i] - fallAmount); // Fall down
        }
    }
}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { height } = viewport;
    const { barCount, barWidth, spacing, gain, color, peakColor } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const layout = renderer.computeLinearLayout(barCount, barWidth, spacing, true);
    
    for (let i = 0; i < barCount; i++) {
        const val = spectrum[i] / 255;
        const h = Math.max(2, val * height * gain);
        const x = layout.startX + i * layout.step;
        const y = height - h;

        // Draw main bar
        renderer.drawBar({
            x, y, width: barWidth, height: h,
            color,
            rounded: false,
            outline: false
        });

        // Draw peak line
        const peakVal = peakData[i] / 255;
        const peakH = 2; // Fixed thickness for peak line
        const peakY = height - Math.max(2, peakVal * height * gain) - 4; // 4px gap

        renderer.drawBar({
            x, y: peakY, width: barWidth, height: peakH,
            color: peakColor,
            rounded: false,
            outline: false
        });
    }
}

export function dispose(context) {
    peakData = [];
}
