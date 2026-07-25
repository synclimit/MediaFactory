/**
 * B18_FragmentedGlitchBars.js
 * Fragmented Glitch Bars
 */

export const metadata = {
    id: 'bars-fragmented-glitch',
    name: 'Fragmented Glitch',
    displayName: 'Fragmented Glitch Bars',
    description: 'Bars that randomly fragment, shift, and glitch on strong beats',
    category: 'Bars',
    subcategory: 'Experimental',
    difficulty: 'Medium',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ['glitch', 'cyberpunk', 'experimental'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-17',
    updatedAt: '2026-07-17',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: ['glow']
};

export const manifest = {
    requiredRenderer: 'BarsRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    glitchColor: '#ff0055',
    barCount: 64,
    barWidth: 6,
    spacing: 2,
    gain: 1.0,
    glitchIntensity: 20
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Main Color' },
    glitchColor: { type: 'color', default: '#ff0055', label: 'Glitch Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Bands' },
    barWidth: { type: 'range', min: 1, max: 20, default: 6, label: 'Thickness' },
    spacing: { type: 'range', min: 0, max: 20, default: 2, label: 'Spacing' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    glitchIntensity: { type: 'range', min: 0, max: 100, default: 20, label: 'Glitch Amount' }
};

export function initialize(context) {}
export function update(context) {}

export function render(context) {
    const { renderer, audio, config, viewport } = context;
    const { height } = viewport;
    const { barCount, barWidth, spacing, gain, color, glitchColor, glitchIntensity } = config;

    const spectrum = audio.getSpectrum() || new Uint8Array(barCount);
    const bass = audio.getBass() / 255; // 0.0 to 1.0
    
    const layout = renderer.computeLinearLayout(barCount, barWidth, spacing, true);
    
    const isGlitch = bass > 0.8 && Math.random() > 0.5;

    for (let i = 0; i < barCount; i++) {
        const val = spectrum[i] / 255;
        const h = Math.max(2, val * height * gain);
        let x = layout.startX + i * layout.step;
        let y = height - h;
        
        let activeColor = color;

        // Apply glitch offsets and fragmentation
        if (isGlitch) {
            if (Math.random() > 0.8) {
                // Horizontal shift
                x += (Math.random() - 0.5) * glitchIntensity;
                activeColor = glitchColor;
            }
            if (Math.random() > 0.9) {
                // Fragment: Draw multiple small chunks instead of one bar
                const chunks = Math.floor(Math.random() * 3) + 2;
                const chunkH = h / chunks;
                for (let c = 0; c < chunks; c++) {
                    const chunkX = x + (Math.random() - 0.5) * (glitchIntensity / 2);
                    const chunkY = y + (c * chunkH);
                    renderer.drawBar({
                        x: chunkX, y: chunkY, width: barWidth, height: chunkH - 1,
                        color: Math.random() > 0.5 ? color : glitchColor,
                        rounded: false,
                        outline: false
                    });
                }
                continue; // Skip normal drawing
            }
        }

        renderer.drawBar({
            x, y, width: barWidth, height: h,
            color: activeColor,
            rounded: false,
            outline: false
        });
    }
}

export function dispose(context) {}
