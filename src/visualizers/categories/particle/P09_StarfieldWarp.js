/**
 * P09_StarfieldWarp.js
 * Starfield 3D Warp Flight Particle Visualizer
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'particle-starfield-warp',
    name: 'StarfieldWarp',
    displayName: 'Starfield 3D Warp',
    description: 'Particles fly outward from center in 3D perspective, speed reacts to music beat',
    category: 'Particle',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    thumbnail: null,
    previewVideo: null,
    tags: ["particle","starfield","warp","3d","outward"],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-08-02',
    updatedAt: '2026-08-02',
    package: 'core',
    license: 'MIT',
    visibility: 'public'
};

export const manifest = {
    requiredRenderer: 'Canvas2DRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'reflection', 'gradient'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffff',
    barCount: 64,
    gain: 1.0
};

export const schema = {
    color: { type: 'color', default: '#00ffff', label: 'Star Color' },
    barCount: { type: 'range', min: 16, max: 256, default: 64, step: 16, label: 'Audio Frequency Bands' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Warp Speed Multiplier' }
};

export function initialize(context) {
    const { state } = context;
    state.stars = null;
}

export function update(context) {}

export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { color, barCount, gain } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;

    if (!state.stars) {
        state.stars = [];
        for (let i = 0; i < 400; i++) {
            state.stars.push({
                x: (Math.random() - 0.5) * viewport.width * 2,
                y: (Math.random() - 0.5) * viewport.height * 2,
                z: Math.random() * 1000
            });
        }
    }

    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let sum = 0;
    for (let i = 0; i < 5; i++) sum += rawData[i] || 0;
    const bass = (sum / 5) / 255;

    const cx = viewport.width / 2;
    const cy = viewport.height / 2;

    const warpSpeed = 150 + (bass * 1200 * (gain || 1.0));
    ctx.fillStyle = color || '#00ffff';

    for (let i = 0; i < state.stars.length; i++) {
        const s = state.stars[i];

        s.z -= warpSpeed * (deltaTime || 0.016);

        if (s.z <= 1) {
            s.z = 1000;
            s.x = (Math.random() - 0.5) * viewport.width * 2;
            s.y = (Math.random() - 0.5) * viewport.height * 2;
        }

        const fov = 256;
        const scale = fov / s.z;
        const x2d = cx + s.x * scale;
        const y2d = cy + s.y * scale;

        // Draw star and motion streak
        if (x2d >= 0 && x2d <= viewport.width && y2d >= 0 && y2d <= viewport.height) {
            const alpha = Math.max(0, Math.min(1, 1 - (s.z / 1000)));
            const size = Math.max(0.8, 3.5 * scale);

            // Previous position line (streak effect)
            const prevScale = fov / (s.z + warpSpeed * 0.03);
            const px2d = cx + s.x * prevScale;
            const py2d = cy + s.y * prevScale;

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color || '#00ffff';
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(px2d, py2d);
            ctx.lineTo(x2d, y2d);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x2d, y2d, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}
